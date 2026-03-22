import express, { Request, Response } from 'express';
import { pool } from '../index';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = express.Router();

// ─── Validação de ID numérico ─────────────────────────────────────────────────
function parseId(value: string | string[]): number | null {
  const str = Array.isArray(value) ? value[0] : value;
  const id  = parseInt(str, 10);
  return isNaN(id) || id <= 0 ? null : id;
}

// ─── LISTAR DEALS (público) ───────────────────────────────────────────────────
router.get('/', async (req: Request, res: Response) => {
  try {
    const page  = parseInt(req.query.page  as string, 10);
    const limit = parseInt(req.query.limit as string, 10);

    let queryStr = `
      SELECT deals.*, users.username,
             (SELECT COUNT(*) FROM comments WHERE comments.deal_id = deals.id) AS comments_count
      FROM deals
      JOIN users ON deals.posted_by = users.id
      ORDER BY created_at DESC
    `;
    const params: (number)[] = [];

    if (!isNaN(limit) && limit > 0 && !isNaN(page) && page > 0) {
      queryStr += ' LIMIT $1 OFFSET $2';
      params.push(Math.min(limit, 100), (page - 1) * limit);
    }

    const result = await pool.query(queryStr, params);
    res.json(result.rows);
  } catch (err) {
    console.error('[GET DEALS]', err);
    res.status(500).json({ error: 'Erro ao buscar promoções' });
  }
});

// ─── CRIAR DEAL (autenticado) ─────────────────────────────────────────────────
router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  const { title, description, price, original_price, image_url, store_name, link, category, product_id } = req.body;

  // Validação de campos obrigatórios
  if (!title?.trim() || title.trim().length > 200) {
    res.status(400).json({ error: 'Título é obrigatório e deve ter no máximo 200 caracteres' });
    return;
  }
  if (!description?.trim() || description.trim().length > 5000) {
    res.status(400).json({ error: 'Descrição é obrigatória e deve ter no máximo 5000 caracteres' });
    return;
  }
  const parsedPrice = parseFloat(price);
  if (isNaN(parsedPrice) || parsedPrice < 0) {
    res.status(400).json({ error: 'Preço inválido' });
    return;
  }

  const dealCategory = typeof category === 'string' ? category : 'Outros';
  const origPrice = original_price === '' || original_price === undefined ? null : parseFloat(original_price);
  const postedBy = req.user!.id;

  try {
    const result = await pool.query(
      `INSERT INTO deals (title, description, price, original_price, image_url, store_name, category, posted_by, likes_count, dislikes_count, link, product_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 0, 0, $9, $10)
       RETURNING *`,
      [title.trim(), description.trim(), parsedPrice, origPrice, image_url || null, store_name || null, dealCategory, postedBy, link || null, product_id || null]
    );

    if (product_id) {
      await pool.query(
        'INSERT INTO price_history (product_id, price, store_name, deal_id) VALUES ($1, $2, $3, $4)',
        [product_id, parsedPrice, store_name || 'Outras', result.rows[0].id]
      );
    }

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('[CREATE DEAL]', err);
    res.status(500).json({ error: 'Erro ao criar promoção' });
  }
});

// ─── ATUALIZAR DEAL (autenticado, dono ou admin) ──────────────────────────────
router.put('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  const dealId = parseId(req.params.id);
  if (!dealId) {
    res.status(400).json({ error: 'ID inválido' });
    return;
  }

  const { title, description, price, original_price, image_url, store_name, link, category, product_id } = req.body;

  if (!title?.trim() || title.trim().length > 200) {
    res.status(400).json({ error: 'Título é obrigatório e deve ter no máximo 200 caracteres' });
    return;
  }

  const parsedPrice = parseFloat(price);
  if (isNaN(parsedPrice) || parsedPrice < 0) {
    res.status(400).json({ error: 'Preço inválido' });
    return;
  }

  try {
    const dealRes = await pool.query('SELECT posted_by FROM deals WHERE id = $1', [dealId]);
    if (dealRes.rows.length === 0) {
      res.status(404).json({ error: 'Promoção não encontrada' });
      return;
    }

    const isOwner = dealRes.rows[0].posted_by === req.user!.id;
    if (!isOwner && !req.user!.is_admin) {
      res.status(403).json({ error: 'Sem permissão para editar esta promoção' });
      return;
    }

    const dealCategory = typeof category === 'string' ? category : 'Outros';
    const origPrice = original_price === '' || original_price === undefined ? null : parseFloat(original_price);

    const result = await pool.query(
      `UPDATE deals
       SET title = $1, description = $2, price = $3, original_price = $4,
           image_url = $5, store_name = $6, link = $7, category = $8, product_id = $9
       WHERE id = $10
       RETURNING *`,
      [title.trim(), description?.trim() || null, parsedPrice, origPrice, image_url || null, store_name || null, link || null, dealCategory, product_id || null, dealId]
    );

    if (product_id) {
      await pool.query(
        'INSERT INTO price_history (product_id, price, store_name, deal_id) VALUES ($1, $2, $3, $4)',
        [product_id, parsedPrice, store_name || 'Outras', dealId]
      );
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('[UPDATE DEAL]', err);
    res.status(500).json({ error: 'Erro ao atualizar promoção' });
  }
});

