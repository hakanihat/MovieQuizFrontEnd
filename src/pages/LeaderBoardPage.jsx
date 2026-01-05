import React, { useEffect, useState, useContext, useRef } from 'react';
import apiClient from '../api/apiService';
import axios from 'axios'; 
import { AuthContext } from '../contexts/AuthContext';
import { Link } from 'react-router-dom'; // Import Link
import './LeaderBoardPage.css';

// ⚠️ REPLACE WITH YOUR REAL KEY
const TMDB_API_KEY = "fadad4bcd67791ac88cb9e614c380fd2"; 

const LeaderBoardPage = () => {
  const { user } = useContext(AuthContext); 

  const [activeTab, setActiveTab] = useState('global');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- Movie Filter State ---
  const [availableMovies, setAvailableMovies] = useState([]); 
  const [searchQuery, setSearchQuery] = useState(''); 
  const [isDropdownOpen, setIsDropdownOpen] = useState(false); 
  
  const [selectedMovie, setSelectedMovie] = useState(null); 
  const searchContainerRef = useRef(null);

  // 1. Initial Load
  useEffect(() => {
    fetchGlobalData();
    fetchMovieList();

    const handleClickOutside = (event) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 2. Fetch Global Data
  const fetchGlobalData = async () => {
    setLoading(true);
    setSelectedMovie(null); 
    try {
      const res = await apiClient.get('/leaderboard/global');
      setData(res.data);
      setActiveTab('global');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // 3. Fetch List of Movies
  const fetchMovieList = async () => {
    try {
      const res = await apiClient.get('/leaderboard/movies');
      setAvailableMovies(res.data); 
    } catch (err) {
      console.error(err);
    }
  };

  // 4. Handle Movie Selection
  const handleSelectMovie = async (movieEntry) => {
    setSearchQuery(movieEntry.movieTitle);
    setIsDropdownOpen(false);
    setLoading(true);
    setActiveTab('movie');

    try {
      const lbRes = await apiClient.get(`/leaderboard/movie/${movieEntry._id}`);
      setData(lbRes.data);

      const tmdbRes = await axios.get(
        `https://api.themoviedb.org/3/movie/${movieEntry._id}?api_key=${TMDB_API_KEY}`
      );
      
      setSelectedMovie({
        title: tmdbRes.data.title,
        backdrop: tmdbRes.data.backdrop_path,
        poster: tmdbRes.data.poster_path,
        tagline: tmdbRes.data.tagline
      });

    } catch (err) {
      console.error("Error fetching movie details:", err);
      setSelectedMovie({
        title: movieEntry.movieTitle,
        backdrop: null,
        poster: null
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredMovies = availableMovies.filter(m => 
    (m.movieTitle || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const currentUsername = user?.username || user?.user?.username || user?.email?.split('@')[0] || "Guest";

  return (
    <div className="leaderboard-page">
      <div className="leaderboard-container animate-fade-in">
        
        {/* --- HEADER TABS --- */}
        <div className="lb-header-row">
          <h1 className="lb-title">Leaderboard</h1>
          <div className="lb-tabs">
            <button 
              className={`lb-tab ${activeTab === 'global' ? 'active' : ''}`}
              onClick={() => {
                setSearchQuery("");
                fetchGlobalData();
              }}
            >
              Global
            </button>
            <button 
              className={`lb-tab ${activeTab === 'movie' ? 'active' : ''}`}
              onClick={() => {
                 setActiveTab('movie');
                 if(!selectedMovie) setSearchQuery("");
              }}
            >
              Movie Specific
            </button>
          </div>
        </div>

        {/* --- SEARCH BAR --- */}
        {activeTab === 'movie' && (
          <div className="movie-search-wrapper" ref={searchContainerRef}>
            <div className="search-input-box">
              <span className="material-icons search-icon">search</span>
              <input 
                type="text"
                placeholder="Search for a movie..."
                value={searchQuery}
                onFocus={() => setIsDropdownOpen(true)}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsDropdownOpen(true);
                }}
                className="lb-search-input-large"
              />
              {isDropdownOpen && filteredMovies.length > 0 && (
                <ul className="autocomplete-dropdown">
                  {filteredMovies.map((m) => (
                    <li key={m._id} onClick={() => handleSelectMovie(m)}>
                      {m.movieTitle}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        {/* --- HERO BANNER --- */}
        {activeTab === 'movie' && selectedMovie && (
          <div 
            className="movie-hero-banner animate-fade-in"
            style={{
              backgroundImage: selectedMovie.backdrop 
                ? `linear-gradient(to right, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.6) 100%), url(https://image.tmdb.org/t/p/w1280${selectedMovie.backdrop})`
                : 'linear-gradient(to right, #222, #111)'
            }}
          >
            <div className="hero-content">
              {selectedMovie.poster && (
                <img 
                  src={`https://image.tmdb.org/t/p/w200${selectedMovie.poster}`} 
                  alt="Poster" 
                  className="hero-poster"
                />
              )}
              <div className="hero-text">
                <h1>{selectedMovie.title}</h1>
                {selectedMovie.tagline && <p className="hero-tagline">"{selectedMovie.tagline}"</p>}
                <div className="hero-stats">
                   <span className="badge">🏆 Top Score: {data.length > 0 ? data[0].score : 0}</span>
                   <span className="badge">👥 Players: {data.length}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- RANKING TABLE --- */}
        <div className="lb-table-wrapper">
          {loading ? (
            <div className="lb-loading">
                <div className="spinner"></div>
                <p>Loading Rankings...</p>
            </div>
          ) : (
            <table className="lb-table">
              <thead>
                <tr>
                  <th className="rank-col">#</th>
                  <th className="user-col">User</th>
                  <th className="score-col">{activeTab === 'global' ? 'Total Score' : 'Score'}</th>
                  
                  {/* These headers will be hidden on mobile via CSS */}
                  <th className="time-col">{activeTab === 'global' ? 'Total Time' : 'Time'}</th>
                  {activeTab === 'global' && <th className="quiz-col">Quizzes</th>}
                </tr>
              </thead>
              <tbody>
                {data.map((entry, index) => {
                  
                  const entryName = (entry.username || "").toString();
                  const myName = (currentUsername || "").toString();
                  const isMe = entryName.trim().toLowerCase() === myName.trim().toLowerCase();

                  // Stats with fallback to 0
                  const displayTime = activeTab === 'global' ? (entry.totalTime || 0) : (entry.timeTaken || 0);
                  const displayQuizzes = entry.quizzesTaken || 0;

                  return (
                    <tr key={index} className={isMe ? "highlight-row" : ""}>
                      
                      {/* 1. RANK */}
                      <td className="rank-col">
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                      </td>
                      
                      {/* 2. USER */}
                      <td className="user-col">
                        <div className="lb-user-info">
                          <span className="material-icons user-icon">account_circle</span>
                          <div className="user-text-stack">
                             {/* --- LINK TO PROFILE (NEW) --- */}
                             <Link 
                                to={`/profile/${entry.userId || entry._id}`} 
                                className="user-name-text"
                                style={{ color: '#fff', textDecoration: 'none', cursor: 'pointer' }}
                                onMouseOver={(e) => e.target.style.textDecoration = 'underline'}
                                onMouseOut={(e) => e.target.style.textDecoration = 'none'}
                             >
                               {entry.username}
                             </Link>
                             
                             {isMe && <span className="me-badge">YOU</span>}
                          </div>
                        </div>
                      </td>
                      
                      {/* 3. SCORE + MOBILE SUBTITLE */}
                      <td className="score-col">
                        <div className="score-stack">
                           <span className="score-val">
                             {activeTab === 'global' ? entry.totalScore : entry.score}
                           </span>
                           
                           {/* NEW: Stats moved here for Mobile */}
                           <span className="mobile-score-subtitle">
                               {activeTab === 'global' 
                                 ? `${displayTime}s • ${displayQuizzes} Q` 
                                 : `${displayTime}s`}
                           </span>
                        </div>
                      </td>
                      
                      {/* 4. TIME (Desktop Only) */}
                      <td className="time-col time-val">
                        {displayTime}s
                      </td>
                      
                      {/* 5. QUIZZES (Desktop Only) */}
                      {activeTab === 'global' && (
                        <td className="quiz-col">{displayQuizzes}</td>
                      )}
                    </tr>
                  );
                })}
                {data.length === 0 && (
                   <tr><td colSpan="5" className="no-data-msg">No rankings found.</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default LeaderBoardPage;