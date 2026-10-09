import express from 'express';
import {
  createConversation,
  listConversations,
  getConversation,
  deleteConversation,
  sendMessage
} from '../controllers/conversationController.js';
import { requireAuth } from '../middleware/auth.js';
import { chatLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// All conversation endpoints require authentication
router.use(requireAuth);

router.post('/', createConversation);
router.get('/', listConversations);
router.get('/:id', getConversation);
router.delete('/:id', deleteConversation);
router.post('/:id/messages', chatLimiter, sendMessage);

export default router;
