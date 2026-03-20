import express, { Request, Response } from 'express';
import { pool } from '../index';

const router = express.Router();

// Get all deals
router.get('/', async (req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT deals.*, users.username FROM deals JOIN users ON deals.posted_by = users.id ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch deals' });
  }
});

// Create a new deal
router.post('/', async (req: Request, res: Response) => {
  const { title, description, price, original_price, image_url, store_name, posted_by, link } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO deals (title, description, price, original_price, image_url, store_name, posted_by, temperature, link) VALUES ($1, $2, $3, $4, $5, $6, $7, 0, $8) RETURNING *',
      [title, description, price, original_price, image_url, store_name, posted_by, link]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create deal' });
  }
});

// Update a deal
router.put('/:id', async (req: Request, res: Response) => {
  const dealId = req.params.id;
  const { title, description, price, original_price, image_url, store_name, link, user_id } = req.body;
  try {
    // Basic verification could be added here, but frontend checks it. Better practice is to check via DB query:
    const dealRes = await pool.query('SELECT posted_by FROM deals WHERE id = $1', [dealId]);
    if (dealRes.rows.length === 0) return res.status(404).json({ error: 'Deal not found' });
    
    const userRes = await pool.query('SELECT is_admin FROM users WHERE id = $1', [user_id]);
    const isAdmin = userRes.rows[0]?.is_admin;
    
    if (dealRes.rows[0].posted_by !== user_id && !isAdmin) {
      return res.status(403).json({ error: 'Not authorized to edit this deal' });
    }

    const result = await pool.query(
      'UPDATE deals SET title = $1, description = $2, price = $3, original_price = $4, image_url = $5, store_name = $6, link = $7 WHERE id = $8 RETURNING *',
      [title, description, price, original_price, image_url, store_name, link, dealId]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update deal' });
  }
});

// Delete a deal
router.delete('/:id', async (req: Request, res: Response) => {
  const dealId = req.params.id;
  const { user_id } = req.body;
  
  try {
    const dealRes = await pool.query('SELECT posted_by FROM deals WHERE id = $1', [dealId]);
    if (dealRes.rows.length === 0) return res.status(404).json({ error: 'Deal not found' });
    
    if (!user_id) return res.status(401).json({ error: 'User ID required' });

    const userRes = await pool.query('SELECT is_admin FROM users WHERE id = $1', [user_id]);
    const isAdmin = userRes.rows[0]?.is_admin;
    
    if (dealRes.rows[0].posted_by !== Number(user_id) && !isAdmin) {
      return res.status(403).json({ error: 'Not authorized to delete this deal' });
    }

    await pool.query('DELETE FROM deals WHERE id = $1', [dealId]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete deal' });
  }
});

// Endpoint to upvote/downvote (temperature)
router.post('/:id/vote', async (req: Request, res: Response) => {
  const dealId = req.params.id;
  const { vote } = req.body; // 'up' or 'down'
  
  try {
    const increment = vote === 'up' ? 1 : -1;
    const result = await pool.query(
      'UPDATE deals SET temperature = temperature + $1 WHERE id = $2 RETURNING *',
      [increment, dealId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Deal not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to vote' });
  }
});

// Add to favorites
router.post('/:id/favorite', async (req: Request, res: Response) => {
  const dealId = req.params.id;
  const { user_id } = req.body;
  try {
    await pool.query('INSERT INTO favorites (user_id, deal_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [user_id, dealId]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to add favorite' });
  }
});

// Remove from favorites
router.delete('/:id/favorite/:userId', async (req: Request, res: Response) => {
  const dealId = req.params.id;
  const userId = req.params.userId;
  try {
    await pool.query('DELETE FROM favorites WHERE user_id = $1 AND deal_id = $2', [userId, dealId]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to remove favorite' });
  }
});

export default router;
