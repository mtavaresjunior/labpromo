import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getStoredUser, authHeaders, jsonAuthHeaders, updateStoredUser } from '../utils/auth';
import DealCard from '../components/DealCard';
import './ProfilePage.css';

interface ProfilePageProps {
  initialTab?: 'posts' | 'favorites' | 'edit';
  onLogout: () => void;
  onUserUpdate?: (user: any) => void;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ initialTab, onLogout, onUserUpdate }) => {
  const navigate = useNavigate();
  const [user, setUser]         = useState<any>(null);
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [avatarFile, setAvatarFile]     = useState<File | null>(null);
  const [activeTab, setActiveTab]       = useState<'posts' | 'favorites'>(
    initialTab === 'favorites' ? 'favorites' : 'posts'
  );
  const [deals, setDeals]               = useState<any[]>([]);
  const [loadingDeals, setLoadingDeals] = useState(false);
  const [isSaving, setIsSaving]         = useState(false);
  const [saveError, setSaveError]       = useState('');
  const [saveSuccess, setSaveSuccess]   = useState('');

  useEffect(() => {
    if (initialTab === 'favorites' || initialTab === 'posts') setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    const stored = getStoredUser();
    if (stored) {
      setUser(stored);
      setFormData({ username: stored.username, password: '' });
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    fetchDeals();
  }, [user, activeTab]); // eslint-disable-line

  const fetchDeals = async () => {
    setLoadingDeals(true);
    try {
      const url      = import.meta.env.VITE_API_URL || 'http://localhost:5172/api';
      const endpoint = activeTab === 'posts'
        ? `/users/${user.id}/deals`
        : `/users/${user.id}/favorites`;
      const res  = await fetch(`${url}${endpoint}`, { headers: authHeaders() });
      const data = await res.json();
      setDeals(Array.isArray(data) ? data : []);
    } catch {
      setDeals([]);
    } finally {
      setLoadingDeals(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveError('');
    setSaveSuccess('');

    try {
      const url = import.meta.env.VITE_API_URL || 'http://localhost:5172/api';
      let updatedUser = user;

      // 1. Upload de avatar se selecionado
      if (avatarFile) {
        const fd = new FormData();
        fd.append('avatar', avatarFile);
        const uploadRes = await fetch(`${url}/users/${user.id}/avatar`, {
          method:  'POST',
          headers: authHeaders(), // sem Content-Type — FormData define automaticamente
          body:    fd,
        });
        if (!uploadRes.ok) {
          const err = await uploadRes.json();
          throw new Error(err.error || 'Erro ao enviar imagem');
        }
        updatedUser = await uploadRes.json();
      }

      // 2. Atualizar campos de texto (username / senha)
      const payload: Record<string, string> = { username: formData.username };
      if (formData.password) payload.password = formData.password;

      const res  = await fetch(`${url}/users/${user.id}`, {
        method:  'PUT',
        headers: jsonAuthHeaders(),
        body:    JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao atualizar perfil');

      const finalUser = { ...updatedUser, ...data };
      setUser(finalUser);
      updateStoredUser(finalUser);
      setFormData({ username: finalUser.username, password: '' });
      setAvatarFile(null);
      onUserUpdate?.(finalUser);
      setSaveSuccess('Perfil atualizado com sucesso!');
    } catch (err: any) {
      setSaveError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) return <div className="profile-empty">Carregando perfil...</div>;

  return (
    <div className="profile-page">
      <div className="profile-header">
        <img src={user.avatar_url || '/default-avatar.png'} alt="Avatar" className="profile-avatar" />
        <div className="profile-info">
          <h1>Meu Perfil</h1>

          {saveError   && <div className="modal-error"   style={{ marginBottom: 12 }}>{saveError}</div>}
          {saveSuccess && <div className="save-success"  style={{ marginBottom: 12 }}>{saveSuccess}</div>}

          <form className="profile-form" onSubmit={handleSave}>
            <div className="form-group">
              <label>Nome de Exibição</label>
              <input
                value={formData.username}
                minLength={3}
                maxLength={50}
                required
                onChange={e => setFormData({ ...formData, username: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Nova Senha — opcional</label>
              <input
                type="password"
                autoComplete="new-password"
                minLength={6}
                placeholder="Deixe em branco para manter"
                value={formData.password}
                onChange={e => setFormData({ ...formData, password: e.target.value })}
              />
            </div>
            <div className="form-group full">
              <label>Alterar Foto do Perfil</label>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={e => setAvatarFile(e.target.files?.[0] || null)}
              />
            </div>
            <div className="form-group">
              <button type="submit" className="button" disabled={isSaving}>
                {isSaving ? 'Salvando...' : 'Salvar Alterações'}
              </button>
            </div>
            <div className="form-group">
              <button type="button" className="button secondary" onClick={onLogout}>
                Fazer Logout
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="profile-tabs">
        <div className={`profile-tab ${activeTab === 'posts'     ? 'active' : ''}`} onClick={() => setActiveTab('posts')}>
          Minhas Promoções
        </div>
        <div className={`profile-tab ${activeTab === 'favorites' ? 'active' : ''}`} onClick={() => setActiveTab('favorites')}>
          Favoritos
        </div>
      </div>

      {loadingDeals ? (
        <div className="profile-empty">Carregando...</div>
      ) : deals.length > 0 ? (
        <div className="profile-deals-grid">
          {deals.map(deal => (
            <DealCard
              key={deal.id}
              id={deal.id}
              title={deal.title}
              price={deal.price}
              originalPrice={deal.original_price}
              image={deal.image_url}
              store={deal.store_name}
              likesCount={deal.likes_count}
              dislikesCount={deal.dislikes_count}
              username={deal.username}
              commentsCount={deal.comments_count || 0}
              link={deal.link}
              createdAt={deal.created_at}
              onClick={() => navigate(`/deal/${deal.id}`)}
            />
          ))}
        </div>
      ) : (
        <div className="profile-empty">Nenhuma promoção encontrada nesta aba.</div>
      )}
    </div>
  );
};

export default ProfilePage;
