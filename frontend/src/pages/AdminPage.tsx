import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminPage.css';

interface User {
  id: number;
  username: string;
  email: string;
  is_admin: boolean;
  created_at: string;
}

interface Deal {
  id: number;
  title: string;
  price: string;
  username: string;
}

interface AdminPageProps {
  loggedInUser: any;
}

const AdminPage: React.FC<AdminPageProps> = ({ loggedInUser }) => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [activeTab, setActiveTab] = useState<'users' | 'deals'>('users');
  const [loading, setLoading] = useState(true);

  const url = import.meta.env.VITE_API_URL || 'http://localhost:5172/api';

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersRes, dealsRes] = await Promise.all([
        fetch(`${url}/users?admin_id=${loggedInUser?.id}`),
        fetch(`${url}/deals`)
      ]);
      const usersData = await usersRes.json();
      const dealsData = await dealsRes.json();
      
      if (usersRes.ok) setUsers(usersData);
      if (dealsRes.ok) setDeals(dealsData);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (loggedInUser?.is_admin) {
      fetchData();
    }
  }, [loggedInUser]);

  if (!loggedInUser?.is_admin) {
    return (
      <div className="admin-page">
        <h2>Acesso Negado</h2>
        <button className="button" onClick={() => navigate('/')}>Voltar para o início</button>
      </div>
    );
  }

  const handleDeleteUser = async (id: number) => {
    if(!window.confirm('Excluir este usuário apagará TODAS as promoções e comentários dele. Essa ação é irreversível. Tem certeza?')) return;
    try {
      const res = await fetch(`${url}/users/${id}`, {
        method: 'DELETE',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ admin_id: loggedInUser.id })
      });
      if(res.ok) fetchData();
      else alert('Erro ao excluir usuário');
    } catch(err) {
      alert('Erro de conexão');
    }
  };

  const handleToggleAdmin = async (id: number, currentStatus: boolean) => {
    if(!window.confirm(`Você tem certeza que deseja ${currentStatus ? 'remover' : 'conceder'} privilégios de administrador?`)) return;
    try {
      const res = await fetch(`${url}/users/${id}/admin`, {
        method: 'PUT',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ admin_id: loggedInUser.id, is_admin: !currentStatus })
      });
      if(res.ok) fetchData();
      else alert('Erro ao mudar status de admin');
    } catch(err) {
      alert('Erro de conexão');
    }
  };

  const handleDeleteDeal = async (id: number) => {
    if(!window.confirm('Excluir esta promoção?')) return;
    try {
      const res = await fetch(`${url}/deals/${id}`, {
        method: 'DELETE',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ user_id: loggedInUser.id })
      });
      if(res.ok) fetchData();
      else alert('Erro ao excluir promoção');
    } catch(err) {
      alert('Erro de conexão');
    }
  };

  const renderUsers = () => (
    <div style={{ overflowX: 'auto' }}>
      <table className="admin-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Usuário</th>
            <th>Email</th>
            <th>Cadastro</th>
            <th>Admin</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {users.map(u => (
            <tr key={u.id}>
              <td>{u.id}</td>
              <td>{u.username}</td>
              <td>{u.email}</td>
              <td>{new Date(u.created_at).toLocaleDateString()}</td>
              <td>{u.is_admin ? 'Sim 🟢' : 'Não ⚪'}</td>
              <td>
                {u.id !== loggedInUser.id && (
                  <>
                    <button className="button secondary admin-btn" onClick={() => handleToggleAdmin(u.id, u.is_admin)}>
                      Tornar {u.is_admin ? 'Usuário' : 'Admin'}
                    </button>
                    <button className="button admin-btn delete" onClick={() => handleDeleteUser(u.id)}>Excluir Conta</button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderDeals = () => (
    <div style={{ overflowX: 'auto' }}>
      <table className="admin-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Título</th>
            <th>Preço</th>
            <th>Postado Por</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {deals.map(d => (
            <tr key={d.id}>
              <td>{d.id}</td>
              <td>{d.title}</td>
              <td>R$ {Number(d.price).toFixed(2)}</td>
              <td>{d.username}</td>
              <td>
                <button className="button admin-btn delete" onClick={() => handleDeleteDeal(d.id)}>Apagar Divulgação</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h2>Painel Administrativo</h2>
        <div className="admin-tabs">
          <button className={`admin-tab ${activeTab==='users'?'active':''}`} onClick={()=>setActiveTab('users')}>Usuários ({users.length})</button>
          <button className={`admin-tab ${activeTab==='deals'?'active':''}`} onClick={()=>setActiveTab('deals')}>Promoções ({deals.length})</button>
        </div>
      </div>
      
      <div className="admin-content">
        {loading ? <p>Carregando dados...</p> : (
          activeTab === 'users' ? renderUsers() : renderDeals()
        )}
      </div>
    </div>
  );
};

export default AdminPage;
