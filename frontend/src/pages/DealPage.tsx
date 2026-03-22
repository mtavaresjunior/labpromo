import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import CreateDealModal from '../components/CreateDealModal';
import { formatTimeAgo } from '../utils/formatTime';
import { getStoredUser, jsonAuthHeaders, authHeaders } from '../utils/auth';
import './DealPage.css';

interface Deal {
  id: number;
  title: string;
  description: string;
  price: string;
  original_price: string;
  image_url: string;
  likes_count: number;
  dislikes_count: number;
  username: string;
  created_at: string;
  link?: string;
  posted_by: number;
  product_id?: number | null;
}

interface Comment {
  id: number;
  deal_id: number;
  user_id: number;
  content: string;
  likes_count: number;
  dislikes_count: number;
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
  const [priceHistory, setPriceHistory] = useState<any[]>([]);
  
  const [isFavorite, setIsFavorite] = useState(false);
  const [userDealVote, setUserDealVote] = useState<1 | -1 | null>(null);
  const [userCommentVotes, setUserCommentVotes] = useState<Record<number, 1 | -1>>({});
  const [loggedInUser, setLoggedInUser] = useState<any>(null);

  useEffect(() => {
    const user = getStoredUser();
    if (user) setLoggedInUser(user);
  }, []);

  useEffect(() => {
    if (!loggedInUser || !deal) return;
    const checkFav = async () => {
      try {
        const url = import.meta.env.VITE_API_URL || 'http://localhost:5172/api';
        const res = await fetch(`${url}/users/${loggedInUser.id}/favorites`, { headers: authHeaders() });
        const favs = await res.json();
        setIsFavorite(Array.isArray(favs) && favs.some((f: any) => f.id === deal.id));
      } catch (err) {}
    }
    checkFav();
  }, [loggedInUser, deal]);

