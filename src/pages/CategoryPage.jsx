// src/pages/CategoryPage.js
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MovieCard from '../components/MovieCard';
import LoadingSpinner from '../components/LoadingSpinner';
import './CategoryPage.css';

const CategoryPage = () => {
  const { type } = useParams(); // e.g., 'popular', 'top_rated'
  const navigate = useNavigate();
  
  // --- STATE ---
  const [movies, setMovies] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const apiKey = "fadad4bcd67791ac88cb9e614c380fd2"; // Replace with env variable in production

  // Map friendly URL param to TMDB API endpoint
  const endpointMap = {
    'popular': 'popular',
    'top-rated': 'top_rated',
    'now-playing': 'now_playing',
    'upcoming': 'upcoming'
  };

  const titleMap = {
    'popular': 'Popular Movies',
    'top-rated': 'Top Rated Movies',
    'now-playing': 'Now Playing',
    'upcoming': 'Upcoming Releases'
  };

  // --- 1. INFINITE SCROLL OBSERVER ---
  const observer = useRef();
  
  const lastMovieElementRef = useCallback(node => {
    // If currently fetching, don't trigger again
    if (loading) return;
    
    // Disconnect previous observer
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      // Trigger when the last element is visible AND we have more pages
      if (entries[0].isIntersecting && hasMore) {
        setPage(prevPage => prevPage + 1);
      }
    }, {
      // 🚀 MAGIC SAUCE: Trigger fetch when user is 800px away from bottom
      // This makes scrolling feel "seamless" as data loads before you reach the end.
      rootMargin: "0px 0px 800px 0px" 
    });

    if (node) observer.current.observe(node);
  }, [loading, hasMore]);


  // --- 2. RESET STATE ON CATEGORY CHANGE ---
  useEffect(() => {
    setMovies([]);
    setPage(1);
    setHasMore(true);
  }, [type]);


  // --- 3. FETCH DATA ---
  useEffect(() => {
    const fetchMovies = async () => {
      setLoading(true);
      try {
        const apiType = endpointMap[type] || 'popular';
        
        const response = await fetch(
          `https://api.themoviedb.org/3/movie/${apiType}?api_key=${apiKey}&page=${page}`
        );
        const data = await response.json();
        
        setMovies(prevMovies => {
          const newMovies = data.results || [];
          const combined = [...prevMovies, ...newMovies];
          
          // Deduplicate movies by ID (safety check)
          const unique = Array.from(new Map(combined.map(m => [m.id, m])).values());
          return unique;
        });

        // If current page is equal to or greater than total pages, stop.
        if (data.page >= data.total_pages) {
          setHasMore(false);
        }

      } catch (error) {
        console.error("Failed to fetch category");
      } finally {
        setLoading(false);
      }
    };

    fetchMovies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, page]); 


  // --- RENDER ---
  return (
    <div className="category-page">
      <div className="category-header">
        <button onClick={() => navigate(-1)} className="back-btn">
          <span className="material-icons">arrow_back</span>
        </button>
        <h1>{titleMap[type] || "Movies"}</h1>
      </div>

      <div className="category-grid">
        {movies.map((movie, index) => {
          // Logic: Attach ref to the VERY LAST movie card
          if (movies.length === index + 1) {
            return (
              <div ref={lastMovieElementRef} key={`${movie.id}-${index}`} className="grid-item">
                 <MovieCard movie={{
                   imdbID: movie.id, 
                   Title: movie.title,
                   Poster: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : null,
                   Year: movie.release_date?.substring(0,4) || "N/A"
                 }} />
              </div>
            );
          } else {
            return (
              <div key={`${movie.id}-${index}`} className="grid-item">
                 <MovieCard movie={{
                   imdbID: movie.id, 
                   Title: movie.title,
                   Poster: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : null,
                   Year: movie.release_date?.substring(0,4) || "N/A"
                 }} />
              </div>
            );
          }
        })}
      </div>

      {/* --- LOADERS --- */}
      
      {/* 1. Initial Load: Full Screen Spinner */}
      {loading && page === 1 && (
        <div style={{ marginTop: '50px' }}>
          <LoadingSpinner />
        </div>
      )}

      {/* 2. Seamless Load: Small indicator at bottom (Optional) */}
      {loading && page > 1 && (
        <div style={{ 
          height: '60px', 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          color: '#888'
        }}>
          {/* Subtle text or mini-spinner */}
          <span>Loading more...</span>
        </div>
      )}
      
      {!hasMore && (
        <p style={{ textAlign: 'center', color: '#666', marginTop: '30px', paddingBottom: '30px' }}>
          You've reached the end of the list.
        </p>
      )}
    </div>
  );
};

export default CategoryPage;