import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify'; // Use this if you are using react-toastify
import 'react-toastify/dist/ReactToastify.css';

// --- CONTEXTS ---
import { AuthProvider } from './contexts/AuthContext';
import { WatchlistProvider } from './contexts/WatchlistContext';
import { SearchProvider } from './contexts/SearchContext'; 

// --- COMPONENTS ---
import RequireAuth from './components/RequireAuth';
import RequireAdmin from './components/RequireAdmin'; // NEW
import Header from './components/Header'; 
import ErrorBoundary from './components/ErrorBoundary'; // NEW

// --- PAGES ---
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegistrationPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage'; // NEW
import ResetPasswordPage from './pages/ResetPasswordPage'; // NEW
import Home from './pages/Home';
import CategoryPage from './pages/CategoryPage';
import ProfilePage from './pages/ProfilePage';
import WatchlistPage from './pages/WatchlistPage';
import QuizPage from './pages/QuizPage';
import LeaderBoardPage from './pages/LeaderBoardPage';
import MovieDetailsPage from './pages/MovieDetailsPage';
import AdminDashboardPage from './pages/AdminDashboardPage'; // NEW
import NotFoundPage from './pages/NotFoundPage'; // NEW

import './App.css'; 

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <WatchlistProvider> 
          <SearchProvider>
            <BrowserRouter>
              <Header />
              <div className="page"> 
                <Routes>
                  {/* Public Routes */}
                  <Route path="/" element={<Home />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />
                  <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                  <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
                  <Route path="/category/:type" element={<CategoryPage />} />

                  {/* Protected User Routes */}
                  <Route path="/profile" element={<RequireAuth><ProfilePage /></RequireAuth>} />
                  <Route path="/profile/:userId" element={<RequireAuth><ProfilePage /></RequireAuth>} />
                  <Route path="/watchlist" element={<RequireAuth><WatchlistPage /></RequireAuth>} />
                  <Route path="/quiz/:imdbID" element={<RequireAuth><QuizPage /></RequireAuth>} />
                  <Route path="/movie/:imdbID" element={<RequireAuth><MovieDetailsPage /></RequireAuth>} />
                  <Route path="/leaderboard" element={<RequireAuth><LeaderBoardPage /></RequireAuth>} />
                  
                  {/* Protected Admin Routes */}
                  <Route path="/admin" element={<RequireAdmin><AdminDashboardPage /></RequireAdmin>} />
                  
                  {/* 404 Fallback */}
                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
              </div>
              <ToastContainer position="bottom-right" theme="dark" />
            </BrowserRouter>
          </SearchProvider>
        </WatchlistProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;