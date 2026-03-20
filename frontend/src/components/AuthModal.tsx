import React, { useState } from 'react';
import './Modal.css';

interface AuthModalProps {
  onClose: () => void;
  onSuccess: (userData: any) => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ onClose, onSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const url = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
      const endpoint = isLogin ? '/users/login' : '/users/register';
      const payload = isLogin ? { email, password } : { email, password, username };

      const res = await fetch(`${url}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro na autenticação');
      
      localStorage.setItem('user', JSON.stringify(data));
      onSuccess(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>&times;</button>
        <h2>{isLogin ? 'Entrar' : 'Criar Conta'}</h2>
        
        {error && <div className="modal-error">{error}</div>}

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label>E-mail</label>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          
          <div className="form-group">
            <label>Senha</label>
            <input type="password" required value={password} onChange={e => setPassword(e.target.value)} />
          </div>

          {!isLogin && (
            <div className="form-group">
              <label>Nome de usuário</label>
              <input type="text" required value={username} onChange={e => setUsername(e.target.value)} />
            </div>
          )}

          <button type="submit" className="button" disabled={loading}>
            {loading ? 'Aguarde...' : (isLogin ? 'Entrar' : 'Cadastrar')}
          </button>
        </form>

        <p className="modal-toggle" onClick={() => setIsLogin(!isLogin)}>
          {isLogin ? 'Não tem conta? Cadastre-se' : 'Já tem conta? Entre'}
        </p>
      </div>
    </div>
  );
};

export default AuthModal;
