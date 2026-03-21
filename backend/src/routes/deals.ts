import express, { Request, Response } from 'express';
import { pool } from '../index';

const router = express.Router();

// Get all deals
router.get('/', async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT deals.*, users.username,
             (SELECT COUNT(*) FROM comments WHERE comments.deal_id = deals.id) as comments_count
      FROM deals 
      JOIN users ON deals.posted_by = users.id 
      ORDER BY created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch deals' });
  }
});

// Create a new deal
router.post('/', async (req: Request, res: Response) => {
  const { title, description, price, original_price, image_url, store_name, posted_by, link, category, product_id } = req.body;
  const dealCategory = category || 'Outros';
  const origPrice = original_price === '' ? null : original_price;

  try {
    const result = await pool.query(
      'INSERT INTO deals (title, description, price, original_price, image_url, store_name, category, posted_by, likes_count, dislikes_count, link, product_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 0, 0, $9, $10) RETURNING *',
      [title, description, price, origPrice, image_url, store_name, dealCategory, posted_by, link, product_id || null]
    );
    
    if (product_id) {
      await pool.query(
        'INSERT INTO price_history (product_id, price, store_name, deal_id) VALUES ($1, $2, $3, $4)',
        [product_id, price, store_name || 'Outras', result.rows[0].id]
      );
    }
    
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: 'Failed to create deal: ' + errorMessage });
  }
});

// Update a deal
router.put('/:id', async (req: Request, res: Response) => {
  const dealId = req.params.id;
  const { title, description, price, original_price, image_url, store_name, link, category, user_id, product_id } = req.body;
  const dealCategory = category || 'Outros';
  const origPrice = original_price === '' ? null : original_price;

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
      'UPDATE deals SET title = $1, description = $2, price = $3, original_price = $4, image_url = $5, store_name = $6, link = $7, category = $8, product_id = $9 WHERE id = $10 RETURNING *',
      [title, description, price, origPrice, image_url, store_name, link, dealCategory, product_id || null, dealId]
    );
    
    if (product_id) {
      await pool.query(
        'INSERT INTO price_history (product_id, price, store_name, deal_id) VALUES ($1, $2, $3, $4)',
        [product_id, price, store_name || 'Outras', dealId]
      );
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: 'Failed to update deal: ' + errorMessage });
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

// Endpoint to upvote/downvote
router.post('/:id/vote', async (req: Request, res: Response) => {
  const dealId = req.params.id;
  const { user_id, vote } = req.body; // 'up' or 'down'

  if (!user_id) return res.status(401).json({ error: 'User ID required to vote' });
  
  try {
    const voteType = vote === 'up' ? 1 : -1;
    const existingVoteRes = await pool.query('SELECT vote_type FROM deal_votes WHERE user_id = $1 AND deal_id = $2', [user_id, dealId]);
    
    if (existingVoteRes.rows.length > 0) {
      const existingVote = existingVoteRes.rows[0].vote_type;
      if (existingVote === voteType) {
        // remove vote
        await pool.query('DELETE FROM deal_votes WHERE user_id = $1 AND deal_id = $2', [user_id, dealId]);
        if (voteType === 1) await pool.query('UPDATE deals SET likes_count = likes_count - 1 WHERE id = $1', [dealId]);
        else await pool.query('UPDATE deals SET dislikes_count = dislikes_count - 1 WHERE id = $1', [dealId]);
      } else {
        // change vote
        await pool.query('UPDATE deal_votes SET vote_type = $1 WHERE user_id = $2 AND deal_id = $3', [voteType, user_id, dealId]);
        if (voteType === 1) await pool.query('UPDATE deals SET likes_count = likes_count + 1, dislikes_count = dislikes_count - 1 WHERE id = $1', [dealId]);
        else await pool.query('UPDATE deals SET dislikes_count = dislikes_count + 1, likes_count = likes_count - 1 WHERE id = $1', [dealId]);
      }
    } else {
      // new vote
      await pool.query('INSERT INTO deal_votes (user_id, deal_id, vote_type) VALUES ($1, $2, $3)', [user_id, dealId, voteType]);
      if (voteType === 1) await pool.query('UPDATE deals SET likes_count = likes_count + 1 WHERE id = $1', [dealId]);
      else await pool.query('UPDATE deals SET dislikes_count = dislikes_count + 1 WHERE id = $1', [dealId]);
    }
    
    const result = await pool.query('SELECT * FROM deals WHERE id = $1', [dealId]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Deal not found' });
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to vote' });
  }
});

// Endpoint to get user votes
router.get('/user-votes/:userId', async (req: Request, res: Response) => {
  const userId = req.params.userId;
  try {
    const result = await pool.query('SELECT deal_id, vote_type FROM deal_votes WHERE user_id = $1', [userId]);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch user votes' });
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