  const toggleFavorite = async () => {
    if (!loggedInUser) return alert('Faça login para favoritar!');
    try {
      const url = import.meta.env.VITE_API_URL || 'http://localhost:5172/api';
      if (isFavorite) {
         await fetch(`${url}/deals/${deal.id}/favorite`, { method: 'DELETE', headers: authHeaders() });
         setIsFavorite(false);
      } else {
         await fetch(`${url}/deals/${deal.id}/favorite`, {
           method: 'POST',
           headers: jsonAuthHeaders(),
           body: JSON.stringify({}),
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
      const url = import.meta.env.VITE_API_URL || 'http://localhost:5172/api';
      const res = await fetch(`${url}/comments/deal/${dealId}`, {
        method: 'POST',
        headers: jsonAuthHeaders(),
        body: JSON.stringify({ content: newComment }),
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
      const url = import.meta.env.VITE_API_URL || 'http://localhost:5172/api';
      const res = await fetch(`${url}/comments/deal/${dealId}`, {
        method: 'POST',
        headers: jsonAuthHeaders(),
        body: JSON.stringify({ content: replyContent, parent_id: parentId }),
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
      const url = import.meta.env.VITE_API_URL || 'http://localhost:5172/api';
      const res = await fetch(`${url}/deals/${dealId}`, {
        method: 'DELETE',
        headers: jsonAuthHeaders(),
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
      const url = import.meta.env.VITE_API_URL || 'http://localhost:5172/api';
      const res = await fetch(`${url}/comments/${commentId}`, {
        method: 'DELETE',
        headers: jsonAuthHeaders(),
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
        const url = import.meta.env.VITE_API_URL || 'http://localhost:5172/api';
        
        // Fetch Deals from the general list instead of creating a new endpoint just for MVP
        const dealsRes = await fetch(`${url}/deals`);
        const deals = await dealsRes.json();
        const foundDeal = deals.find((d: any) => d.id === dealId);
        
        if (foundDeal) {
          setDeal(foundDeal);
          // Fetch Product History if linked
          if (foundDeal.product_id) {
            try {
              const histRes = await fetch(`${url}/products/${foundDeal.product_id}/history`);
              if (histRes.ok) {
                const histData = await histRes.json();
                // Format dates for the chart
                const formattedHist = histData.map((h: any) => ({
                    ...h,
                    date: new Date(h.recorded_at).toLocaleDateString(),
                    preco: Number(h.price)
                }));
                setPriceHistory(formattedHist);
              }
            } catch (err) {
              console.error(err);
            }
          }
        }

        // Fetch Comments
        const commentsRes = await fetch(`${url}/comments/deal/${dealId}`);
        const commentsData = await commentsRes.json();
        setComments(commentsData);

        if (loggedInUser) {
           const userVotesRes = await fetch(`${url}/deals/user-votes/${loggedInUser.id}`, { headers: authHeaders() });
           if (userVotesRes.ok) {
             const userVotes = await userVotesRes.json();
             const dealVote = userVotes.find((v: any) => v.deal_id === dealId);
             if (dealVote) setUserDealVote(dealVote.vote_type);
           }

           const commentVotesRes = await fetch(`${url}/comments/user-votes/${loggedInUser.id}`, { headers: authHeaders() });
           if (commentVotesRes.ok) {
             const commentVotes = await commentVotesRes.json();
             const cvMap: Record<number, 1 | -1> = {};
             commentVotes.forEach((v: any) => { cvMap[v.comment_id] = v.vote_type; });
             setUserCommentVotes(cvMap);
           }
        }
      } catch (error) {
        console.error("Error fetching deal data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDealData();
  }, [dealId, loggedInUser]);

  const handleDealVote = async (vote: 'up' | 'down') => {
    if (!loggedInUser) return alert('Faça login para avaliar');
    try {
      const url = import.meta.env.VITE_API_URL || 'http://localhost:5172/api';
      const res = await fetch(`${url}/deals/${dealId}/vote`, {
        method: 'POST',
        headers: jsonAuthHeaders(),
        body: JSON.stringify({ vote }),
      });
      if (res.ok) {
        const updatedDeal = await res.json();
        setDeal(prev => prev ? { ...prev, likes_count: updatedDeal.likes_count, dislikes_count: updatedDeal.dislikes_count } : null);
        
        const voteType = vote === 'up' ? 1 : -1;
        if (userDealVote === voteType) setUserDealVote(null);
        else setUserDealVote(voteType);
      }
    } catch(e) {}
  };

  const handleCommentVote = async (commentId: number, vote: 'up' | 'down') => {
    if (!loggedInUser) return alert('Faça login para avaliar');
    try {
      const url = import.meta.env.VITE_API_URL || 'http://localhost:5172/api';
      const res = await fetch(`${url}/comments/${commentId}/vote`, {
        method: 'POST',
        headers: jsonAuthHeaders(),
        body: JSON.stringify({ vote }),
      });
      if (res.ok) {
        const updatedComment = await res.json();
        setComments(comments.map(c => c.id === commentId ? { ...c, likes_count: updatedComment.likes_count, dislikes_count: updatedComment.dislikes_count } : c));
        
        const voteType = vote === 'up' ? 1 : -1;
        setUserCommentVotes(prev => {
          const newVotes = { ...prev };
          if (newVotes[commentId] === voteType) delete newVotes[commentId];
          else newVotes[commentId] = voteType;
          return newVotes;
        });
      }
    } catch(e) {}
  };

  if (loading) return <div className="loading-state">Carregando detalhes...</div>;
  if (!deal) return <div className="loading-state">Promoção não encontrada. <button onClick={() => navigate('/')}>Voltar</button></div>;

  const renderComment = (commentId: number, depth: number = 0) => {
    const c = comments.find(com => com.id === commentId);
    if (!c) return null;
    const replies = comments.filter(reply => reply.parent_id === c.id);

    return (
      <div key={c.id} className={`comment-item${depth > 0 ? ' reply' : ''}`}>
        <div className={depth === 0 ? 'comment-author-main' : 'comment-author-reply'}>
          {c.username}
        </div>
        <div className="comment-content">{c.content}</div>
        <div className="comment-actions">
          <button
            onClick={() => handleCommentVote(c.id, 'up')}
            className={`comment-vote-btn${userCommentVotes[c.id] === 1 ? ' active-up' : ''}`}
            title="Gostei"
          >
            👍 {c.likes_count || 0}
          </button>
          <button
            onClick={() => handleCommentVote(c.id, 'down')}
            className={`comment-vote-btn${userCommentVotes[c.id] === -1 ? ' active-down' : ''}`}
            title="Não gostei"
          >
            👎 {c.dislikes_count || 0}
          </button>
        </div>
        <div className="comment-footer">
          <span className="comment-date">{new Date(c.created_at).toLocaleDateString()}</span>
          <button className="btn-reply" onClick={() => { setReplyingTo(replyingTo === c.id ? null : c.id); setReplyContent(''); }}>
            Responder
          </button>
          {(loggedInUser && (loggedInUser.id === c.user_id || loggedInUser.is_admin)) && (
            <button className="btn-delete-comment" onClick={() => handleDeleteComment(c.id)} title="Excluir Comentário">
              🗑️ Excluir
            </button>
          )}
        </div>

        {replyingTo === c.id && (
          <form onSubmit={(e) => handleReplySubmit(e, c.id)} className="reply-form">
            <input
              type="text"
              value={replyContent}
              onChange={e => setReplyContent(e.target.value)}
              placeholder="Escreva sua resposta..."
              autoFocus
            />
            <button type="submit" className="button secondary">Enviar</button>
          </form>
        )}

        {replies.length > 0 && (
          <div className="comment-replies">
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
        <div className="deal-details-image" style={{ position: 'relative' }}>
          <img src={deal.image_url} alt={deal.title} referrerPolicy="no-referrer" onError={(e) => { e.currentTarget.src = 'https://placehold.co/600x600/e2e8f0/475569?text=Sem+Foto'; }} />
          <div className="deal-votes-container">
            <button
              onClick={() => handleDealVote('up')}
              className={`vote-btn${userDealVote === 1 ? ' active-up' : ''}`}
            >
              👍 <strong>{deal.likes_count}</strong>
            </button>
            <button
              onClick={() => handleDealVote('down')}
              className={`vote-btn${userDealVote === -1 ? ' active-down' : ''}`}
            >
              👎 <strong>{deal.dislikes_count}</strong>
            </button>
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
             {deal.created_at && <span className="deal-time-ago">• {formatTimeAgo(deal.created_at)}</span>}
          </div>
          
          <p className="deal-page-description">{deal.description}</p>
          
          {priceHistory.length > 0 && (
            <div className="price-history-card">
              <h3>Histórico de Preços</h3>
              <div style={{ width: '100%', height: 250 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={priceHistory} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                    <YAxis dataKey="preco" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} tickFormatter={(value) => `R$${value}`} />
                    <Tooltip formatter={(value: number) => [`R$ ${value.toFixed(2)}`, 'Preço']} />
                    <Line type="monotone" dataKey="preco" stroke="#16a34a" strokeWidth={2.5} dot={{ r: 4, fill: '#16a34a' }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          <div className="deal-page-actions">
            <button className={`button${isFavorite ? ' secondary' : ''}`} onClick={toggleFavorite}>
              {isFavorite ? '❤️ Remover dos Favoritos' : '🤍 Favoritar'}
            </button>
            <button className="button" onClick={() => deal.link ? window.open(deal.link, '_blank') : alert('Link não disponível')}>
              Pegar Promoção
            </button>
            {(loggedInUser && (loggedInUser.id === deal.posted_by || loggedInUser.is_admin)) && (
              <>
                <button className="button secondary" onClick={() => setIsEditing(true)}>✏️ Editar</button>
                <button className="button btn-delete" onClick={handleDeleteDeal}>🗑️ Excluir</button>
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
