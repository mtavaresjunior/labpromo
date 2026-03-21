import { Router, Request, Response } from 'express';
import pool from '../db';

const router = Router();

// Search products by name (for autocomplete)
router.get('/search', async (req: Request, res: Response) => {
    try {
        const query = req.query.q as string;
        if (!query) {
            return res.json([]);
        }

        const result = await pool.query(
            "SELECT * FROM products WHERE name ILIKE $1 LIMIT 10",
            [`%${query}%`]
        );

        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error searching products' });
    }
});

// Create a new product
router.post('/', async (req: Request, res: Response) => {
    try {
        const { name, category } = req.body;
        
        if (!name) {
            return res.status(400).json({ error: 'Name is required' });
        }

        const result = await pool.query(
            "INSERT INTO products (name, category) VALUES ($1, $2) RETURNING *",
            [name, category || 'Outros']
        );

        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error creating product' });
    }
});

// Get price history for a product
router.get('/:id/history', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            "SELECT id, price, store_name, recorded_at FROM price_history WHERE product_id = $1 ORDER BY recorded_at ASC",
            [id]
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error fetching price history' });
    }
});

export default router;
