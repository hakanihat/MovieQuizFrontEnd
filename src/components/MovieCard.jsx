// src/components/MovieCard.js
import React, { useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { WatchlistContext } from "../contexts/WatchlistContext";
import "./MovieCard.css";

function MovieCard({ movie, hasQuiz }) { // Added hasQuiz prop
  const navigate = useNavigate();
  const { watchlist, addMovie, removeMovie } = useContext(WatchlistContext);

  const isInWatchlist = watchlist.some(
    (m) => String(m.imdbID) === String(movie.imdbID)
  );

  const handleWatchlistToggle = (e) => {
    e.preventDefault(); 
    e.stopPropagation(); 
    if (isInWatchlist) removeMovie(movie.imdbID);
    else addMovie(movie);
  };

  const handleQuizClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/quiz/${movie.imdbID}`);
  };

  return (
    <Link to={`/movie/${movie.imdbID}`} className="movie-card">
      <div className="poster-wrapper">
        <img 
          src={movie.Poster && movie.Poster !== "N/A" 
            ? movie.Poster 
            : "https://via.placeholder.com/300x450?text=No+Poster"} 
          alt={movie.Title} 
          loading="lazy" 
          className="movie-poster-img"
        />
        
        <div className="gradient-overlay"></div>

        {/* --- MOVED QUIZ BUTTON (Top Left) --- */}
        {hasQuiz && ( // Only show if quiz exists
            <button 
                className="card-quiz-btn" 
                onClick={handleQuizClick}
                title="Take Quiz"
            >
                <span className="material-icons">quiz</span>
            </button>
        )}

        {/* --- WATCHLIST BUTTON (Top Right) --- */}
        <button 
          className={`card-watchlist-btn ${isInWatchlist ? "active" : ""}`} 
          onClick={handleWatchlistToggle}
          title={isInWatchlist ? "Remove from Watchlist" : "Add to Watchlist"}
        >
          <span className="material-icons">
            {isInWatchlist ? "bookmark" : "bookmark_border"}
          </span>
        </button>

        <div className="movie-info">
          <h3 className="movie-title">{movie.Title}</h3>
          <span className="movie-year">{movie.Year || "N/A"}</span>
        </div>
      </div>
    </Link>
  );
}

export default MovieCard;