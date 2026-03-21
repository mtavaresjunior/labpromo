import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import CreateDealModal from '../components/CreateDealModal';
import './DealPage.css';

interface Deal {
  id: number;
  title: string;
  description: string;
  price: string;
  original_price: string;
  image_url: string;
  temperature: number;
  username: string;
  created_at: string;
  link?: string;
  posted_by: number;
}

interface Comment {
  id: number;
  deal_id: number;
  user_id: number;
  content: string;
  created_at: string;
  username: string;
  parent_id?: number;
}

const DealPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const dealId = parseInt(id || '0', 10);
  const navigate = useNavigate();
  const [deal, setDeal] = useState<Deal | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  
  const [isFavorite, setIsFavorite] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState<any>(null);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) setLoggedInUser(JSON.parse(userStr));
  }, []);

  useEffect(() => {
    if (!loggedInUser || !deal) return;
    const checkFav = async () => {
      try {
        const url = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
        const res = await fetch(`${url}/users/${loggedInUser.id}/favorites`);
        const favs = await res.json();
        setIsFavorite(favs.some((f: any) => f.id === deal.id));
      } catch (err) {}
    }
    checkFav();
  }, [loggedInUser, deal]);

  const toggleFavorite = async () => {
    if (!loggedInUser) return alert('Faça login para favoritar!');
    try {
      const url = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
      if (isFavorite) {
         await fetch(`${url}/deals/${deal.id}/favorite/${loggedInUser.id}`, { method: 'DELETE' });
         setIsFavorite(false);
      } else {
         await fetch(`${url}/deals/${deal.id}/favorite`, {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ user_id: loggedInUser.id })
         });
         setIsFavorite(true);
      }
    } catch (err) {
      alert('Erro ao favoritar');
    }
  };

  const submitComment = async () => {
    if (!loggedInUser) return alert('Faça login para comentar');
    if (!newComment.trim()) return;

    try {
      const url = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
      const res = await fetch(`${url}/comments/deal/${dealId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: loggedInUser.id, content: newComment })
      });
      if (res.ok) {
        const commentData = await res.json();
        setComments([...comments, { ...commentData, username: loggedInUser.username }]);
        setNewComment('');
      } else {
        alert('Erro ao enviar comentário');
      }
    } catch (err) {
      alert('Erro de conexão');
    }
  };

  const handleReplySubmit = async (e: React.FormEvent, parentId: number) => {
    e.preventDefault();
    if (!loggedInUser) {
      alert('Você precisa estar logado para responder!');
      return;
    }
    if (!replyContent.trim()) return;

    try {
      const url = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
      const res = await fetch(`${url}/comments/deal/${dealId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: loggedInUser.id, content: replyContent, parent_id: parentId })
      });
      if (res.ok) {
        const commentData = await res.json();
        setComments([...comments, { ...commentData, username: loggedInUser.username }]);
        setReplyContent('');
        setReplyingTo(null);
      } else {
        alert('Erro ao enviar resposta');
      }
    } catch (err) {
      alert('Erro de conexão');
    }
  };

  const handleDeleteDeal = async () => {
    if (!loggedInUser) return;
    if (!window.confirm('Tem certeza que deseja excluir esta promoção? Esta ação não pode ser desfeita.')) return;

    try {
      const url = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
      const res = await fetch(`${url}/deals/${dealId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: loggedInUser.id })
      });
      
      if (res.ok) {
        alert('Promoção excluída com sucesso!');
        navigate('/'); // nav back to feed
      } else {
        const data = await res.json();
        alert(data.error || 'Erro ao excluir promoção');
      }
    } catch (err) {
      alert('Erro de conexão ao excluir');
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!loggedInUser) return;
    if (!window.confirm('Tem certeza que deseja excluir este comentário?')) return;

    try {
      const url = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
      const res = await fetch(`${url}/comments/${commentId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: loggedInUser.id })
      });
      if (res.ok) {
        setComments(comments.filter(c => c.id !== commentId));
      } else {
        alert('Erro ao excluir comentário');
      }
    } catch (err) {
      alert('Erro de conexão ao excluir comentário');
    }
  };

  useEffect(() => {
    const fetchDealData = async () => {
      try {
        const url = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
        
        // Fetch Deals from the general list instead of creating a new endpoint just for MVP
        const dealsRes = await fetch(`${url}/deals`);
        const deals = await dealsRes.json();
        const foundDeal = deals.find((d: any) => d.id === dealId);
        
        if (foundDeal) setDeal(foundDeal);

        // Fetch Comments
        const commentsRes = await fetch(`${url}/comments/deal/${dealId}`);
        const commentsData = await commentsRes.json();
        setComments(commentsData);

      } catch (error) {
        console.error("Error fetching deal data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDealData();
  }, [dealId]);

  if (loading) return <div className="loading-state">Carregando detalhes...</div>;
  if (!deal) return <div className="loading-state">Promoção não encontrada. <button onClick={() => navigate('/')}>Voltar</button></div>;

  const renderComment = (commentId: number, depth: number = 0) => {
    const c = comments.find(com => com.id === commentId);
    if (!c) return null;
    const replies = comments.filter(reply => reply.parent_id === c.id);

    return (
      <div key={c.id} className="comment-item" style={{ marginBottom: depth === 0 ? '24px' : '0', marginLeft: depth === 0 ? '0' : '32px', borderLeft: depth === 0 ? 'none' : '2px solid #eee', paddingLeft: depth === 0 ? '0' : '16px' }}>
        <div className="comment-author" style={{ fontWeight: 'bold', color: depth === 0 ? '#0056b3' : '#555' }}>
          {c.username}
        </div>
        <div className="comment-content" style={{ marginTop: '4px' }}>{c.content}</div>
        <div className="comment-footer" style={{ display: 'flex', gap: '16px', alignItems: 'center', fontSize: '0.8rem', color: '#666', marginTop: '8px' }}>
          <div className="comment-date">{new Date(c.created_at).toLocaleDateString()}</div>
          <button className="button-text" style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 0, color: '#0056b3' }} onClick={() => { setReplyingTo(replyingTo === c.id ? null : c.id); setReplyContent(''); }}>
            Responder
          </button>
          {(loggedInUser && (loggedInUser.id === c.user_id || loggedInUser.is_admin)) && (
            <button 
              className="button-text" 
              style={{ color: '#dc3545', border: 'none', background: 'none', cursor: 'pointer', padding: 0 }} 
              onClick={() => handleDeleteComment(c.id)}
              title="Excluir Comentário"
            >
               🗑️ Excluir
            </button>
          )}
        </div>
        
        {replyingTo === c.id && (
          <form onSubmit={(e) => handleReplySubmit(e, c.id)} style={{ marginTop: '12px', display: 'flex', gap: '8px', marginBottom: '16px' }}>
            <input 
              type="text" 
              value={replyContent} 
              onChange={e => setReplyContent(e.target.value)} 
              placeholder="Escreva sua resposta..." 
              style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
              autoFocus
            />
            <button type="submit" className="button secondary" style={{ padding: '8px 16px' }}>Enviar</button>
          </form>
        )}

        {replies.length > 0 && (
          <div className="comment-replies" style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
            {replies.map(r => renderComment(r.id, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="deal-page-container">
      <button className="back-btn" onClick={() => navigate(-1)}>&larr; Voltar</button>
      
      <div className="deal-details-card">
        <div className="deal-details-image">
          <img src={deal.image_url} alt={deal.title} />
          <div className={`temperature badge ${deal.temperature > 50 ? 'hot' : 'cold'}`}>
             {deal.temperature}°
          </div>
        </div>
        
        <div className="deal-details-info">
          <h2>{deal.title}</h2>
          
          <div className="deal-pricing">
             <span className="current">R$ {Number(deal.price).toFixed(2)}</span>
             {deal.original_price && <span className="original">R$ {Number(deal.original_price).toFixed(2)}</span>}
          </div>
          
          <div className="deal-meta-info">
             <span>Vendido por <strong>{deal.store_name}</strong></span>
             <span>Postado por <strong>{deal.username}</strong></span>
          </div>
          
          <p className="deal-page-description">{deal.description}</p>
          <div className="deal-page-actions" style={{ display: 'flex', gap: '16px', marginTop: '16px' }}>
            <button className={`button ${isFavorite ? 'secondary' : ''}`} onClick={toggleFavorite} style={{ flex: 1 }}>
              {isFavorite ? '❤️ Remover dos Favoritos' : '🤍 Adicionar aos Favoritos'}
            </button>
            <button className="button" style={{ flex: 2 }} onClick={() => deal.link ? window.open(deal.link, '_blank') : alert('Link não disponível')}>
              Pegar Promoção
            </button>
            {(loggedInUser && (loggedInUser.id === deal.posted_by || loggedInUser.is_admin)) && (
              <>
                <button className="button secondary" style={{ flex: 1 }} onClick={() => setIsEditing(true)}>
                   ✏️ Editar
                </button>
                <button className="button" style={{ flex: 1, backgroundColor: '#dc3545', borderColor: '#dc3545' }} onClick={handleDeleteDeal}>
                   🗑️ Excluir
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="deal-comments-section">
        <h3>Comentários ({comments.length})</h3>
        
        <div className="comment-box">
          <textarea 
            placeholder="Deixe um comentário..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
          ></textarea>
          <button className="button" onClick={submitComment} disabled={!newComment.trim() || !loggedInUser}>
            {loggedInUser ? 'Enviar Comentário' : 'Faça login para comentar'}
          </button>
        </div>
        
        <div className="comments-list">
           {comments.length === 0 ? (
             <p className="no-comments">Nenhum comentário ainda. Seja o primeiro!</p>
           ) : (
             comments.filter(c => !c.parent_id).map(c => renderComment(c.id))
           )}
        </div>
      </div>
      {isEditing && (
        <CreateDealModal 
          initialData={deal} 
          onClose={() => setIsEditing(false)} 
          onCreated={() => {
            setIsEditing(false);
            window.location.reload(); // Simple refresh to show new data
          }} 
        />
      )}
    </div>
  );
};

export default DealPage;
