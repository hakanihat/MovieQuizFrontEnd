// src/App.jsx
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner'; 

// --- CONTEXTS ---
import { AuthProvider } from './contexts/AuthContext';
import { WatchlistProvider } from './contexts/WatchlistContext';
import { SearchProvider } from './contexts/SearchContext'; 

// --- PAGES ---
import LoginPage from './pages/LoginPage';
import CategoryPage from './pages/CategoryPage';
import RegisterPage from './pages/RegistrationPage';
import Home from './pages/Home';
import ProfilePage from './pages/ProfilePage';
import WatchlistPage from './pages/WatchlistPage';
import QuizPage from './pages/QuizPage';
import LeaderBoardPage from './pages/LeaderBoardPage';
import MovieDetailsPage from './pages/MovieDetailsPage';

// --- COMPONENTS ---
import RequireAuth from './components/RequireAuth';
import Header from './components/Header'; 
import './App.css'; 

function App() {
  return (
    <AuthProvider>
      <WatchlistProvider> 
        {/* 1. Wrap everything in SearchProvider so Header and Home can share state */}
        <SearchProvider>
          <BrowserRouter>
            
            {/* 2. Global Header (Inside Router, Outside Routes) */}
            <Header />

            <div className="page"> 
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />

                {/* Protected Routes */}
                
                {/* MY PROFILE (Own view) */}
                <Route path="/profile" element={<RequireAuth><ProfilePage /></RequireAuth>} />
                
                {/* OTHER USER PROFILE (Visitor view) - NEW ROUTE */}
                <Route path="/profile/:userId" element={<RequireAuth><ProfilePage /></RequireAuth>} />

                <Route path="/watchlist" element={<RequireAuth><WatchlistPage /></RequireAuth>} />
                <Route path="/quiz/:imdbID" element={<RequireAuth><QuizPage /></RequireAuth>} />
                <Route path="/movie/:imdbID" element={<RequireAuth><MovieDetailsPage /></RequireAuth>} />
                <Route path="/leaderboard" element={<RequireAuth><LeaderBoardPage /></RequireAuth>} />
                
                {/* Categories */}
                <Route path="/category/:type" element={<CategoryPage />} />
                
                {/* Fallback */}
                <Route path="*" element={<LoginPage />} />
              </Routes>
            </div>
            
            {/* Toast Notifications */}
            <Toaster 
              position="bottom-center" 
              theme="dark"
              toastOptions={{
                style: {
                  background: 'rgba(20, 20, 20, 0.95)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#fff',
                  borderRadius: '12px',
                  fontSize: '0.9rem',
                },
              }}
            />
          </BrowserRouter>
        </SearchProvider>
      </WatchlistProvider>
    </AuthProvider>
  );
}

export default App;