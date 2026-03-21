import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './NavigationBar.css';

interface NavigationBarProps {
  currentCategory: string;
  searchQuery: string;
  loggedInUser?: any;
  onLoginClick: () => void;
  onCreateDealClick: () => void;
  onLogout?: () => void;
}

const NavigationBar: React.FC<NavigationBarProps> = ({ 
//...
// this replace chunk is manually managed because I need to replace two things in NavigationBar. Let's do it in the next turn if needed. Oh, replacing multiple non-contiguous lines requires multi_replace. Let me do simple replace of the entire dropdown. 
  onSearch, 
  onNavigateHome, 
  onCategoryChange,
  currentCategory,
  searchQuery,
  loggedInUser,
  onLoginClick,
  onCreateDealClick,
  onProfileClick,
  onAdminClick,
  onLogout
}) => {
  const [inputValue, setInputValue] = useState(searchQuery);
  const [showDropdown, setShowDropdown] = useState(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(inputValue);
  };

  return (
    <nav className="navbar">
      <div className="navbar-top">
        <div className="navbar-logo" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }} onClick={() => onNavigateHome()}>
          <img src="/mascote.png?v=2" alt="Mascote Menino de TI Promos" style={{ width: '45px', height: '45px', objectFit: 'contain' }} />
          <a href="#" onClick={(e) => { e.preventDefault(); }}>Menino de TI Promos</a>
        </div>
        
        <form className="navbar-search" onSubmit={handleSearchSubmit}>
          <input 
            type="text" 
            placeholder="Pesquisar promoções..." 
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
          />
          <button type="submit" className="search-btn">🔍</button>
        </form>

        <div className="navbar-actions">
          {loggedInUser ? (
            <div className="profile-menu-container" style={{ position: 'relative' }}>
              <button 
                className="button secondary profile-btn" 
                onClick={() => setShowDropdown(!showDropdown)} 
                onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 16px' }}
              >
                <img src={loggedInUser.avatar_url || '/default-avatar.png'} alt="Avatar" style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover' }} />
                {loggedInUser.username}
              </button>
              {showDropdown && (
                <div className="profile-dropdown" style={{
                  position: 'absolute', top: '100%', right: 0, marginTop: '8px',
                  backgroundColor: 'white', border: '1px solid #ddd', borderRadius: '4px',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)', zIndex: 10, minWidth: '150px'
                }}>
                  <button onMouseDown={() => { navigate('/profile'); setShowDropdown(false); }} style={{ width: '100%', padding: '12px 16px', border: 'none', background: 'none', textAlign: 'left', cursor: 'pointer', borderBottom: '1px solid #eee', color: '#333' }}>Meu Perfil</button>
                  <button onMouseDown={() => { navigate('/profile/posts'); setShowDropdown(false); }} style={{ width: '100%', padding: '12px 16px', border: 'none', background: 'none', textAlign: 'left', cursor: 'pointer', borderBottom: '1px solid #eee', color: '#333' }}>Minhas Promoções</button>
                  <button onMouseDown={() => { navigate('/profile/favorites'); setShowDropdown(false); }} style={{ width: '100%', padding: '12px 16px', border: 'none', background: 'none', textAlign: 'left', cursor: 'pointer', borderBottom: '1px solid #eee', color: '#333' }}>Favoritos</button>
                  {loggedInUser?.is_admin && (
                    <button onMouseDown={() => { navigate('/admin'); setShowDropdown(false); }} style={{ width: '100%', padding: '12px 16px', border: 'none', background: 'none', textAlign: 'left', cursor: 'pointer', borderBottom: '1px solid #eee', color: '#0056b3', fontWeight: 'bold' }}>Painel Admin</button>
                  )}
                  <button onMouseDown={() => { if(onLogout) onLogout(); setShowDropdown(false); }} style={{ width: '100%', padding: '12px 16px', border: 'none', background: 'none', textAlign: 'left', cursor: 'pointer', color: '#d32f2f' }}>Sair</button>
                </div>
              )}
            </div>
          ) : (
            <button className="button secondary" onClick={onLoginClick}>Entrar / Cadastrar</button>
          )}
          <button className="button" onClick={onCreateDealClick}>Enviar promoção</button>
        </div>
      </div>

      <div className="navbar-bottom">
        <ul className="navbar-links">
          <li>
            <a 
              className={currentCategory === 'Promocoes' ? 'active' : ''} 
              onClick={() => handleCategoryClick('Promocoes')}
            >Promoções</a>
          </li>
          <li>
            <a 
              className={currentCategory === 'Cupons' ? 'active' : ''} 
              onClick={() => handleCategoryClick('Cupons')}
            >Cupons</a>
          </li>
          <li>
            <a 
              className={currentCategory === 'Discussoes' ? 'active' : ''} 
              onClick={() => handleCategoryClick('Discussoes')}
            >Discussões</a>
          </li>
          <li>
            <a 
              className={currentCategory === 'Alertas' ? 'active' : ''} 
              onClick={() => handleCategoryClick('Alertas')}
            >Alertas</a>
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default NavigationBar;
