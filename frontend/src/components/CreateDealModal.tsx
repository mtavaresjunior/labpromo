import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getStoredUser, jsonAuthHeaders, authHeaders } from '../utils/auth';
import './Modal.css';

interface CreateDealModalProps {
  onClose: () => void;
  onCreated: () => void;
  initialData?: any;
}

const STORES = ['KaBuM!', 'Terabyte', 'Pichau', 'Amazon', 'Mercado Livre', 'AliExpress', 'Fast Shop', 'Magazine Luiza', 'Shopee', 'Outras'];
const CATEGORIES = ['Placa-mãe', 'Processador', 'Memória RAM', 'Armazenamento', 'Placa de Vídeo', 'Fonte', 'Gabinete', 'Periféricos', 'Monitor', 'Outros'];

const CreateDealModal: React.FC<CreateDealModalProps> = ({ onClose, onCreated, initialData }) => {
  const navigate   = useNavigate();
  const user       = getStoredUser();
  const isAdmin    = user?.is_admin === true; // is_admin vem do servidor via JWT

  const [formData, setFormData] = useState({
    title:          initialData?.title          || '',
    price:          initialData?.price          || '',
    original_price: initialData?.original_price || '',
    image_url:      initialData?.image_url      || '',
    store_name:     initialData?.store_name     || 'Outras',
    category:       initialData?.category       || 'Outros',
    description:    initialData?.description    || '',
    link:           initialData?.link           || '',
  });
  const [loading, setLoading]                       = useState(false);
  const [error, setError]                           = useState('');
  const [productQuery, setProductQuery]             = useState('');
  const [productSuggestions, setProductSuggestions] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct]       = useState<any>(null);

  React.useEffect(() => {
    if (productQuery.length > 2 && !selectedProduct) {
      const url = import.meta.env.VITE_API_URL || 'http://localhost:5172/api';
      fetch(`${url}/products/search?q=${encodeURIComponent(productQuery)}`)
        .then(res => res.json())
        .then(data => setProductSuggestions(Array.isArray(data) ? data : []))
        .catch(() => setProductSuggestions([]));
    } else {
      setProductSuggestions([]);
    }
  }, [productQuery, selectedProduct]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!user) {
      setError('Você precisa estar logado para enviar uma promoção');
      setLoading(false);
      return;
    }

    try {
      const url    = import.meta.env.VITE_API_URL || 'http://localhost:5172/api';
      const method = initialData ? 'PUT' : 'POST';
      const endpoint = initialData ? `${url}/deals/${initialData.id}` : `${url}/deals`;

      let finalProductId = selectedProduct?.id || initialData?.product_id || null;

      // Apenas admin pode criar um produto novo digitando o nome
      if (!selectedProduct && productQuery.trim() !== '' && isAdmin) {
        const prodRes = await fetch(`${url}/products`, {
          method:  'POST',
          headers: jsonAuthHeaders(),
          body:    JSON.stringify({ name: productQuery.trim(), category: formData.category }),
        });
        if (prodRes.ok) {
          const newProd = await prodRes.json();
          finalProductId = newProd.id;
        }
      }

      const res = await fetch(endpoint, {
        method,
        headers: jsonAuthHeaders(),
        // Não envia posted_by/user_id — o servidor extrai do JWT
        body: JSON.stringify({ ...formData, product_id: finalProductId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao salvar promoção');

      onCreated();
      if (!initialData) navigate(`/deal/${data.id}`);
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

          {/* Produto associado */}
          <div className="form-group full" style={{ position: 'relative' }}>
            <label>
              Produto Associado
              {isAdmin ? ' (busque ou digite para criar novo)' : ' (busque um produto existente)'} — Opcional
            </label>
            <input
              type="text"
              placeholder="Ex: RTX 4060 Asus"
              value={productQuery}
              onChange={e => { setProductQuery(e.target.value); setSelectedProduct(null); }}
              autoComplete="off"
            />
            {productSuggestions.length > 0 && (
              <ul className="product-suggestions">
                {productSuggestions.map(p => (
                  <li key={p.id} onClick={() => { setSelectedProduct(p); setProductQuery(p.name); setProductSuggestions([]); }}>
                    {p.name}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="form-group full">
            <label>Título da Promoção</label>
            <input name="title" required maxLength={200} value={formData.title} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label>Preço atual (R$)</label>
            <input type="number" step="0.01" min="0" name="price" required value={formData.price} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label>Preço original (R$) — Opcional</label>
            <input type="number" step="0.01" min="0" name="original_price" value={formData.original_price} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label>Nome da Loja</label>
            <select name="store_name" required value={formData.store_name} onChange={handleChange}>
              {STORES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label>Categoria</label>
            <select name="category" required value={formData.category} onChange={handleChange}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
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
            <textarea name="description" rows={4} required maxLength={5000} value={formData.description} onChange={handleChange} />
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
