import { describe, it, expect, beforeAll, vi } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import * as nvidiaService from '../src/services/nvidiaService.js';

describe('AiRus Backend API Test Suite', () => {
  let userToken1 = '';
  let userToken2 = '';
  let userId1 = '';
  let userId2 = '';
  let testConvId = '';

  beforeAll(async () => {
    // Mock generateChatResponse to avoid external network calls during tests
    vi.spyOn(nvidiaService, 'generateChatResponse').mockImplementation(async (history, userMessage) => {
      return {
        content: `AiRus Response: I heard you say "${userMessage}", Boss!`,
        model: 'meta/llama-3.1-70b-instruct',
        usage: { prompt_tokens: 15, completion_tokens: 12, total_tokens: 27 }
      };
    });
  });

  describe('1. Health & Status Checks', () => {
    it('GET /api/health returns healthy system status', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('healthy');
      expect(res.body.service).toBe('AiRus Voice AI Backend');
      expect(res.body.database).toBeDefined();
    });
  });

  describe('2. Authentication & Account Management', () => {
    it('Fails registration when fields are missing', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'surya@example.com' });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('Fails registration with short password (< 6 chars)', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Surya', email: 'surya@example.com', password: '123' });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('Successfully registers primary user (Surya)', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Surya',
          email: 'surya.boss@airus.ai',
          password: 'SecretPassword123!'
        });
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.email).toBe('surya.boss@airus.ai');
      userToken1 = res.body.token;
      userId1 = res.body.user.id;
    });

    it('Rejects duplicate registration with identical email', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Surya Duplicate',
          email: 'surya.boss@airus.ai',
          password: 'SecretPassword123!'
        });
      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
    });

    it('Registers secondary user for isolation tests', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Other User',
          email: 'other@example.com',
          password: 'OtherPassword123!'
        });
      expect(res.status).toBe(201);
      userToken2 = res.body.token;
      userId2 = res.body.user.id;
    });

    it('Fails login with wrong password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'surya.boss@airus.ai',
          password: 'WrongPassword'
        });
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('Successfully logs in with valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'surya.boss@airus.ai',
          password: 'SecretPassword123!'
        });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
    });

    it('GET /api/auth/me returns authenticated user details', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${userToken1}`);
      expect(res.status).toBe(200);
      expect(res.body.user.email).toBe('surya.boss@airus.ai');
    });

    it('GET /api/auth/me rejects unauthenticated request with 401', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
    });
  });

  describe('3. Multi-Turn Conversation & User Isolation', () => {
    it('Creates a new conversation for User 1', async () => {
      const res = await request(app)
        .post('/api/conversations')
        .set('Authorization', `Bearer ${userToken1}`)
        .send({ title: 'Morning Briefing' });
      expect(res.status).toBe(201);
      expect(res.body.conversation.title).toBe('Morning Briefing');
      testConvId = res.body.conversation.id;
    });

    it('Sends a message and receives AI response', async () => {
      const res = await request(app)
        .post(`/api/conversations/${testConvId}/messages`)
        .set('Authorization', `Bearer ${userToken1}`)
        .send({ content: 'Hello AiRus, what is the plan today?' });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.userMessage.content).toBe('Hello AiRus, what is the plan today?');
      expect(res.body.assistantMessage.content).toContain('AiRus Response');
    });

    it('Retrieves conversation details and messages', async () => {
      const res = await request(app)
        .get(`/api/conversations/${testConvId}`)
        .set('Authorization', `Bearer ${userToken1}`);
      expect(res.status).toBe(200);
      expect(res.body.messages.length).toBe(2); // 1 user + 1 assistant
    });

    it('Enforces per-user conversation isolation: User 2 CANNOT access User 1 conversation', async () => {
      const res = await request(app)
        .get(`/api/conversations/${testConvId}`)
        .set('Authorization', `Bearer ${userToken2}`);
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('Enforces per-user conversation isolation: User 2 CANNOT send message to User 1 conversation', async () => {
      const res = await request(app)
        .post(`/api/conversations/${testConvId}/messages`)
        .set('Authorization', `Bearer ${userToken2}`)
        .send({ content: 'Intruding message' });
      expect(res.status).toBe(404);
    });

    it('Enforces per-user conversation isolation: User 2 CANNOT delete User 1 conversation', async () => {
      const res = await request(app)
        .delete(`/api/conversations/${testConvId}`)
        .set('Authorization', `Bearer ${userToken2}`);
      expect(res.status).toBe(404);
    });

    it('User 1 can successfully delete their own conversation', async () => {
      const res = await request(app)
        .delete(`/api/conversations/${testConvId}`)
        .set('Authorization', `Bearer ${userToken1}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
