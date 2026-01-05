// src/components/SearchBar.js
import React, { useState, useEffect, useRef } from "react";

function SearchBar({ onSearchResults }) {
  const [searchTerm, setSearchTerm] = useState("");
  const apiKey = "a976927c";

  // FIX 1: Track if this is the very first render
  const isFirstRender = useRef(true);

  useEffect(() => {
    // FIX 2: If it's the first render, skip everything!
    // This stops it from deleting your default "Star Wars" movies.
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const timer = setTimeout(async () => {
      // If user cleared the text, clear the results
      if (searchTerm.trim() === "") {
        // Optional: You can choose to NOT clear results here if you prefer
        // to keep the default movies visible when search is empty.
        // For now, we only clear if the user actively deleted text.
         onSearchResults(null); 
         return;
      }

      try {
        const response = await fetch(
          `https://www.omdbapi.com/?apikey=${apiKey}&s=${searchTerm}`
        );
        const data = await response.json();
        if (data.Response === "True") {
          onSearchResults(data.Search);
        } else {
          onSearchResults([]);
        }
      } catch (error) {
        console.error("Error fetching movies:", error);
        onSearchResults([]);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm, apiKey, onSearchResults]);

  return (
    <input
      type="text"
      placeholder="Search movies..."
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
     // Inside src/components/SearchBar.js return statement:
      style={{ 
        padding: "0.8rem", 
        fontSize: "1rem", 
        width: "100%", 
        borderRadius: "20px", // Make it rounder to look modern
        border: "none",
        outline: "none",
        background: "#333", // Darker background for input
        color: "#fff",
        // Remove marginBottom so it centers in the header
        margin: 0 
      }}
    />
  );
}

export default SearchBar;