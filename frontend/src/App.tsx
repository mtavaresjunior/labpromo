import React, { useState, useEffect } from 'react';
import Home from './pages/Home';
import DealPage from './pages/DealPage';
import ProfilePage from './pages/ProfilePage';
import NavigationBar from './components/NavigationBar';
import AuthModal from './components/AuthModal';
import CreateDealModal from './components/CreateDealModal';
import AdminPage from './pages/AdminPage';

function App() {
  const [currentView, setCurrentView] = useState<'home' | 'deal' | 'profile' | 'admin'>('home');
  const [selectedDealId, setSelectedDealId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState('Promocoes');
  
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showCreateDealModal, setShowCreateDealModal] = useState(false);
  
  const [loggedInUser, setLoggedInUser] = useState<any>(null);

  const [profileTab, setProfileTab] = useState<'posts'|'favorites'|'edit'>('edit');

  // Triggers refresh in Home when deal is created
  const [dealsRefreshKey, setDealsRefreshKey] = useState(0); 

  useEffect(() => {
    const user = localStorage.getItem('user');
    if (user) setLoggedInUser(JSON.parse(user));
  }, []);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentView('home');
  };

  const handleNavigateHome = () => {
    setCurrentView('home');
    setSearchQuery('');
    setCategory('Promocoes');
  };

  const handleCategoryChange = (cat: string) => {
    setCategory(cat);
    setCurrentView('home');
  };

  const handleDealClick = (id: number) => {
    setSelectedDealId(id);
    setCurrentView('deal');
  };
  
  const handleDealCreated = () => {
     setShowCreateDealModal(false);
     setDealsRefreshKey(prev => prev + 1);
     handleNavigateHome(); // go home to see it
  };

  const handleLoginSuccess = (userData: any) => {
    setLoggedInUser(userData);
    setShowAuthModal(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    setLoggedInUser(null);
    setCurrentView('home');
  };

  const handleProfileClick = (tab: 'posts' | 'favorites' | 'edit') => {
    setProfileTab(tab);
    setCurrentView('profile');
  };

  return (
    <div className="home-layout">
      <NavigationBar 
        onSearch={handleSearch} 
        onNavigateHome={handleNavigateHome}
        onCategoryChange={handleCategoryChange}
        currentCategory={category}
        searchQuery={searchQuery}
        loggedInUser={loggedInUser}
        onLoginClick={() => setShowAuthModal(true)}
        onCreateDealClick={() => setShowCreateDealModal(true)}
        onProfileClick={handleProfileClick}
        onAdminClick={() => setCurrentView('admin')}
        onLogout={handleLogout}
      />
      {currentView === 'home' && (
        <Home 
          key={dealsRefreshKey}
          searchQuery={searchQuery} 
          category={category} 
          onDealClick={handleDealClick} 
        />
      )}
      {currentView === 'deal' && selectedDealId && (
        <DealPage dealId={selectedDealId} onBack={handleNavigateHome} />
      )}
      {currentView === 'profile' && (
        <ProfilePage initialTab={profileTab} onDealClick={handleDealClick} onLogout={handleLogout} />
      )}
      {currentView === 'admin' && (
        <AdminPage loggedInUser={loggedInUser} onNavigateHome={handleNavigateHome} />
      )}
      
      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} onSuccess={handleLoginSuccess} />}
      {showCreateDealModal && <CreateDealModal onClose={() => setShowCreateDealModal(false)} onCreated={handleDealCreated} />}
    </div>
  );
}

export default App;
