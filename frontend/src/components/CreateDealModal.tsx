import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Modal.css';

interface CreateDealModalProps {
  onClose: () => void;
  onCreated: () => void;
  initialData?: any;
}

const CreateDealModal: React.FC<CreateDealModalProps> = ({ onClose, onCreated, initialData }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    price: initialData?.price || '',
    original_price: initialData?.original_price || '',
    image_url: initialData?.image_url || '',
    store_name: initialData?.store_name || '',
    description: initialData?.description || '',
    link: initialData?.link || ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const url = import.meta.env.VITE_API_URL || 'http://localhost:5172/api';
      
      // Get user from local storage
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      if (!user) throw new Error('Você precisa estar logado para enviar uma promoção!');

      const method = initialData ? 'PUT' : 'POST';
      const endpoint = initialData ? `${url}/deals/${initialData.id}` : `${url}/deals`;

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, posted_by: user.id, user_id: user.id })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao criar promoção');
      
      onCreated();
      if (!initialData) {
        navigate(`/deal/${data.id}`);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content wide" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>&times;</button>
        <h2>{initialData ? 'Editar Promoção' : 'Enviar nova promoção'}</h2>
        
        {error && <div className="modal-error">{error}</div>}

        <form onSubmit={handleSubmit} className="modal-form grid">
          <div className="form-group full">
            <label>Título</label>
            <input name="title" required value={formData.title} onChange={handleChange} />
          </div>
          
          <div className="form-group">
            <label>Preço atual (R$)</label>
            <input type="number" step="0.01" name="price" required value={formData.price} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label>Preço original (R$) - Opcional</label>
            <input type="number" step="0.01" name="original_price" value={formData.original_price} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label>Nome da Loja</label>
            <input name="store_name" required value={formData.store_name} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label>Link do Produto</label>
            <input name="link" type="url" required value={formData.link} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label>URL da Imagem</label>
            <input name="image_url" type="url" required value={formData.image_url} onChange={handleChange} />
          </div>

          <div className="form-group full">
            <label>Descrição</label>
            <textarea name="description" rows={4} required value={formData.description} onChange={handleChange}></textarea>
          </div>

          <div className="form-group full">
            <button type="submit" className="button" disabled={loading}>
              {loading ? 'Aguarde...' : (initialData ? 'Salvar Alterações' : 'Enviar Promoção')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateDealModal;
