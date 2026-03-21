import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './ProfilePage.css';
import DealCard from '../components/DealCard';

interface ProfilePageProps {
  initialTab?: 'posts' | 'favorites' | 'edit';
  onLogout: () => void;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ initialTab, onLogout }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [activeTab, setActiveTab] = useState<'posts' | 'favorites'>(initialTab === 'favorites' ? 'favorites' : 'posts');
  const [deals, setDeals] = useState<any[]>([]);
  const [loadingDeals, setLoadingDeals] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (initialTab && (initialTab === 'favorites' || initialTab === 'posts')) {
       setActiveTab(initialTab);
    }
  }, [initialTab]);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      setUser(parsed);
      setFormData({ username: parsed.username, password: '' });
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    fetchDeals(); // eslint-disable-next-line
  }, [user, activeTab]);

  const fetchDeals = async () => {
    setLoadingDeals(true);
    try {
      const url = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
      const endpoint = activeTab === 'posts' ? `/users/${user.id}/deals` : `/users/${user.id}/favorites`;
      const res = await fetch(`${url}${endpoint}`);
      const data = await res.json();
      setDeals(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDeals(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const url = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
      
      let updatedUser = user;

      // 1. Upload Avatar if selected
      if (avatarFile) {
        const formDataUpload = new FormData();
        formDataUpload.append('avatar', avatarFile);
        const uploadRes = await fetch(`${url}/users/${user.id}/avatar`, {
          method: 'POST',
          body: formDataUpload
        });
        if (!uploadRes.ok) throw new Error('Erro ao enviar imagem');
        updatedUser = await uploadRes.json();
      }

      // 2. Update text fields
      const res = await fetch(`${url}/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      // Merge results
      const finalUser = { ...updatedUser, ...data };
      setUser(finalUser);
      localStorage.setItem('user', JSON.stringify(finalUser));
      setFormData({ username: finalUser.username, password: '' });
      setAvatarFile(null);
      alert('Perfil atualizado com sucesso!');
    } catch (err: any) {
      alert('Erro ao atualizar: ' + err.message);
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
          <form className="profile-form" onSubmit={handleSave}>
            <div className="form-group">
              <label>Nome de Exibição</label>
              <input value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} required />
            </div>
            <div className="form-group">
              <label>Nova Senha (opcional)</label>
              <input type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} placeholder="Deixe em branco para manter" />
            </div>
            <div className="form-group full">
              <label>Alterar Foto do Perfil</label>
              <input type="file" accept="image/*" onChange={e => setAvatarFile(e.target.files?.[0] || null)} />
            </div>
            <div className="form-group">
              <button type="submit" className="button" disabled={isSaving}>{isSaving ? 'Salvando...' : 'Salvar Alterações'}</button>
            </div>
            <div className="form-group">
              <button type="button" className="button secondary" onClick={onLogout}>Fazer Logout</button>
            </div>
          </form>
        </div>
      </div>

      <div className="profile-tabs">
        <div className={`profile-tab ${activeTab === 'posts' ? 'active' : ''}`} onClick={() => setActiveTab('posts')}>
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
              temperature={deal.temperature}
              username={deal.username}
              commentsCount={0}
              link={deal.link}
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
