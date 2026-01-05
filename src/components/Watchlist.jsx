import React, { useContext } from "react";
import { WatchlistContext } from "../contexts/WatchlistContext";

function Watchlist() {
  const { watchlist, removeMovie } = useContext(WatchlistContext);

  if (!watchlist || watchlist.length === 0) {
    return <div>Your watchlist is empty.</div>;
  }

  return (
    <div>
      <h2>Your Watchlist</h2>
      <ul>
        {watchlist.map((movie) => (
          <li key={movie.imdbID}>
            {movie.Title} ({movie.Year})
            <button onClick={() => removeMovie(movie.imdbID)}>Remove</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Watchlist;
