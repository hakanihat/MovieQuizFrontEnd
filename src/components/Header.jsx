import React, { useContext, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { SearchContext } from '../contexts/SearchContext';
import './Header.css';

const Header = () => {
  const { isAuthenticated, logout, user } = useContext(AuthContext);
  const { searchQuery, setSearchQuery } = useContext(SearchContext);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); 
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    setIsMobileMenuOpen(false);
    logout();
    navigate('/login');
  };

  const showSearchBar = location.pathname === '/';

  return (
    <header className="app-header">
      
      {/* --- TOP ROW: LOGO + DESKTOP BUTTONS + HAMBURGER --- */}
      <div className="header-main-row">
        
        {/* LOGO */}
        <Link to="/" className="header-logo" onClick={() => setIsMobileMenuOpen(false)}>
          MOVIE APP
        </Link>

        {/* DESKTOP ACTIONS (Hidden on Mobile) */}
        <div className="header-actions desktop-only">
          {isAuthenticated ? (
            <>
              <button className="header-icon-btn" onClick={() => navigate('/leaderboard')} title="Leaderboard">
                <span className="material-icons">leaderboard</span>
              </button>
              <button className="header-profile-btn" onClick={() => navigate('/profile')}>
                <span className="material-icons">person</span>
                {user?.username || 'Profile'}
              </button>
              <button className="header-logout-btn" onClick={handleLogout}>
                Logout
              </button>
            </>
          ) : (
            <div className="auth-buttons">
              <Link to="/login" className="header-login-link">Login</Link>
              <Link to="/register" className="header-register-btn">Register</Link>
            </div>
          )}
        </div>

        {/* MOBILE HAMBURGER (Visible ONLY on Mobile) */}
        <button 
          className="mobile-menu-toggle"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          <span className="material-icons">
            {isMobileMenuOpen ? 'close' : 'menu'}
          </span>
        </button>
      </div>

      {/* --- SEARCH BAR ROW --- */}
      {showSearchBar && (
        <div className="header-search-container">
          <div className="search-input-wrapper">
             <span className="material-icons search-icon">search</span>
             <input
              type="text"
              className="header-search"
              placeholder="Search movies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      )}

      {/* --- MOBILE DROPDOWN MENU --- */}
      {/* Absolute positioned so it pushes nothing down */}
      <div className={`mobile-menu-overlay ${isMobileMenuOpen ? 'open' : ''}`}>
        <div className="mobile-menu-content">
          {isAuthenticated ? (
            <>
              <div className="mobile-user-info">
                Hello, <strong>{user?.username || 'User'}</strong>
              </div>
              <button onClick={() => { navigate('/profile'); setIsMobileMenuOpen(false); }} className="mobile-nav-item">
                <span className="material-icons">person</span> Profile
              </button>
              <button onClick={() => { navigate('/leaderboard'); setIsMobileMenuOpen(false); }} className="mobile-nav-item">
                <span className="material-icons">leaderboard</span> Leaderboard
              </button>
              <div className="mobile-divider"></div>
              <button onClick={handleLogout} className="mobile-nav-item logout">
                <span className="material-icons">logout</span> Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="mobile-nav-item" onClick={() => setIsMobileMenuOpen(false)}>Login</Link>
              <Link to="/register" className="mobile-nav-item highlight" onClick={() => setIsMobileMenuOpen(false)}>Register</Link>
            </>
          )}
        </div>
      </div>

    </header>
  );
};

export default Header;