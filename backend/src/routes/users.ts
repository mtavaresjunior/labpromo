import express, { Request, Response } from 'express';
import { pool } from '../index';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET!;
const BCRYPT_ROUNDS = 12;

// ─── Upload de avatar com validação ──────────────────────────────────────────
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_FILE_SIZE_MB = 3;

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const dir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    // Nome seguro: timestamp + extensão validada pelo fileFilter
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `avatar_${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE_MB * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de arquivo não permitido. Use JPEG, PNG, WEBP ou GIF.'));
    }
  },
});

// ─── Helpers ──────────────────────────────────────────────────────────────────
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 255;
}

function sanitizeUsername(username: string): boolean {
  return typeof username === 'string' && username.trim().length >= 3 && username.trim().length <= 50;
}

function generateToken(user: { id: number; username: string; is_admin: boolean }): string {
  return jwt.sign(
    { id: user.id, username: user.username, is_admin: user.is_admin },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// ─── LOGIN ────────────────────────────────────────────────────────────────────
router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: 'E-mail e senha são obrigatórios' });
    return;
  }
  if (!isValidEmail(email)) {
    res.status(400).json({ error: 'Formato de e-mail inválido' });
    return;
  }
  if (typeof password !== 'string' || password.length > 128) {
    res.status(400).json({ error: 'Senha inválida' });
    return;
  }

  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase().trim()]);

    // Mensagem genérica para não revelar se o e-mail existe
    if (result.rows.length === 0) {
      res.status(401).json({ error: 'Credenciais inválidas' });
      return;
    }

    const user = result.rows[0];
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      res.status(401).json({ error: 'Credenciais inválidas' });
      return;
    }

    const token = generateToken(user);
    const { password: _, ...userWithoutPassword } = user;
    res.json({ token, user: userWithoutPassword });
  } catch (err) {
    console.error('[LOGIN]', err);
    res.status(500).json({ error: 'Erro interno ao fazer login' });
  }
});

// ─── REGISTER ─────────────────────────────────────────────────────────────────
router.post('/register', async (req: Request, res: Response) => {
  const { username, email, password } = req.body;

  if (!sanitizeUsername(username)) {
    res.status(400).json({ error: 'Nome de usuário deve ter entre 3 e 50 caracteres' });
    return;
  }
  if (!isValidEmail(email)) {
    res.status(400).json({ error: 'Formato de e-mail inválido' });
    return;
  }
  if (typeof password !== 'string' || password.length < 6 || password.length > 128) {
    res.status(400).json({ error: 'Senha deve ter entre 6 e 128 caracteres' });
    return;
  }

  try {
    const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const result = await pool.query(
      'INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING id, username, email, is_admin, avatar_url, created_at',
      [username.trim(), email.toLowerCase().trim(), hashedPassword]
    );
    const user = result.rows[0];
    const token = generateToken(user);
    res.status(201).json({ token, user });
  } catch (err: any) {
    if (err.code === '23505') {
      // Constraint de unicidade — não revela qual campo
      res.status(409).json({ error: 'Este e-mail ou nome de usuário já está em uso' });
    } else {
      console.error('[REGISTER]', err);
      res.status(500).json({ error: 'Erro interno ao registrar usuário' });
    }
  }
});

// ─── UPLOAD DE AVATAR (autenticado, próprio perfil) ──────────────────────────
router.post('/:id/avatar', authenticate, upload.single('avatar'), async (req: AuthRequest, res: Response) => {
  const targetId = parseInt(req.params.id, 10);

  // Apenas o próprio usuário pode alterar seu avatar
  if (req.user!.id !== targetId) {
    res.status(403).json({ error: 'Sem permissão para alterar este perfil' });
    return;
  }
  if (!req.file) {
    res.status(400).json({ error: 'Nenhum arquivo enviado' });
    return;
  }

  const backendUrl = process.env.BACKEND_URL || 'http://localhost:5172';
  const avatarUrl = `${backendUrl}/uploads/${req.file.filename}`;

  try {
    const result = await pool.query(
      'UPDATE users SET avatar_url = $1 WHERE id = $2 RETURNING id, username, email, avatar_url, is_admin, created_at',
      [avatarUrl, targetId]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('[AVATAR]', err);
    res.status(500).json({ error: 'Erro ao salvar avatar' });
  }
});

// ─── ATUALIZAR PERFIL (autenticado, próprio perfil) ──────────────────────────
router.put('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  const targetId = parseInt(req.params.id, 10);

  if (req.user!.id !== targetId) {
    res.status(403).json({ error: 'Sem permissão para alterar este perfil' });
    return;
  }

  const { username, password } = req.body;

  if (username !== undefined && !sanitizeUsername(username)) {
    res.status(400).json({ error: 'Nome de usuário deve ter entre 3 e 50 caracteres' });
    return;
  }

  let hashedPassword: string | null = null;
  if (password) {
    if (typeof password !== 'string' || password.length < 6 || password.length > 128) {
      res.status(400).json({ error: 'Nova senha deve ter entre 6 e 128 caracteres' });
      return;
    }
    hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);
  }

  try {
    const result = await pool.query(
      `UPDATE users
       SET username  = COALESCE($1, username),
           password  = COALESCE($2, password)
       WHERE id = $3
       RETURNING id, username, email, avatar_url, is_admin, created_at`,
      [username?.trim() || null, hashedPassword, targetId]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Usuário não encontrado' });
      return;
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('[UPDATE USER]', err);
    res.status(500).json({ error: 'Erro ao atualizar perfil' });
  }
});

// ─── DEALS DO USUÁRIO (público) ───────────────────────────────────────────────
router.get('/:id/deals', async (req: Request, res: Response) => {
  const userId = parseInt(req.params.id, 10);
  if (isNaN(userId)) {
    res.status(400).json({ error: 'ID inválido' });
    return;
  }
  try {
    const result = await pool.query(
      `SELECT deals.*, users.username,
              (SELECT COUNT(*) FROM comments WHERE comments.deal_id = deals.id) AS comments_count
       FROM deals
       JOIN users ON deals.posted_by = users.id
       WHERE posted_by = $1
       ORDER BY created_at DESC`,
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('[USER DEALS]', err);
    res.status(500).json({ error: 'Erro ao buscar promoções do usuário' });
  }
});

// ─── FAVORITOS DO USUÁRIO (apenas o próprio usuário ou admin) ─────────────────
router.get('/:id/favorites', authenticate, async (req: AuthRequest, res: Response) => {
  const targetId = parseInt(req.params.id, 10);

  if (req.user!.id !== targetId && !req.user!.is_admin) {
    res.status(403).json({ error: 'Sem permissão para ver estes favoritos' });
    return;
  }

  try {
    const result = await pool.query(
      `SELECT deals.*, users.username,
              (SELECT COUNT(*) FROM comments WHERE comments.deal_id = deals.id) AS comments_count
       FROM favorites
       JOIN deals ON favorites.deal_id = deals.id
       JOIN users ON deals.posted_by = users.id
       WHERE favorites.user_id = $1
       ORDER BY favorites.created_at DESC`,
      [targetId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('[USER FAVORITES]', err);
    res.status(500).json({ error: 'Erro ao buscar favoritos' });
  }
});

// ─── LISTAR TODOS OS USUÁRIOS (admin) ────────────────────────────────────────
router.get('/', authenticate, requireAdmin, async (_req: Request, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT id, username, email, is_admin, created_at FROM users ORDER BY id ASC'
    );
    res.json(result.rows);
  } catch (err) {
    console.error('[LIST USERS]', err);
    res.status(500).json({ error: 'Erro ao listar usuários' });
  }
});

// ─── ALTERNAR STATUS DE ADMIN (admin) ────────────────────────────────────────
router.put('/:id/admin', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  const targetId = parseInt(req.params.id, 10);
  const { is_admin } = req.body;

  if (req.user!.id === targetId) {
    res.status(400).json({ error: 'Você não pode alterar seu próprio status de administrador' });
    return;
  }
  if (typeof is_admin !== 'boolean') {
    res.status(400).json({ error: 'Campo is_admin deve ser booleano' });
    return;
  }

  try {
    await pool.query('UPDATE users SET is_admin = $1 WHERE id = $2', [is_admin, targetId]);
    res.json({ success: true });
  } catch (err) {
    console.error('[TOGGLE ADMIN]', err);
    res.status(500).json({ error: 'Erro ao alterar status de administrador' });
  }
});

// ─── EXCLUIR USUÁRIO (admin) ──────────────────────────────────────────────────
router.delete('/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  const targetId = parseInt(req.params.id, 10);

  if (req.user!.id === targetId) {
    res.status(400).json({ error: 'Você não pode excluir sua própria conta por aqui' });
    return;
  }

  try {
    // Cascade: remove dados dependentes antes de remover o usuário
    await pool.query('DELETE FROM comment_votes WHERE user_id = $1', [targetId]);
    await pool.query('DELETE FROM deal_votes WHERE user_id = $1', [targetId]);
    await pool.query('DELETE FROM favorites WHERE user_id = $1', [targetId]);
    await pool.query('DELETE FROM comments WHERE user_id = $1', [targetId]);
    await pool.query('DELETE FROM comments WHERE deal_id IN (SELECT id FROM deals WHERE posted_by = $1)', [targetId]);
    await pool.query('DELETE FROM favorites WHERE deal_id IN (SELECT id FROM deals WHERE posted_by = $1)', [targetId]);
    await pool.query('DELETE FROM deal_votes WHERE deal_id IN (SELECT id FROM deals WHERE posted_by = $1)', [targetId]);
    await pool.query('DELETE FROM deals WHERE posted_by = $1', [targetId]);
    await pool.query('DELETE FROM users WHERE id = $1', [targetId]);
    res.json({ success: true });
  } catch (err) {
    console.error('[DELETE USER]', err);
    res.status(500).json({ error: 'Erro ao excluir usuário' });
  }
});

export default router;
