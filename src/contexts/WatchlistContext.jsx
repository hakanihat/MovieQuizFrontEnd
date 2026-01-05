import React, { createContext, useState, useEffect, useContext } from 'react';
import apiClient from '../api/apiService';
import { AuthContext } from './AuthContext';
import { toast } from 'sonner';

export const WatchlistContext = createContext();

export function WatchlistProvider({ children }) {
  const [watchlist, setWatchlist] = useState([]);
  const { isAuthenticated } = useContext(AuthContext);

  useEffect(() => {
    if (isAuthenticated) {
      fetchWatchlist();
    } else {
      setWatchlist([]);
    }
  }, [isAuthenticated]);

  const fetchWatchlist = async () => {
    try {
      const response = await apiClient.get('/watchlist');
      setWatchlist(response.data);
    } catch (error) {
      console.error("Failed to load watchlist");
    }
  };

  const addMovie = async (movie) => {
    if (!isAuthenticated) {
      toast.error("Please login to add to watchlist");
      return;
    }
    
    if (watchlist.some((m) => String(m.imdbID) === String(movie.imdbID))) {
      toast("Already in your list", {
          description: `"${movie.Title}" is already in your watchlist.`,
      });
      return;
    }

    const optimisticMovie = {
      imdbID: movie.imdbID,
      Title: movie.Title, 
      Poster: movie.Poster, 
      Year: movie.Year 
    };

    setWatchlist((prev) => [...prev, optimisticMovie]);

    toast.custom((t) => (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '15px',
        padding: '12px',
        background: 'rgba(18, 18, 18, 0.95)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(241, 196, 15, 0.3)',
        borderRadius: '12px',
        boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
        minWidth: '300px',
        color: '#fff',
      }}>
        <img 
          src={movie.Poster && movie.Poster !== "N/A" ? movie.Poster : "https://via.placeholder.com/40x60"} 
          alt="poster" 
          style={{ width: '40px', height: '60px', objectFit: 'cover', borderRadius: '6px' }}
        />
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontWeight: 'bold', fontSize: '0.95rem' }}>Added to Watchlist</span>
          <span style={{ fontSize: '0.8rem', color: '#ccc' }}>{movie.Title}</span>
        </div>
        <div style={{ marginLeft: 'auto', color: '#f1c40f' }}>
          <span className="material-icons" style={{ fontSize: '24px' }}>check_circle</span>
        </div>
      </div>
    ), { duration: 3000 });

    try {
      await apiClient.post('/watchlist', optimisticMovie);
    } catch (error) {
      console.error(error);
      toast.error("Failed to save to server");
      setWatchlist((prev) => prev.filter((m) => String(m.imdbID) !== String(movie.imdbID)));
    }
  };

  const removeMovie = async (imdbID) => {
    const previousWatchlist = [...watchlist];

    setWatchlist((prev) => prev.filter((movie) => String(movie.imdbID) !== String(imdbID)));
    
    toast("Removed from Watchlist", {
      icon: '🗑️',
      style: { background: '#1a1a1a', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }
    });

    try {
      // UPDATED: Use URL parameter for the delete request
      await apiClient.delete(`/watchlist/${imdbID}`);
    } catch (error) {
      console.error(error);
      toast.error("Failed to remove movie.");
      setWatchlist(previousWatchlist);
    }
  };

  return (
    <WatchlistContext.Provider value={{ watchlist, addMovie, removeMovie }}>
      {children}
    </WatchlistContext.Provider>
  );
}