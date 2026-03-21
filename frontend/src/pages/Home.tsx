import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DealCard from '../components/DealCard';
import './Home.css';

interface Deal {
  id: number;
  title: string;
  description: string;
  price: string;
  original_price: string;
  image_url: string;
  likes_count: number;
  dislikes_count: number;
  store_name: string;
  username: string;
  created_at: string;
  comments_count?: number;
  category?: string;
  link?: string;
}

interface HomeProps {
  searchQuery: string;
  category: string;
  store: string;
}

const removeAccents = (str: string) => {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
};

const Home: React.FC<HomeProps> = ({ searchQuery, category, store }) => {
  const navigate = useNavigate();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'avaliados' | 'recentes'>('recentes');

  useEffect(() => {
    const fetchDeals = async () => {
      try {
        const url = import.meta.env.VITE_API_URL || 'http://localhost:5172/api';
        const res = await fetch(`${url}/deals`);
        const data = await res.json();
        setDeals(data);
      } catch (err) {
        console.error('Failed to fetch deals', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDeals();
  }, []);

  // Apply fuzzy search query
  const normalizedQuery = removeAccents(searchQuery.toLowerCase());
  let filteredDeals = deals.filter(d => 
    removeAccents(d.title.toLowerCase()).includes(normalizedQuery) ||
    removeAccents(d.description?.toLowerCase() || '').includes(normalizedQuery)
  );

  // Apply category filter
  if (category && category !== 'Todas' && category !== 'Promocoes') {
    filteredDeals = filteredDeals.filter(d => d.category === category);
  }

  // Apply store filter
  if (store && store !== 'Todas') {
    filteredDeals = filteredDeals.filter(d => d.store_name === store);
  }

  // Apply sorting filter
  if (filter === 'avaliados') {
    filteredDeals.sort((a, b) => (b.likes_count - b.dislikes_count) - (a.likes_count - a.dislikes_count));
  } else if (filter === 'recentes') {
    filteredDeals.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  return (
    <main className="main-content">
      <header className="feed-header">
        <h2>{searchQuery ? `Resultados para "${searchQuery}"` : category}</h2>
        <div className="filters">
          <button 
            className={`filter-btn ${filter === 'recentes' ? 'active' : ''}`}
            onClick={() => setFilter('recentes')}
          >Mais recentes</button>
          <button 
            className={`filter-btn ${filter === 'avaliados' ? 'active' : ''}`}
            onClick={() => setFilter('avaliados')}
          >Melhores avaliados</button>
        </div>
      </header>

      {loading ? (
        <div className="loading-state">Carregando promoções...</div>
      ) : (
        <div className="deals-grid">
          {filteredDeals.length === 0 ? (
            <p>Nenhuma promoção encontrada.</p>
          ) : (
            filteredDeals.map(deal => (
              <div key={deal.id}>
                <DealCard
                  id={deal.id}
                  title={deal.title}
                  price={deal.price}
                  originalPrice={deal.original_price}
                  image={deal.image_url}
                  likesCount={deal.likes_count}
                  dislikesCount={deal.dislikes_count}
                  store={deal.store_name}
                  username={deal.username}
                  commentsCount={deal.comments_count || 0}
                  link={deal.link}
                  createdAt={deal.created_at}
                  onClick={() => navigate(`/deal/${deal.id}`)}
                />
              </div>
            ))
          )}
        </div>
      )}
    </main>
  );
};

export default Home;
