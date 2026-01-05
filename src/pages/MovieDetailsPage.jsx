// src/pages/MovieDetailsPage.js
import React, { useEffect, useState, useContext, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { WatchlistContext } from "../contexts/WatchlistContext";
import LoadingSpinner from "../components/LoadingSpinner";
import { toast } from "sonner";
import "./MovieDetailsPage.css";

const MovieDetailsPage = () => {
  const { imdbID } = useParams();
  const navigate = useNavigate();
  
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [videoKey, setVideoKey] = useState(null);

  // Watchlist Context
  const { watchlist, addMovie, removeMovie } = useContext(WatchlistContext);
  const isInWatchlist = watchlist.some((m) => String(m.imdbID) === String(imdbID));

  const tmdbApiKey = "fadad4bcd67791ac88cb9e614c380fd2"; 

  // --- DRAG-TO-SCROLL LOGIC ---
  const sliderRef = useRef(null);
  const [isDown, setIsDown] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const handleMouseDown = (e) => {
    setIsDown(true);
    setStartX(e.pageX - sliderRef.current.offsetLeft);
    setScrollLeft(sliderRef.current.scrollLeft);
  };
  const handleMouseLeave = () => setIsDown(false);
  const handleMouseUp = () => setIsDown(false);
  const handleMouseMove = (e) => {
    if (!isDown) return;
    e.preventDefault();
    const x = e.pageX - sliderRef.current.offsetLeft;
    const walk = (x - startX) * 2; // Scroll-fastness
    sliderRef.current.scrollLeft = scrollLeft - walk;
  };

  // --- FETCH DATA ---
  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const response = await fetch(
          `https://api.themoviedb.org/3/movie/${imdbID}?api_key=${tmdbApiKey}&append_to_response=credits,videos`
        );
        const data = await response.json();
        setMovie(data);

        // Find Trailer
        const trailer = data.videos?.results.find(
          (vid) => vid.site === "YouTube" && vid.type === "Trailer"
        );
        if (trailer) setVideoKey(trailer.key);

      } catch (error) {
        console.error("Error:", error);
        toast.error("Failed to load details.");
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [imdbID]);

  // --- HANDLERS ---
  const handleWatchlistClick = () => {
    if (isInWatchlist) {
      removeMovie(imdbID);
    } else {
      addMovie({
        imdbID: movie.id,
        Title: movie.title,
        Poster: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : "N/A",
        Year: movie.release_date?.substring(0, 4) || "N/A"
      });
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!movie) return <div className="error-msg">Movie not found.</div>;

  return (
    <div className="movie-details-container">
      
      {/* Floating Back Button */}
      <button onClick={() => navigate(-1)} className="floating-back-btn">
        <span className="material-icons">arrow_back</span>
      </button>

      {/* Hero Backdrop */}
      <div 
        className="movie-hero"
        style={{ backgroundImage: `url(https://image.tmdb.org/t/p/original${movie.backdrop_path})` }}
      >
        <div className="hero-overlay"></div>
      </div>

      {/* Main Content */}
      <div className="movie-content-wrapper">
        
        {/* Left: Poster */}
        <div className="poster-section">
          <img 
            src={movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : "https://via.placeholder.com/300x450"} 
            alt={movie.title} 
            className="detail-poster"
          />
        </div>

        {/* Right: Info */}
        <div className="info-section">
          <h1 className="movie-title">
            {movie.title} <span className="release-year">({movie.release_date?.substring(0,4)})</span>
          </h1>
          
          <div className="movie-meta">
            <span className="rating-badge">⭐ {movie.vote_average?.toFixed(1)}</span>
            <span className="runtime">{movie.runtime} min</span>
            <span className="genres">{movie.genres?.map(g => g.name).join(", ")}</span>
          </div>

          <p className="tagline">{movie.tagline}</p>

          <div className="action-buttons">
            <Link to={`/quiz/${imdbID}`} className="btn-action btn-quiz">
              <span className="material-icons">quiz</span> Take Quiz
            </Link>

            <button className={`btn-action btn-watchlist ${isInWatchlist ? "added" : ""}`} onClick={handleWatchlistClick}>
              <span className="material-icons">{isInWatchlist ? "check" : "bookmark_add"}</span>
              {isInWatchlist ? "Added" : "Watchlist"}
            </button>
            
            {videoKey && (
              <a href={`https://www.youtube.com/watch?v=${videoKey}`} target="_blank" rel="noreferrer" className="btn-action btn-trailer">
                <span className="material-icons">play_circle</span> Trailer
              </a>
            )}
          </div>

          <div className="overview-section">
            <h3>Overview</h3>
            <p>{movie.overview}</p>
          </div>

          {/* --- CAST SECTION (With Drag Support) --- */}
          <div className="cast-section">
            <h3>Top Cast</h3>
            <div 
                className={`cast-list ${isDown ? 'active' : ''}`}
                ref={sliderRef}
                onMouseDown={handleMouseDown}
                onMouseLeave={handleMouseLeave}
                onMouseUp={handleMouseUp}
                onMouseMove={handleMouseMove}
            >
              {/* Increased slice to 20 to allow more scrolling */}
              {movie.credits?.cast?.slice(0, 20).map((actor) => (
                <div key={actor.id} className="cast-card">
                  <div className="cast-img-wrapper">
                      <img 
                        src={actor.profile_path ? `https://image.tmdb.org/t/p/w200${actor.profile_path}` : "https://via.placeholder.com/100"} 
                        alt={actor.name} 
                        draggable="false" // Important for custom drag logic
                      />
                  </div>
                  <p>{actor.name}</p>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default MovieDetailsPage;