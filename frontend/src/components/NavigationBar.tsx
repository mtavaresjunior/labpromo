import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import './NavigationBar.css';

interface NavigationBarProps {
  currentCategory: string;
  searchQuery: string;
  loggedInUser?: any;
  onLoginClick: () => void;
  onCreateDealClick: () => void;
  onLogout?: () => void;
}

const HARDWARE_CATEGORIES = [
  'Todas',
  'Placa-mãe',
  'Processador',
  'Memória RAM',
  'Armazenamento',
  'Placa de Vídeo',
  'Fonte',
  'Gabinete',
  'Periféricos',
  'Monitor',
  'Outros'
];

const STORES = [
  'Todas',
  'KaBuM!',
  'Terabyte',
  'Pichau',
  'Amazon',
  'Mercado Livre',
  'AliExpress',
  'Fast Shop',
  'Magazine Luiza',
  'Shopee',
  'Outras'
];

const NavigationBar: React.FC<NavigationBarProps> = ({ 
  currentCategory,
  currentStore,
  searchQuery,
  loggedInUser,
  onLoginClick,
  onCreateDealClick,
  onLogout
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [inputValue, setInputValue] = useState(searchQuery);
  const [deals, setDeals] = useState<any[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);

  useEffect(() => {
    const fetchDeals = async () => {
      try {
        const url = import.meta.env.VITE_API_URL || 'http://localhost:5172/api';
        const res = await fetch(`${url}/deals`);
        const data = await res.json();
        setDeals(data);
      } catch (err) {
        console.error('Failed to fetch deals for search', err);
      }
    };
    fetchDeals();
  }, []);

  const removeAccents = (str: string) => {
    if (!str) return '';
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  };

  const normalizedQuery = removeAccents(inputValue.toLowerCase());
  const searchResults = inputValue.trim() ? deals.filter(d => 
    removeAccents(d.title.toLowerCase()).includes(normalizedQuery) ||
    removeAccents(d.description?.toLowerCase() || '').includes(normalizedQuery)
  ) : [];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (inputValue) params.set('q', inputValue);
    if (currentCategory && currentCategory !== 'Todas') params.set('category', currentCategory);
    if (currentStore && currentStore !== 'Todas') params.set('store', currentStore);
    navigate(`/?${params.toString()}`);
  };

  const handleCategoryClick = (category: string) => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    if (category !== 'Todas') params.set('category', category);
    if (currentStore && currentStore !== 'Todas') params.set('store', currentStore);
    navigate(`/?${params.toString()}`);
  };

  const handleStoreClick = (store: string) => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    if (currentCategory && currentCategory !== 'Todas') params.set('category', currentCategory);
    if (store !== 'Todas') params.set('store', store);
    navigate(`/?${params.toString()}`);
  };

  return (
    <nav className="navbar">
      <div className="navbar-top">
        <div className="navbar-logo" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }} onClick={() => navigate('/')}>
          <img src="/hardpromo-logo.png" alt="HardPromo Oficial" style={{ width: '45px', height: '45px', objectFit: 'contain' }} />
          <a href="#" onClick={(e) => { e.preventDefault(); }} style={{ fontWeight: 'bold', fontSize: '1.25rem', paddingLeft: '4px' }}>HardPromo</a>
        </div>
        
        <form className="navbar-search" onSubmit={handleSearchSubmit} style={{ position: 'relative' }}>
          <input 
            type="text" 
            placeholder="Pesquisar promoções..." 
            value={inputValue}
            onFocus={() => setShowSearchResults(true)}
            onBlur={() => setTimeout(() => setShowSearchResults(false), 200)}
            onChange={(e) => {
              setInputValue(e.target.value);
              setShowSearchResults(true);
            }}
          />
          <button type="submit" className="search-btn">🔍</button>

          {showSearchResults && inputValue.trim() && (
            <div className="search-results-dropdown">
              {searchResults.length > 0 ? (
                searchResults.map(deal => (
                  <div key={deal.id} className="search-result-item" onClick={() => navigate(`/deal/${deal.id}`)}>
                    <img src={deal.image_url} alt={deal.title} className="search-result-img" referrerPolicy="no-referrer" onError={(e) => { e.currentTarget.src = 'https://placehold.co/100x100/e2e8f0/475569?text=Sem+Foto'; }} />
                    <div className="search-result-info">
                      <div className="search-result-title">{deal.title}</div>
                      <div className="search-result-price">R$ {parseFloat(deal.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="search-result-item no-results">Nenhuma promoção encontrada</div>
              )}
            </div>
          )}
        </form>

        <div className="navbar-actions">
          {loggedInUser ? (
            <>
              <button className="button" onClick={onCreateDealClick}>Enviar promoção</button>
              <div className="profile-menu-container" style={{ position: 'relative' }}>
                <button 
                  className="button secondary profile-btn" 
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 16px', pointerEvents: 'none' }}
                >
                  <img src={loggedInUser.avatar_url || '/default-avatar.png'} alt="Avatar" style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover' }} />
                  {loggedInUser.username}
                </button>
                <div className="profile-dropdown-wrapper">
                  <div className="profile-dropdown">
                    <button onMouseDown={() => { navigate('/profile'); }}>Meu Perfil</button>
                    <button onMouseDown={() => { navigate('/profile/posts'); }}>Minhas Promoções</button>
                    <button onMouseDown={() => { navigate('/profile/favorites'); }}>Favoritos</button>
                    {loggedInUser?.is_admin && (
                      <button onMouseDown={() => { navigate('/admin'); }} style={{ color: '#0056b3', fontWeight: 'bold' }}>Painel Admin</button>
                    )}
                    <button onMouseDown={() => { if(onLogout) onLogout(); }} style={{ color: '#d32f2f' }}>Sair</button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <button className="button secondary" onClick={onLoginClick}>Entrar / Cadastrar</button>
          )}
        </div>
      </div>

      <div className="navbar-bottom">
        <ul className="navbar-links">
          <li>
            <a 
              className={(!currentCategory || currentCategory === 'Todas') && (!currentStore || currentStore === 'Todas') ? 'active' : ''} 
              onClick={() => {
                const params = new URLSearchParams();
                if (searchQuery) params.set('q', searchQuery);
                navigate(`/?${params.toString()}`);
              }}
              style={{ cursor: 'pointer' }}
            >Todas as Promoções</a>
          </li>
          <li className="category-menu-container" style={{ position: 'relative' }}>
            <a 
              style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
            >
              Componentes ▾
            </a>
            <div className="category-dropdown-wrapper">
              <div className="category-dropdown">
                {HARDWARE_CATEGORIES.filter(c => c !== 'Todas').map(cat => (
                  <button 
                    key={cat}
                    onMouseDown={() => { handleCategoryClick(cat); }} 
                    style={{ 
                      color: currentCategory === cat ? '#0056b3' : '#333',
                      fontWeight: currentCategory === cat ? '600' : 'normal'
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </li>
          <li className="category-menu-container" style={{ position: 'relative' }}>
            <a 
              style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
            >
              Lojas ▾
            </a>
            <div className="category-dropdown-wrapper">
              <div className="category-dropdown">
                {STORES.filter(s => s !== 'Todas').map(store => (
                  <button 
                    key={store}
                    onMouseDown={() => { handleStoreClick(store); }} 
                    style={{ 
                      color: currentStore === store ? '#0056b3' : '#333',
                      fontWeight: currentStore === store ? '600' : 'normal'
                    }}
                  >
                    {store}
                  </button>
                ))}
              </div>
            </div>
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default NavigationBar;
