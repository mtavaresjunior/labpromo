import { Router, Request, Response } from 'express';
import { pool } from '../index';

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

// Admin: Get all products
router.get('/', async (req: Request, res: Response) => {
    try {
        const result = await pool.query("SELECT * FROM products ORDER BY name ASC");
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error fetching all products' });
    }
});

// Admin: Update a product
router.put('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { name, category } = req.body;
        
        if (!name) return res.status(400).json({ error: 'Name is required' });

        const result = await pool.query(
            "UPDATE products SET name = $1, category = $2 WHERE id = $3 RETURNING *",
            [name, category || 'Outros', id]
        );

        if (result.rows.length === 0) return res.status(404).json({ error: 'Product not found' });
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        res.status(500).json({ error: 'Server error updating product: ' + errorMessage });
    }
});

// Admin: Delete a product
router.delete('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await pool.query("DELETE FROM products WHERE id = $1", [id]);
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error deleting product' });
    }
});

export default router;
