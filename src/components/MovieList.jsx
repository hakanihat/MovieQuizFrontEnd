// src/components/MovieList.js
import React from "react";
import MovieCard from "./MovieCard";
import "./MovieList.css"; // Import the styles

function MovieList({ movies }) {
  // 1. Loading/Null State (Initial Load)
  if (movies === null) return null;

  // 2. No Results State
  if (movies.length === 0) {
    return (
      <div className="no-movies">
        No movies found.
      </div>
    );
  }
  
  // 3. Data State (The Grid)
  return (
    <div className="movie-list-grid">
      {movies.map((movie, index) => (
        <div key={`${movie.imdbID}-${index}`} style={{ minWidth: 0 }}>
          <MovieCard movie={movie} />
        </div>
      ))}
    </div>
  );
}

export default MovieList;