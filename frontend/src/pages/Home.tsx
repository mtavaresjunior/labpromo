import React, { useEffect, useState } from 'react';
import DealCard from '../components/DealCard';
import './Home.css';

interface Deal {
  id: number;
  title: string;
  description: string;
  price: string;
  original_price: string;
  image_url: string;
  temperature: number;
  store_name: string;
  username: string;
  created_at: string;
}

interface HomeProps {
  searchQuery: string;
  category: string;
  onDealClick: (id: number) => void;
}

const Home: React.FC<HomeProps> = ({ searchQuery, category, onDealClick }) => {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'quentes' | 'recentes' | 'comentados'>('quentes');

  useEffect(() => {
    const fetchDeals = async () => {
      try {
        const url = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
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

  // Apply search query
  let filteredDeals = deals.filter(d => 
    d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Apply mock category filter if needed
  if (category === 'Cupons') {
    filteredDeals = filteredDeals.filter(d => d.title.toLowerCase().includes('cupom'));
  }

  // Apply sorting filter
  if (filter === 'quentes') {
    filteredDeals.sort((a, b) => b.temperature - a.temperature);
  } else if (filter === 'recentes') {
    filteredDeals.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  } else if (filter === 'comentados') {
    // We don't have comments count in the deal payload yet, so fallback to random or temperature
    filteredDeals.sort((a, b) => b.id - a.id); // fallback mock for comments sort
  }

  return (
    <main className="main-content">
      <header className="feed-header">
        <h2>{searchQuery ? `Resultados para "${searchQuery}"` : category}</h2>
        <div className="filters">
          <button 
            className={`filter-btn ${filter === 'quentes' ? 'active' : ''}`}
            onClick={() => setFilter('quentes')}
          >Quentes</button>
          <button 
            className={`filter-btn ${filter === 'recentes' ? 'active' : ''}`}
            onClick={() => setFilter('recentes')}
          >Recentes</button>
          <button 
            className={`filter-btn ${filter === 'comentados' ? 'active' : ''}`}
            onClick={() => setFilter('comentados')}
          >Comentados</button>
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
              <div key={deal.id} onClick={() => onDealClick(deal.id)} style={{ cursor: 'pointer' }}>
                <DealCard
                  id={deal.id}
                  title={deal.title}
                  price={deal.price}
                  originalPrice={deal.original_price}
                  image={deal.image_url}
                  temperature={deal.temperature}
                  store={deal.store_name}
                  username={deal.username}
                  commentsCount={deal.comments_count || 0}
                  link={deal.link}
                  onClick={() => onDealClick(deal.id)}
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
