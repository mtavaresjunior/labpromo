import express, { Request, Response } from 'express';
import { pool } from '../index';

const router = express.Router();

// Get comments for a deal
router.get('/deal/:dealId', async (req: Request, res: Response) => {
  const { dealId } = req.params;
  try {
    const result = await pool.query(
      'SELECT comments.*, users.username FROM comments JOIN users ON comments.user_id = users.id WHERE deal_id = $1 ORDER BY created_at ASC',
      [dealId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

// Create a comment
router.post('/deal/:dealId', async (req: Request, res: Response) => {
  const { dealId } = req.params;
  const { content, user_id, parent_id } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO comments (deal_id, user_id, content, parent_id) VALUES ($1, $2, $3, $4) RETURNING *',
      [dealId, user_id, content, parent_id || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create comment' });
  }
});

// Delete a comment
router.delete('/:id', async (req: Request, res: Response) => {
  const commentId = req.params.id;
  const { user_id } = req.body;
  
  try {
    const commentRes = await pool.query('SELECT user_id FROM comments WHERE id = $1', [commentId]);
    if (commentRes.rows.length === 0) return res.status(404).json({ error: 'Comment not found' });
    
    if (!user_id) return res.status(401).json({ error: 'User ID required' });

    const userRes = await pool.query('SELECT is_admin FROM users WHERE id = $1', [user_id]);
    const isAdmin = userRes.rows[0]?.is_admin;
    
    if (commentRes.rows[0].user_id !== Number(user_id) && !isAdmin) {
      return res.status(403).json({ error: 'Not authorized to delete this comment' });
    }

    await pool.query('DELETE FROM comments WHERE id = $1', [commentId]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete comment' });
  }
});

export default router;
