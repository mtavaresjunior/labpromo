import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useSearchParams } from 'react-router-dom';
import Home from './pages/Home';
import DealPage from './pages/DealPage';
import ProfilePage from './pages/ProfilePage';
import NavigationBar from './components/NavigationBar';
import AuthModal from './components/AuthModal';
import CreateDealModal from './components/CreateDealModal';
import AdminPage from './pages/AdminPage';

function App() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('q') || '';
  const category = searchParams.get('category') || 'Promocoes';
  const store = searchParams.get('store') || '';
  
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showCreateDealModal, setShowCreateDealModal] = useState(false);
  
  const [loggedInUser, setLoggedInUser] = useState<any>(null);
  const [dealsRefreshKey, setDealsRefreshKey] = useState(0); 

  useEffect(() => {
    const user = localStorage.getItem('user');
    if (user) setLoggedInUser(JSON.parse(user));
  }, []);

  const handleDealCreated = () => {
     setShowCreateDealModal(false);
     setDealsRefreshKey(prev => prev + 1);
     navigate('/');
  };

  const handleLoginSuccess = (userData: any) => {
    setLoggedInUser(userData);
    setShowAuthModal(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    setLoggedInUser(null);
    navigate('/');
  };

  return (
    <div className="home-layout">
      <NavigationBar 
        searchQuery={searchQuery}
        currentCategory={category}
        currentStore={store}
        loggedInUser={loggedInUser}
        onLoginClick={() => setShowAuthModal(true)}
        onCreateDealClick={() => setShowCreateDealModal(true)}
        onLogout={handleLogout}
      />
      
      <Routes>
        <Route path="/" element={
          <Home 
            key={dealsRefreshKey}
            searchQuery={searchQuery} 
            category={category} 
            store={store}
          />
        } />
        <Route path="/deal/:id" element={<DealPage />} />
        <Route path="/profile" element={
          <ProfilePage initialTab="edit" onLogout={handleLogout} />
        } />
        <Route path="/profile/posts" element={
          <ProfilePage initialTab="posts" onLogout={handleLogout} />
        } />
        <Route path="/profile/favorites" element={
          <ProfilePage initialTab="favorites" onLogout={handleLogout} />
        } />
        <Route path="/admin" element={
          <AdminPage loggedInUser={loggedInUser} />
        } />
      </Routes>
      
      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} onSuccess={handleLoginSuccess} />}
      {showCreateDealModal && <CreateDealModal onClose={() => setShowCreateDealModal(false)} onCreated={handleDealCreated} />}
    </div>
  );
}

export default App;
