import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Estende o Request do Express para carregar o usuário autenticado
export interface AuthRequest extends Request {
  user?: {
    id: number;
    username: string;
    is_admin: boolean;
  };
}

const JWT_SECRET = process.env.JWT_SECRET!;

/**
 * Verifica o token JWT no header Authorization.
 * Anexa req.user se válido, caso contrário retorna 401.
 */
export function authenticate(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Token de autenticação ausente' });
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET) as {
      id: number;
      username: string;
      is_admin: boolean;
    };
    req.user = { id: payload.id, username: payload.username, is_admin: payload.is_admin };
    next();
  } catch {
    res.status(401).json({ error: 'Token inválido ou expirado' });
  }
}

/**
 * Requer que o usuário autenticado seja administrador.
 * Deve ser usado após authenticate().
 */
export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction): void {
  if (!req.user?.is_admin) {
    res.status(403).json({ error: 'Acesso restrito a administradores' });
    return;
  }
  next();
}
