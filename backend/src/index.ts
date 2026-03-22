import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { Pool } from 'pg';
import path from 'path';
import bcrypt from 'bcryptjs';

dotenv.config();

// ─── Validação de variáveis de ambiente obrigatórias ─────────────────────────
if (!process.env.JWT_SECRET) {
  console.error('FATAL: variável de ambiente JWT_SECRET não definida. Encerrando.');
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 5172;

// ─── Banco de dados ───────────────────────────────────────────────────────────
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.connect()
  .then(() => {
    console.log('Conectado ao PostgreSQL');
    migratePasswordsIfNeeded();
  })
  .catch((err: Error) => {
    console.error('Erro de conexão com o banco:', err.message);
    process.exit(1);
  });

/**
 * Migração única: converte senhas em texto puro para bcrypt.
 * Executa na inicialização; não afeta senhas já hasheadas.
 */
async function migratePasswordsIfNeeded(): Promise<void> {
  try {
    const result = await pool.query('SELECT id, password FROM users');
    for (const row of result.rows) {
      if (!row.password.startsWith('$2b$') && !row.password.startsWith('$2a$')) {
        const hashed = await bcrypt.hash(row.password, 12);
        await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hashed, row.id]);
        console.log(`Senha do usuário #${row.id} migrada para bcrypt.`);
      }
    }
  } catch (err) {
    // Tabela pode não existir ainda na primeira inicialização — ignora silenciosamente
  }
}

// ─── Segurança: cabeçalhos HTTP ───────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }, // necessário para imagens de /uploads
}));

// ─── CORS configurado com origens permitidas ──────────────────────────────────
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173').split(',').map(o => o.trim());

app.use(cors({
  origin: (origin, callback) => {
    // Permite requisições sem origin (ex: Postman em dev) apenas em desenvolvimento
    if (!origin && process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    if (origin && ALLOWED_ORIGINS.includes(origin)) {
      return callback(null, true);
    }
    callback(new Error(`Origin '${origin}' não permitida pelo CORS`));
  },
  credentials: true,
}));

// ─── Parsing de body com limite de tamanho ────────────────────────────────────
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// ─── Rate limiting global ─────────────────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Muitas requisições. Tente novamente em alguns minutos.' },
});
app.use('/api/', globalLimiter);

// Rate limit mais restrito para autenticação (proteção a brute force)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Muitas tentativas de login. Tente novamente em 15 minutos.' },
});
app.use('/api/users/login', authLimiter);
app.use('/api/users/register', authLimiter);

// ─── Arquivos estáticos ───────────────────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ─── Rotas ────────────────────────────────────────────────────────────────────
import dealRoutes from './routes/deals';
import commentRoutes from './routes/comments';
import userRoutes from './routes/users';
import productRoutes from './routes/products';

app.use('/api/deals', dealRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);

// Health check (sem informações de ambiente)
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

// 404
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

// Handler de erros global (não vaza stack traces)
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[ERROR]', err.message);
  if (err.message.includes('CORS')) {
    res.status(403).json({ error: 'Origem não permitida' });
    return;
  }
  res.status(500).json({ error: 'Erro interno do servidor' });
});

// ─── Iniciar servidor ─────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
