import { query } from '../database/db.js';
import { generateChatResponse } from '../services/nvidiaService.js';

export async function createConversation(req, res, next) {
  try {
    const { title } = req.body;
    const conversationTitle = (title && typeof title === 'string' && title.trim()) 
      ? title.trim().slice(0, 100) 
      : 'New Conversation';

    const result = await query(
      'INSERT INTO conversations (user_id, title) VALUES ($1, $2) RETURNING id, user_id, title, created_at, updated_at',
      [req.user.id, conversationTitle]
    );

    return res.status(201).json({
      success: true,
      conversation: result.rows[0]
    });
  } catch (err) {
    next(err);
  }
}

export async function listConversations(req, res, next) {
  try {
    const result = await query(
      'SELECT id, title, created_at, updated_at FROM conversations WHERE user_id = $1 ORDER BY updated_at DESC',
      [req.user.id]
    );

    return res.json({
      success: true,
      conversations: result.rows
    });
  } catch (err) {
    next(err);
  }
}

export async function getConversation(req, res, next) {
  try {
    const { id } = req.params;

    // Strict ownership verification
    const convResult = await query(
      'SELECT id, title, created_at, updated_at FROM conversations WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );

    if (convResult.rowCount === 0) {
      return res.status(404).json({
        success: false,
        error: 'Conversation not found or unauthorized.'
      });
    }

    const messagesResult = await query(
      'SELECT id, conversation_id, role, content, metadata, created_at FROM messages WHERE conversation_id = $1 ORDER BY created_at ASC',
      [id]
    );

    return res.json({
      success: true,
      conversation: convResult.rows[0],
      messages: messagesResult.rows
    });
  } catch (err) {
    next(err);
  }
}

export async function deleteConversation(req, res, next) {
  try {
    const { id } = req.params;

    const result = await query(
      'DELETE FROM conversations WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, req.user.id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        error: 'Conversation not found or unauthorized.'
      });
    }

    return res.json({
      success: true,
      message: 'Conversation deleted successfully.'
    });
  } catch (err) {
    next(err);
  }
}

export async function sendMessage(req, res, next) {
  try {
    const { id } = req.params;
    const { content, verbosity, style } = req.body;
    const conversationVerbosity = verbosity || style || 'natural';

    if (!content || typeof content !== 'string' || !content.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Message content cannot be empty.'
      });
    }

    const trimmedContent = content.trim();
    if (trimmedContent.length > 4000) {
      return res.status(400).json({
        success: false,
        error: 'Message content exceeds maximum allowed length of 4000 characters.'
      });
    }

    // Verify ownership
    const convResult = await query(
      'SELECT id, title FROM conversations WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );

    if (convResult.rowCount === 0) {
      return res.status(404).json({
        success: false,
        error: 'Conversation not found or unauthorized.'
      });
    }

    const conversation = convResult.rows[0];

    // Fetch prior messages for multi-turn context
    const priorMessagesResult = await query(
      'SELECT role, content FROM messages WHERE conversation_id = $1 ORDER BY created_at ASC',
      [id]
    );

    // Save user message to database
    const userMsgResult = await query(
      'INSERT INTO messages (conversation_id, role, content) VALUES ($1, $2, $3) RETURNING id, conversation_id, role, content, created_at',
      [id, 'user', trimmedContent]
    );
    const savedUserMessage = userMsgResult.rows[0];

    // Query NVIDIA AI Service
    let aiResponse;
    try {
      aiResponse = await generateChatResponse(priorMessagesResult.rows, trimmedContent, {
        verbosity: conversationVerbosity
      });
    } catch (aiErr) {
      console.error('[AI Generation Failure]', aiErr.message);
      // We return the error cleanly to the user; user message was stored
      return res.status(aiErr.statusCode || 502).json({
        success: false,
        error: aiErr.message || 'Failed to generate AI response from NVIDIA endpoint.',
        userMessage: savedUserMessage
      });
    }

    // Save assistant message to database
    const assistantMsgResult = await query(
      'INSERT INTO messages (conversation_id, role, content, metadata) VALUES ($1, $2, $3, $4) RETURNING id, conversation_id, role, content, metadata, created_at',
      [id, 'assistant', aiResponse.content, JSON.stringify({ model: aiResponse.model, usage: aiResponse.usage })]
    );
    const savedAssistantMessage = assistantMsgResult.rows[0];

    // Update conversation updated_at and update title if it's the first message
    let newTitle = conversation.title;
    if (conversation.title === 'New Conversation' && priorMessagesResult.rows.length === 0) {
      newTitle = trimmedContent.slice(0, 30) + (trimmedContent.length > 30 ? '...' : '');
      await query(
        'UPDATE conversations SET title = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND user_id = $3',
        [newTitle, id, req.user.id]
      );
    } else {
      await query(
        'UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = $1',
        [id]
      );
    }

    return res.json({
      success: true,
      userMessage: savedUserMessage,
      assistantMessage: savedAssistantMessage,
      conversationTitle: newTitle
    });
  } catch (err) {
    next(err);
  }
}
