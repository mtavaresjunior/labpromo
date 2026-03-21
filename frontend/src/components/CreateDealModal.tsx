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
    store_name: initialData?.store_name || 'Outras',
    category: initialData?.category || 'Outros',
    description: initialData?.description || '',
    link: initialData?.link || ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [productQuery, setProductQuery] = useState('');
  const [productSuggestions, setProductSuggestions] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  React.useEffect(() => {
    if (productQuery.length > 2 && !selectedProduct) {
      const url = import.meta.env.VITE_API_URL || 'http://localhost:5172/api';
      fetch(`${url}/products/search?q=${encodeURIComponent(productQuery)}`)
        .then(res => res.json())
        .then(data => setProductSuggestions(data))
        .catch(err => console.error(err));
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

    try {
      const url = import.meta.env.VITE_API_URL || 'http://localhost:5172/api';
      
      // Get user from local storage
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      if (!user) throw new Error('Você precisa estar logado para enviar uma promoção!');

      const method = initialData ? 'PUT' : 'POST';
      const endpoint = initialData ? `${url}/deals/${initialData.id}` : `${url}/deals`;

      let finalProductId = selectedProduct?.id || initialData?.product_id;
      
      if (!selectedProduct && productQuery.trim() !== '') {
        const prodRes = await fetch(`${url}/products`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: productQuery.trim(), category: formData.category })
        });
        const newProd = await prodRes.json();
        if (prodRes.ok) finalProductId = newProd.id;
      }

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, posted_by: user.id, user_id: user.id, product_id: finalProductId })
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
          <div className="form-group full" style={{ position: 'relative' }}>
            <label>Produto Associado (Busque ou digite para criar novo) - Opcional</label>
            <input 
              type="text" 
              placeholder="Ex: RTX 4060 Asus" 
              value={productQuery} 
              onChange={(e) => { setProductQuery(e.target.value); setSelectedProduct(null); }} 
              autoComplete="off"
            />
            {productSuggestions.length > 0 && (
              <ul style={{ position: 'absolute', top: '100%', left: 0, right: 0, backgroundColor: 'white', border: '1px solid #ccc', zIndex: 10, listStyle: 'none', padding: 0, margin: 0, maxHeight: 150, overflowY: 'auto' }}>
                {productSuggestions.map(p => (
                  <li key={p.id} style={{ padding: '8px', cursor: 'pointer', borderBottom: '1px solid #eee' }} onClick={() => { setSelectedProduct(p); setProductQuery(p.name); }}>
                    {p.name}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="form-group full">
            <label>Título da Promoção</label>
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

          <div className="form-group border-right">
            <label>Nome da Loja</label>
            <select name="store_name" required value={formData.store_name} onChange={handleChange} style={{ width: '100%', padding: '0.8rem', border: '1px solid #ddd', borderRadius: '8px', fontSize: '1rem' }}>
              <option value="KaBuM!">KaBuM!</option>
              <option value="Terabyte">Terabyte</option>
              <option value="Pichau">Pichau</option>
              <option value="Amazon">Amazon</option>
              <option value="Mercado Livre">Mercado Livre</option>
              <option value="AliExpress">AliExpress</option>
              <option value="Fast Shop">Fast Shop</option>
              <option value="Magazine Luiza">Magazine Luiza</option>
              <option value="Shopee">Shopee</option>
              <option value="Outras">Outras</option>
            </select>
          </div>

          <div className="form-group">
            <label>Categoria</label>
            <select name="category" required value={formData.category} onChange={handleChange} style={{ width: '100%', padding: '0.8rem', border: '1px solid #ddd', borderRadius: '8px', fontSize: '1rem' }}>
              <option value="Placa-mãe">Placa-mãe</option>
              <option value="Processador">Processador</option>
              <option value="Memória RAM">Memória RAM</option>
              <option value="Armazenamento">Armazenamento (HD/SSD)</option>
              <option value="Placa de Vídeo">Placa de Vídeo</option>
              <option value="Fonte">Fonte de Alimentação</option>
              <option value="Gabinete">Gabinete</option>
              <option value="Periféricos">Periféricos</option>
              <option value="Monitor">Monitor</option>
              <option value="Outros">Outros</option>
            </select>
          </div>
          
          <div className="form-group border-right">
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
