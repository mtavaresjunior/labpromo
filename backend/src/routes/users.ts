import express, { Request, Response } from 'express';
import { pool } from '../index';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = express.Router();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

router.post('/:id/avatar', upload.single('avatar'), async (req: Request, res: Response) => {
  if (!req.file) return res.status(400).json({ error: 'Nenhum arquivo enviado' });
  const backendUrl = process.env.BACKEND_URL || 'http://localhost:5172';
  const avatarUrl = `${backendUrl}/uploads/${req.file.filename}`;
  try {
    const result = await pool.query(
      'UPDATE users SET avatar_url = $1 WHERE id = $2 RETURNING id, username, email, avatar_url, created_at',
      [avatarUrl, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro no upload' });
  }
});

// Mock Login
router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length > 0) {
      const user = result.rows[0];
      if (user.password === password) {
         // Omit password from response
         const { password: _, ...userWithoutPassword } = user;
         res.json(userWithoutPassword);
      } else {
         res.status(401).json({ error: 'Senha incorreta' });
      }
    } else {
      res.status(401).json({ error: 'E-mail não encontrado' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login falhou' });
  }
});

// Simple Register
router.post('/register', async (req: Request, res: Response) => {
  const { username, email, password } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING id, username, email, created_at',
      [username, email, password]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    if ((err as Error).message.includes('unique constraint')) {
      res.status(400).json({ error: 'Username or email already exists' });
    } else {
      res.status(500).json({ error: 'Registration failed' });
    }
  }
});

// Update User Profile
router.put('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { username, password, avatar_url } = req.body;
  try {
    const result = await pool.query(
      'UPDATE users SET username = COALESCE($1, username), password = COALESCE($2, password), avatar_url = COALESCE($3, avatar_url) WHERE id = $4 RETURNING id, username, email, avatar_url, created_at',
      [username, password || null, avatar_url || null, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Get user deals
router.get('/:id/deals', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'SELECT deals.*, users.username FROM deals JOIN users ON deals.posted_by = users.id WHERE posted_by = $1 ORDER BY created_at DESC',
      [id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch user deals' });
  }
});

// Get user favorites
router.get('/:id/favorites', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'SELECT deals.*, users.username FROM favorites JOIN deals ON favorites.deal_id = deals.id JOIN users ON deals.posted_by = users.id WHERE favorites.user_id = $1 ORDER BY favorites.created_at DESC',
      [id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch favorites' });
  }
});

// Get all users (Admin only)
router.get('/', async (req: Request, res: Response) => {
  const adminId = req.query.admin_id;
  try {
    if (!adminId) return res.status(401).json({ error: 'Admin ID required' });
    const adminRes = await pool.query('SELECT is_admin FROM users WHERE id = $1', [adminId]);
    if (!adminRes.rows[0]?.is_admin) return res.status(403).json({ error: 'Not authorized' });

    const result = await pool.query('SELECT id, username, email, is_admin, created_at FROM users ORDER BY id ASC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Toggle Admin Status
router.put('/:id/admin', async (req: Request, res: Response) => {
  const userIdToUpdate = req.params.id;
  const { admin_id, is_admin } = req.body;
  try {
    if (!admin_id) return res.status(401).json({ error: 'Admin ID required' });
    const adminRes = await pool.query('SELECT is_admin FROM users WHERE id = $1', [admin_id]);
    if (!adminRes.rows[0]?.is_admin) return res.status(403).json({ error: 'Not authorized' });

    if (String(admin_id) === String(userIdToUpdate)) return res.status(400).json({ error: 'Cannot change your own admin status' });

    await pool.query('UPDATE users SET is_admin = $1 WHERE id = $2', [is_admin, userIdToUpdate]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update user admin status' });
  }
});

// Delete user (Admin only)
router.delete('/:id', async (req: Request, res: Response) => {
  const userIdToDelete = req.params.id;
  const adminId = req.body.admin_id;
  try {
    if (!adminId) return res.status(401).json({ error: 'Admin ID required' });
    const adminRes = await pool.query('SELECT is_admin FROM users WHERE id = $1', [adminId]);
    if (!adminRes.rows[0]?.is_admin) return res.status(403).json({ error: 'Not authorized' });

    if (String(adminId) === String(userIdToDelete)) return res.status(400).json({ error: 'Cannot delete yourself' });

    // Dependencies
    await pool.query('DELETE FROM favorites WHERE user_id = $1', [userIdToDelete]);
    await pool.query('DELETE FROM comments WHERE user_id = $1', [userIdToDelete]);
    await pool.query('DELETE FROM comments WHERE deal_id IN (SELECT id FROM deals WHERE posted_by = $1)', [userIdToDelete]);
    await pool.query('DELETE FROM favorites WHERE deal_id IN (SELECT id FROM deals WHERE posted_by = $1)', [userIdToDelete]);
    await pool.query('DELETE FROM deals WHERE posted_by = $1', [userIdToDelete]);
    
    await pool.query('DELETE FROM users WHERE id = $1', [userIdToDelete]);

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

export default router;
