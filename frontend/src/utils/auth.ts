/**
 * Utilitários de autenticação no frontend.
 * Centraliza o acesso ao token JWT e ao usuário em localStorage.
 */

export interface StoredUser {
  id: number;
  username: string;
  email: string;
  is_admin: boolean;
  avatar_url?: string;
  created_at?: string;
}

/** Retorna o token JWT armazenado, ou null se não existir. */
export function getToken(): string | null {
  return localStorage.getItem('token');
}

/** Retorna os headers de autenticação para fetch. */
export function authHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/** Retorna os headers de autenticação + Content-Type JSON. */
export function jsonAuthHeaders(): Record<string, string> {
  return { 'Content-Type': 'application/json', ...authHeaders() };
}

/** Retorna o usuário armazenado, ou null. */
export function getStoredUser(): StoredUser | null {
  try {
    const raw = localStorage.getItem('user');
    return raw ? (JSON.parse(raw) as StoredUser) : null;
  } catch {
    return null;
  }
}

/** Persiste token e dados do usuário após login/registro. */
export function setAuth(token: string, user: StoredUser): void {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
}

/** Persiste apenas dados atualizados do usuário (sem alterar o token). */
export function updateStoredUser(user: StoredUser): void {
  localStorage.setItem('user', JSON.stringify(user));
}

/** Remove token e dados do usuário (logout). */
export function clearAuth(): void {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}
