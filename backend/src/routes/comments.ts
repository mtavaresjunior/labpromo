import express, { Request, Response } from 'express';
import { pool } from '../index';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = express.Router();

function parseId(value: string | string[]): number | null {
  const str = Array.isArray(value) ? value[0] : value;
  const id  = parseInt(str, 10);
  return isNaN(id) || id <= 0 ? null : id;
}

// ─── BUSCAR COMENTÁRIOS DE UM DEAL (público) ──────────────────────────────────
router.get('/deal/:dealId', async (req: Request, res: Response) => {
  const dealId = parseId(req.params.dealId);
  if (!dealId) {
    res.status(400).json({ error: 'ID inválido' });
    return;
  }
  try {
    const result = await pool.query(
      `SELECT comments.*, users.username
       FROM comments
       JOIN users ON comments.user_id = users.id
       WHERE deal_id = $1
       ORDER BY created_at ASC`,
      [dealId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('[GET COMMENTS]', err);
    res.status(500).json({ error: 'Erro ao buscar comentários' });
  }
});

// ─── CRIAR COMENTÁRIO (autenticado) ──────────────────────────────────────────
router.post('/deal/:dealId', authenticate, async (req: AuthRequest, res: Response) => {
  const dealId = parseId(req.params.dealId);
  if (!dealId) {
    res.status(400).json({ error: 'ID inválido' });
    return;
  }

  const { content, parent_id } = req.body;
  if (!content?.trim() || content.trim().length > 2000) {
    res.status(400).json({ error: 'Comentário deve ter entre 1 e 2000 caracteres' });
    return;
  }

  const userId = req.user!.id;
  const parsedParentId = parent_id ? parseId(String(parent_id)) : null;

  try {
    const result = await pool.query(
      `INSERT INTO comments (deal_id, user_id, content, likes_count, dislikes_count, parent_id)
       VALUES ($1, $2, $3, 0, 0, $4)
       RETURNING *`,
      [dealId, userId, content.trim(), parsedParentId]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('[CREATE COMMENT]', err);
    res.status(500).json({ error: 'Erro ao criar comentário' });
  }
});

// ─── EXCLUIR COMENTÁRIO (autenticado, dono ou admin) ─────────────────────────
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  const commentId = parseId(req.params.id);
  if (!commentId) {
    res.status(400).json({ error: 'ID inválido' });
    return;
  }

  try {
    const commentRes = await pool.query('SELECT user_id FROM comments WHERE id = $1', [commentId]);
    if (commentRes.rows.length === 0) {
      res.status(404).json({ error: 'Comentário não encontrado' });
      return;
    }

    const isOwner = commentRes.rows[0].user_id === req.user!.id;
    if (!isOwner && !req.user!.is_admin) {
      res.status(403).json({ error: 'Sem permissão para excluir este comentário' });
      return;
    }

    await pool.query('DELETE FROM comments WHERE id = $1', [commentId]);
    res.json({ success: true });
  } catch (err) {
    console.error('[DELETE COMMENT]', err);
    res.status(500).json({ error: 'Erro ao excluir comentário' });
  }
});

// ─── VOTAR EM COMENTÁRIO (autenticado) ───────────────────────────────────────
router.post('/:id/vote', authenticate, async (req: AuthRequest, res: Response) => {
  const commentId = parseId(req.params.id);
  if (!commentId) {
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
      'SELECT vote_type FROM comment_votes WHERE user_id = $1 AND comment_id = $2',
      [userId, commentId]
    );

    if (existingVoteRes.rows.length > 0) {
      const existing = existingVoteRes.rows[0].vote_type;
      if (existing === voteType) {
        await pool.query('DELETE FROM comment_votes WHERE user_id = $1 AND comment_id = $2', [userId, commentId]);
        if (voteType === 1) await pool.query('UPDATE comments SET likes_count = likes_count - 1 WHERE id = $1', [commentId]);
        else await pool.query('UPDATE comments SET dislikes_count = dislikes_count - 1 WHERE id = $1', [commentId]);
      } else {
        await pool.query('UPDATE comment_votes SET vote_type = $1 WHERE user_id = $2 AND comment_id = $3', [voteType, userId, commentId]);
        if (voteType === 1) await pool.query('UPDATE comments SET likes_count = likes_count + 1, dislikes_count = dislikes_count - 1 WHERE id = $1', [commentId]);
        else await pool.query('UPDATE comments SET dislikes_count = dislikes_count + 1, likes_count = likes_count - 1 WHERE id = $1', [commentId]);
      }
    } else {
      await pool.query('INSERT INTO comment_votes (user_id, comment_id, vote_type) VALUES ($1, $2, $3)', [userId, commentId, voteType]);
      if (voteType === 1) await pool.query('UPDATE comments SET likes_count = likes_count + 1 WHERE id = $1', [commentId]);
      else await pool.query('UPDATE comments SET dislikes_count = dislikes_count + 1 WHERE id = $1', [commentId]);
    }

    const result = await pool.query('SELECT * FROM comments WHERE id = $1', [commentId]);
    res.json(result.rows[0]);
  } catch (err) {
    console.error('[VOTE COMMENT]', err);
    res.status(500).json({ error: 'Erro ao votar no comentário' });
  }
});

// ─── VOTOS DE COMENTÁRIO DO USUÁRIO (autenticado, próprio usuário) ────────────
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
      'SELECT comment_id, vote_type FROM comment_votes WHERE user_id = $1',
      [targetId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('[USER COMMENT VOTES]', err);
    res.status(500).json({ error: 'Erro ao buscar votos de comentários' });
  }
});

export default router;
