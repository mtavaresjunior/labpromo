import { Router, Request, Response } from 'express';
import { pool } from '../index';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';

const router = Router();

function parseId(value: string): number | null {
  const id = parseInt(value, 10);
  return isNaN(id) || id <= 0 ? null : id;
}

// ─── BUSCAR PRODUTO POR NOME (público — autocomplete) ─────────────────────────
router.get('/search', async (req: Request, res: Response) => {
  const query = req.query.q as string;
  if (!query?.trim() || query.trim().length > 100) {
    res.json([]);
    return;
  }
  try {
    const result = await pool.query(
      'SELECT * FROM products WHERE name ILIKE $1 LIMIT 10',
      [`%${query.trim()}%`]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('[SEARCH PRODUCTS]', err);
    res.status(500).json({ error: 'Erro ao buscar produtos' });
  }
});

// ─── HISTÓRICO DE PREÇOS (público) ────────────────────────────────────────────
router.get('/:id/history', async (req: Request, res: Response) => {
  const id = parseId(req.params.id);
  if (!id) {
    res.status(400).json({ error: 'ID inválido' });
    return;
  }
  try {
    const result = await pool.query(
      'SELECT id, price, store_name, recorded_at FROM price_history WHERE product_id = $1 ORDER BY recorded_at ASC',
      [id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('[PRICE HISTORY]', err);
    res.status(500).json({ error: 'Erro ao buscar histórico de preços' });
  }
});

// ─── LISTAR TODOS OS PRODUTOS (admin) ────────────────────────────────────────
router.get('/', authenticate, requireAdmin, async (_req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM products ORDER BY name ASC');
    res.json(result.rows);
  } catch (err) {
    console.error('[LIST PRODUCTS]', err);
    res.status(500).json({ error: 'Erro ao listar produtos' });
  }
});

// ─── CRIAR PRODUTO (admin) ────────────────────────────────────────────────────
router.post('/', authenticate, requireAdmin, async (_req: AuthRequest, res: Response) => {
  const { name, category } = _req.body;
  if (!name?.trim() || name.trim().length > 200) {
    res.status(400).json({ error: 'Nome do produto é obrigatório (máx. 200 caracteres)' });
    return;
  }
  try {
    const result = await pool.query(
      'INSERT INTO products (name, category) VALUES ($1, $2) RETURNING *',
      [name.trim(), category || 'Outros']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('[CREATE PRODUCT]', err);
    res.status(500).json({ error: 'Erro ao criar produto' });
  }
});

// ─── ATUALIZAR PRODUTO (admin) ────────────────────────────────────────────────
router.put('/:id', authenticate, requireAdmin, async (req: Request, res: Response) => {
  const id = parseId(req.params.id);
  if (!id) {
    res.status(400).json({ error: 'ID inválido' });
    return;
  }

  const { name, category } = req.body;
  if (!name?.trim() || name.trim().length > 200) {
    res.status(400).json({ error: 'Nome do produto é obrigatório (máx. 200 caracteres)' });
    return;
  }

  try {
    const result = await pool.query(
      'UPDATE products SET name = $1, category = $2 WHERE id = $3 RETURNING *',
      [name.trim(), category || 'Outros', id]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Produto não encontrado' });
      return;
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('[UPDATE PRODUCT]', err);
    res.status(500).json({ error: 'Erro ao atualizar produto' });
  }
});

// ─── EXCLUIR PRODUTO (admin) ──────────────────────────────────────────────────
router.delete('/:id', authenticate, requireAdmin, async (req: Request, res: Response) => {
  const id = parseId(req.params.id);
  if (!id) {
    res.status(400).json({ error: 'ID inválido' });
    return;
  }
  try {
    await pool.query('DELETE FROM products WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    console.error('[DELETE PRODUCT]', err);
    res.status(500).json({ error: 'Erro ao excluir produto' });
  }
});

export default router;
