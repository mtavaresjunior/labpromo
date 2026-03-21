import React from 'react';
import './DealCard.css';
import { formatTimeAgo } from '../utils/formatTime';

interface DealProps {
  id: number;
  title: string;
  price: string | number;
  originalPrice?: string | number;
  image: string;
  likesCount?: number;
  dislikesCount?: number;
  store: string;
  commentsCount?: number;
  onClick?: () => void;
  link?: string;
  createdAt?: string;
}

const DealCard: React.FC<DealProps> = ({ title, price, originalPrice, image, likesCount = 0, dislikesCount = 0, store, username, commentsCount, onClick, link, createdAt }) => {
  return (
    <div className="deal-card" onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default' }}>
      <div className="deal-image">
        <img src={image} alt={title} />
        <div className="likes-dislikes-badge" style={{ position: 'absolute', bottom: '8px', right: '8px', display: 'flex', gap: '8px', background: 'rgba(255, 255, 255, 0.9)', padding: '4px 8px', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 'bold', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <span style={{ color: '#0056b3' }}>👍 {likesCount}</span>
          <span style={{ color: '#e53935' }}>👎 {dislikesCount}</span>
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
          {createdAt && <span className="time-ago" style={{ color: '#888', fontSize: '0.85rem' }}>• {formatTimeAgo(createdAt)}</span>}
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
