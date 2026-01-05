// src/components/MovieCarouselResponsive.js
import React, { useRef, useState } from "react";
import MovieCard from "./MovieCard";
import "./MovieCarouselResponsive.css";

const MovieCarouselResponsive = ({ movies }) => {
  const carouselRef = useRef(null);
  
  // --- DRAG STATE ---
  const [isDown, setIsDown] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [isDragging, setIsDragging] = useState(false); 

  // --- BUTTON SCROLL HANDLERS ---
  const scrollLeftBtn = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: -300, behavior: "smooth" });
    }
  };

  const scrollRightBtn = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: 300, behavior: "smooth" });
    }
  };

  // --- MOUSE DRAG HANDLERS ---
  const handleMouseDown = (e) => {
    e.preventDefault(); // CRITICAL: Stops browser from trying to drag the image itself
    setIsDown(true);
    setIsDragging(false);
    setStartX(e.pageX - carouselRef.current.offsetLeft);
    setScrollLeft(carouselRef.current.scrollLeft);
  };

  const handleMouseLeave = () => {
    setIsDown(false);
  };

  const handleMouseUp = () => {
    setIsDown(false);
    // Short delay to reset drag state so links work again
    setTimeout(() => setIsDragging(false), 50); 
  };

  const handleMouseMove = (e) => {
    if (!isDown) return;
    e.preventDefault();
    setIsDragging(true); // We are definitely dragging now
    const x = e.pageX - carouselRef.current.offsetLeft;
    const walk = (x - startX) * 2; // Scroll speed multiplier
    carouselRef.current.scrollLeft = scrollLeft - walk;
  };

  return (
    <div className="carousel-container">
      {/* Left Button */}
      <button 
        className="carousel-btn left-btn" 
        onClick={scrollLeftBtn}
        aria-label="Scroll Left"
      >
        <span className="material-icons">chevron_left</span>
      </button>
      
      {/* Track */}
      <div 
        className={`carousel-track ${isDown ? 'active' : ''} ${isDragging ? 'dragging' : ''}`}
        ref={carouselRef}
        onMouseDown={handleMouseDown}
        onMouseLeave={handleMouseLeave}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
      >
        {movies.map((movie) => (
          <div key={movie.imdbID} className="carousel-item">
             {/* Disable pointer events on the card while dragging to prevent accidental clicks */}
             <div style={{ pointerEvents: isDragging ? 'none' : 'auto' }}>
                <MovieCard movie={movie} hasQuiz={movie.hasQuiz} />
             </div>
          </div>
        ))}
      </div>

      {/* Right Button */}
      <button 
        className="carousel-btn right-btn" 
        onClick={scrollRightBtn}
        aria-label="Scroll Right"
      >
        <span className="material-icons">chevron_right</span>
      </button>
    </div>
  );
};

export default MovieCarouselResponsive;