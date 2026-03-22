import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { jsonAuthHeaders, authHeaders } from '../utils/auth';
import '../components/Modal.css';
import './AdminPage.css';

interface User    { id: number; username: string; email: string; is_admin: boolean; created_at: string; }
interface Deal    { id: number; title: string; price: string; username: string; }
interface Product { id: number; name: string; category: string; created_at: string; }

interface AdminPageProps { loggedInUser: any; }

const AdminPage: React.FC<AdminPageProps> = ({ loggedInUser }) => {
  const navigate   = useNavigate();
  const [users, setUsers]       = useState<User[]>([]);
  const [deals, setDeals]       = useState<Deal[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [activeTab, setActiveTab] = useState<'users' | 'deals' | 'products'>('users');
  const [loading, setLoading]   = useState(true);
  const [editingProduct, setEditingProduct] = useState<Product | Partial<Product> | null>(null);

  const url = import.meta.env.VITE_API_URL || 'http://localhost:5172/api';

  const fetchData = async () => {
    setLoading(true);
    try {
      // Todas as chamadas admin enviam o token JWT no header
      const [usersRes, dealsRes, productsRes] = await Promise.all([
        fetch(`${url}/users`,    { headers: authHeaders() }),
        fetch(`${url}/deals`),
        fetch(`${url}/products`, { headers: authHeaders() }),
      ]);
      if (usersRes.ok)    setUsers(await usersRes.json());
      if (dealsRes.ok)    setDeals(await dealsRes.json());
      if (productsRes.ok) setProducts(await productsRes.json());
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (loggedInUser?.is_admin) fetchData();
  }, [loggedInUser]); // eslint-disable-line

  if (!loggedInUser?.is_admin) {
    return (
      <div className="admin-page">
        <h2>Acesso Negado</h2>
        <button className="button" onClick={() => navigate('/')}>Voltar para o início</button>
      </div>
    );
  }

  const handleDeleteUser = async (id: number) => {
    if (!window.confirm('Excluir este usuário apagará TODAS as promoções e comentários dele. Essa ação é irreversível. Tem certeza?')) return;
    const res = await fetch(`${url}/users/${id}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    if (res.ok) fetchData();
    else alert('Erro ao excluir usuário');
  };

  const handleToggleAdmin = async (id: number, current: boolean) => {
    if (!window.confirm(`Você quer ${current ? 'remover' : 'conceder'} privilégios de administrador?`)) return;
    const res = await fetch(`${url}/users/${id}/admin`, {
      method:  'PUT',
      headers: jsonAuthHeaders(),
      body:    JSON.stringify({ is_admin: !current }),
    });
    if (res.ok) fetchData();
    else alert('Erro ao alterar status de admin');
  };

  const handleDeleteDeal = async (id: number) => {
    if (!window.confirm('Excluir esta promoção?')) return;
    const res = await fetch(`${url}/deals/${id}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    if (res.ok) fetchData();
    else alert('Erro ao excluir promoção');
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct?.name) return alert('Nome é obrigatório');
    const isNew     = !('id' in editingProduct) || !editingProduct.id;
    const method    = isNew ? 'POST' : 'PUT';
    const endpoint  = isNew ? `${url}/products` : `${url}/products/${editingProduct.id}`;
    const res = await fetch(endpoint, {
      method,
      headers: jsonAuthHeaders(),
      body:    JSON.stringify({ name: editingProduct.name, category: editingProduct.category }),
    });
    if (res.ok) { setEditingProduct(null); fetchData(); }
    else alert('Erro ao salvar produto');
  };

  const handleDeleteProduct = async (id: number) => {
    if (!window.confirm('Excluir este produto e seu histórico de preços? Ação irreversível.')) return;
    const res = await fetch(`${url}/products/${id}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    if (res.ok) fetchData();
    else alert('Erro ao excluir produto');
  };

  const renderUsers = () => (
    <div style={{ overflowX: 'auto' }}>
      <table className="admin-table">
        <thead>
          <tr><th>ID</th><th>Usuário</th><th>Email</th><th>Cadastro</th><th>Admin</th><th>Ações</th></tr>
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
                    <button className="button admin-btn delete" onClick={() => handleDeleteUser(u.id)}>Excluir</button>
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
          <tr><th>ID</th><th>Título</th><th>Preço</th><th>Postado Por</th><th>Ações</th></tr>
        </thead>
        <tbody>
          {deals.map(d => (
            <tr key={d.id}>
              <td>{d.id}</td>
              <td>{d.title}</td>
              <td>R$ {Number(d.price).toFixed(2)}</td>
              <td>{d.username}</td>
              <td>
                <button className="button admin-btn delete" onClick={() => handleDeleteDeal(d.id)}>Apagar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderProducts = () => (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3>Gerenciar Produtos</h3>
        <button className="button" onClick={() => setEditingProduct({ name: '', category: 'Outros' })}>+ Novo Produto</button>
      </div>

      {editingProduct && (
        <div className="modal-overlay" onClick={() => setEditingProduct(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setEditingProduct(null)}>&times;</button>
            <h2>{editingProduct.id ? 'Editar Produto' : 'Cadastrar Produto'}</h2>
            <form onSubmit={handleSaveProduct} className="modal-form">
              <div className="form-group full">
                <label>Nome do Produto</label>
                <input
                  type="text"
                  value={editingProduct.name || ''}
                  onChange={e => setEditingProduct({ ...editingProduct, name: e.target.value })}
                  required
                  maxLength={200}
                />
              </div>
              <div className="form-group full">
                <label>Categoria</label>
                <select
                  value={editingProduct.category || 'Outros'}
                  onChange={e => setEditingProduct({ ...editingProduct, category: e.target.value })}
                  required
                >
                  {['Placa-mãe','Processador','Memória RAM','Armazenamento','Placa de Vídeo','Fonte','Gabinete','Periféricos','Monitor','Notebooks','Smartphones','TV e Áudio','Outros'].map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <button type="submit" className="button" style={{ flex: 1 }}>Salvar</button>
                <button type="button" className="button secondary" onClick={() => setEditingProduct(null)} style={{ flex: 1 }}>Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div style={{ overflowX: 'auto' }}>
        <table className="admin-table">
          <thead>
            <tr><th>ID</th><th>Nome</th><th>Categoria</th><th>Ações</th></tr>
          </thead>
          <tbody>
            {products.map(p => (
              <tr key={p.id}>
                <td>{p.id}</td>
                <td>{p.name}</td>
                <td>{p.category}</td>
                <td>
                  <button className="button secondary admin-btn" onClick={() => setEditingProduct(p)}>Editar</button>
                  <button className="button admin-btn delete" onClick={() => handleDeleteProduct(p.id)}>Excluir</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h2>Painel Administrativo</h2>
        <div className="admin-tabs">
          <button className={`admin-tab ${activeTab === 'users'    ? 'active' : ''}`} onClick={() => setActiveTab('users')}>
            Usuários ({users.length})
          </button>
          <button className={`admin-tab ${activeTab === 'deals'    ? 'active' : ''}`} onClick={() => setActiveTab('deals')}>
            Promoções ({deals.length})
          </button>
          <button className={`admin-tab ${activeTab === 'products' ? 'active' : ''}`} onClick={() => setActiveTab('products')}>
            Produtos ({products.length})
          </button>
        </div>
      </div>

      <div className="admin-content">
        {loading
          ? <p>Carregando dados...</p>
          : activeTab === 'users'    ? renderUsers()
          : activeTab === 'deals'    ? renderDeals()
          : renderProducts()
        }
      </div>
    </div>
  );
};

export default AdminPage;
