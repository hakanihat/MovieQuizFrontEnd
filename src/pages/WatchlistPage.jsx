// src/pages/WatchlistPage.js
import React, { useContext } from "react";
import { WatchlistContext } from "../contexts/WatchlistContext";
import "./WatchlistPage.css";

function WatchlistPage() {
  const { watchlist, removeMovie } = useContext(WatchlistContext);

  if (!watchlist || watchlist.length === 0) {
    return (
      <div className="watchlist-page">
        <h2>Your Watchlist</h2>
        <p>Your watchlist is empty.</p>
      </div>
    );
  }

  return (
    <div className="watchlist-page">
      <h2>Your Watchlist</h2>
      <div className="watchlist-grid">
        {watchlist.map((movie) => (
          <div className="watchlist-card" key={movie.imdbID}>
            <div className="watchlist-card-image">
              <img
                src={
                  movie.Poster !== "N/A"
                    ? movie.Poster
                    : "https://via.placeholder.com/200x300?text=No+Image"
                }
                alt={movie.Title}
              />
            </div>
            <div className="watchlist-card-content">
              <h3>{movie.Title}</h3>
              <p>{movie.Year}</p>
              <button onClick={() => removeMovie(movie.imdbID)}>
                <span className="material-icons">delete</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default WatchlistPage;
