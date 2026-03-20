import React from 'react';
import './DealCard.css';

interface DealProps {
  id: number;
  title: string;
  price: string | number;
  originalPrice?: string | number;
  image: string;
  temperature: number;
  store: string;
  commentsCount?: number;
  onClick?: () => void;
  link?: string;
}

const DealCard: React.FC<DealProps> = ({ title, price, originalPrice, image, temperature, store, username, commentsCount, onClick, link }) => {
  return (
    <div className="deal-card" onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default' }}>
      <div className="deal-image">
        <img src={image} alt={title} />
        <div className={`temperature ${temperature > 50 ? 'hot' : 'cold'}`}>
          {temperature}°
        </div>
      </div>
      
      <div className="deal-content">
        <h3 className="deal-title">{title}</h3>
        <div className="deal-prices">
          <span className="current-price">R$ {Number(price).toFixed(2)}</span>
          {originalPrice && <span className="original-price">R$ {Number(originalPrice).toFixed(2)}</span>}
        </div>
        
        <div className="deal-meta">
          <span className="store">{store}</span>
          <span className="user">por {username}</span>
        </div>

        <div className="deal-actions">
          <button className="button secondary" onClick={(e) => { e.stopPropagation(); if(link) window.open(link, '_blank'); else alert('Link não disponível'); }}>Pegar Promoção</button>
          <div className="comments-count">
             💬 {commentsCount || 0}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DealCard;