// ─── EXCLUIR DEAL (autenticado, dono ou admin) ────────────────────────────────
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  const dealId = parseId(req.params.id);
  if (!dealId) {
    res.status(400).json({ error: 'ID inválido' });
    return;
  }

  try {
    const dealRes = await pool.query('SELECT posted_by FROM deals WHERE id = $1', [dealId]);
    if (dealRes.rows.length === 0) {
      res.status(404).json({ error: 'Promoção não encontrada' });
      return;
    }

    const isOwner = dealRes.rows[0].posted_by === req.user!.id;
    if (!isOwner && !req.user!.is_admin) {
      res.status(403).json({ error: 'Sem permissão para excluir esta promoção' });
      return;
    }

    await pool.query('DELETE FROM deals WHERE id = $1', [dealId]);
    res.json({ success: true });
  } catch (err) {
    console.error('[DELETE DEAL]', err);
    res.status(500).json({ error: 'Erro ao excluir promoção' });
  }
});

// ─── VOTAR EM DEAL (autenticado) ──────────────────────────────────────────────
router.post('/:id/vote', authenticate, async (req: AuthRequest, res: Response) => {
  const dealId = parseId(req.params.id);
  if (!dealId) {
    res.status(400).json({ error: 'ID inválido' });
    return;
  }

  const { vote } = req.body;
  if (vote !== 'up' && vote !== 'down') {
    res.status(400).json({ error: 'Voto inválido. Use "up" ou "down"' });
    return;
  }

  const userId = req.user!.id;
  const voteType = vote === 'up' ? 1 : -1;

  try {
    const existingVoteRes = await pool.query(
      'SELECT vote_type FROM deal_votes WHERE user_id = $1 AND deal_id = $2',
      [userId, dealId]
    );

    if (existingVoteRes.rows.length > 0) {
      const existing = existingVoteRes.rows[0].vote_type;
      if (existing === voteType) {
        // Remove o voto
        await pool.query('DELETE FROM deal_votes WHERE user_id = $1 AND deal_id = $2', [userId, dealId]);
        if (voteType === 1) await pool.query('UPDATE deals SET likes_count = likes_count - 1 WHERE id = $1', [dealId]);
        else await pool.query('UPDATE deals SET dislikes_count = dislikes_count - 1 WHERE id = $1', [dealId]);
      } else {
        // Troca o voto
        await pool.query('UPDATE deal_votes SET vote_type = $1 WHERE user_id = $2 AND deal_id = $3', [voteType, userId, dealId]);
        if (voteType === 1) await pool.query('UPDATE deals SET likes_count = likes_count + 1, dislikes_count = dislikes_count - 1 WHERE id = $1', [dealId]);
        else await pool.query('UPDATE deals SET dislikes_count = dislikes_count + 1, likes_count = likes_count - 1 WHERE id = $1', [dealId]);
      }
    } else {
      // Novo voto
      await pool.query('INSERT INTO deal_votes (user_id, deal_id, vote_type) VALUES ($1, $2, $3)', [userId, dealId, voteType]);
      if (voteType === 1) await pool.query('UPDATE deals SET likes_count = likes_count + 1 WHERE id = $1', [dealId]);
      else await pool.query('UPDATE deals SET dislikes_count = dislikes_count + 1 WHERE id = $1', [dealId]);
    }

    const result = await pool.query('SELECT * FROM deals WHERE id = $1', [dealId]);
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Promoção não encontrada' });
      return;
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('[VOTE DEAL]', err);
    res.status(500).json({ error: 'Erro ao votar' });
  }
});

// ─── VOTOS DO USUÁRIO (autenticado, próprio usuário) ─────────────────────────
router.get('/user-votes/:userId', authenticate, async (req: AuthRequest, res: Response) => {
  const targetId = parseId(req.params.userId);
  if (!targetId) {
    res.status(400).json({ error: 'ID inválido' });
    return;
  }

  if (req.user!.id !== targetId) {
    res.status(403).json({ error: 'Sem permissão para ver votos de outro usuário' });
    return;
  }

  try {
    const result = await pool.query(
      'SELECT deal_id, vote_type FROM deal_votes WHERE user_id = $1',
      [targetId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('[USER VOTES]', err);
    res.status(500).json({ error: 'Erro ao buscar votos' });
  }
});

// ─── FAVORITAR (autenticado) ──────────────────────────────────────────────────
router.post('/:id/favorite', authenticate, async (req: AuthRequest, res: Response) => {
  const dealId = parseId(req.params.id);
  if (!dealId) {
    res.status(400).json({ error: 'ID inválido' });
    return;
  }

  const userId = req.user!.id;
  try {
    await pool.query(
      'INSERT INTO favorites (user_id, deal_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [userId, dealId]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('[FAVORITE]', err);
    res.status(500).json({ error: 'Erro ao favoritar' });
  }
});

// ─── DESFAVORITAR (autenticado, próprio usuário) ──────────────────────────────
router.delete('/:id/favorite', authenticate, async (req: AuthRequest, res: Response) => {
  const dealId = parseId(req.params.id);
  if (!dealId) {
    res.status(400).json({ error: 'ID inválido' });
    return;
  }

  const userId = req.user!.id;
  try {
    await pool.query(
      'DELETE FROM favorites WHERE user_id = $1 AND deal_id = $2',
      [userId, dealId]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('[UNFAVORITE]', err);
    res.status(500).json({ error: 'Erro ao desfavoritar' });
  }
});

export default router;
