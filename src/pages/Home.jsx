// src/pages/Home.js
import React, { useState, useEffect, useContext } from "react"; 
import { Link, useNavigate } from "react-router-dom"; 
import MovieList from "../components/MovieList";
import MovieCarouselResponsive from "../components/MovieCarouselResponsive";
import LoadingSpinner from "../components/LoadingSpinner";
import { AuthContext } from "../contexts/AuthContext"; 
import { SearchContext } from "../contexts/SearchContext"; 
import "./Home.css";

function Home() {
  const { isAuthenticated } = useContext(AuthContext);
  const { searchQuery } = useContext(SearchContext); 
  const navigate = useNavigate();

  const [movies, setMovies] = useState(null); 
  
  // Category States
  const [topRated, setTopRated] = useState([]);
  const [nowPlaying, setNowPlaying] = useState([]);
  const [popular, setPopular] = useState([]);
  const [upcoming, setUpcoming] = useState([]);
  const [isCategoryLoading, setIsCategoryLoading] = useState(true);
  
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const tmdbApiKey = "fadad4bcd67791ac88cb9e614c380fd2"; 

  // --- 1. Search Logic ---
  useEffect(() => {
    const fetchSearchResults = async () => {
      if (!searchQuery || searchQuery.trim() === "") {
        setMovies(null);
        return;
      }

      try {
        const response = await fetch(
          `https://api.themoviedb.org/3/search/movie?api_key=${tmdbApiKey}&language=en-US&query=${encodeURIComponent(searchQuery)}&page=1&include_adult=false`
        );
        const data = await response.json();
        
        if (data.results) {
          setMovies(mapTmdbMovies(data.results));
        }
      } catch (error) {
        console.error("Search Error:", error);
      }
    };

    const timeoutId = setTimeout(() => {
        fetchSearchResults();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, tmdbApiKey]);


  // --- 2. Scroll Logic ---
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) setShowScrollBtn(true);
      else setShowScrollBtn(false);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  function mapTmdbMovies(tmdbResults) {
    return tmdbResults.map((movie) => ({
      imdbID: String(movie.id),
      Title: movie.title,
      Year: movie.release_date ? movie.release_date.substring(0, 4) : "N/A",
      Poster: movie.poster_path
        ? `https://image.tmdb.org/t/p/w200${movie.poster_path}`
        : "https://dummyimage.com/200x300/2e2e2e/ffffff&text=No+Poster",
    }));
  }

  // --- 3. Fetch Categories ---
  useEffect(() => {
    async function fetchTmdbData() {
      setIsCategoryLoading(true);
      try {
        const [topRatedRes, nowPlayingRes, popularRes, upcomingRes] = await Promise.all([
          fetch(`https://api.themoviedb.org/3/movie/top_rated?api_key=${tmdbApiKey}&language=en-US&page=1`),
          fetch(`https://api.themoviedb.org/3/movie/now_playing?api_key=${tmdbApiKey}&language=en-US&page=1`),
          fetch(`https://api.themoviedb.org/3/movie/popular?api_key=${tmdbApiKey}&language=en-US&page=1`),
          fetch(`https://api.themoviedb.org/3/movie/upcoming?api_key=${tmdbApiKey}&language=en-US&page=1`)
        ]);

        const topRatedData = await topRatedRes.json();
        const nowPlayingData = await nowPlayingRes.json();
        const popularData = await popularRes.json();
        const upcomingData = await upcomingRes.json();

        setTopRated(mapTmdbMovies(topRatedData.results || []));
        setNowPlaying(mapTmdbMovies(nowPlayingData.results || []));
        setPopular(mapTmdbMovies(popularData.results || []));
        setUpcoming(mapTmdbMovies(upcomingData.results || []));

      } catch (error) {
        console.error("Error:", error);
      } finally {
        setTimeout(() => setIsCategoryLoading(false), 1500);
      }
    }
    fetchTmdbData();
  }, [tmdbApiKey]);

  if (isCategoryLoading) return <LoadingSpinner />;

  return (
    <div style={{ paddingBottom: "4rem" }}>
      
      <div style={{ padding: "1rem" }}>
        
        {/* --- SEARCH RESULTS --- */}
        {movies ? (
            <div>
                <h2 style={{color: "#fff", marginBottom: "20px"}}>Search Results:</h2>
                {movies.length > 0 ? (
                    <MovieList movies={movies} />
                ) : (
                    <p style={{color: "#aaa"}}>No movies found matching your criteria.</p>
                )}
            </div>
        ) : (
            /* --- CATEGORIES --- */
            <>
                {/* 1. Top Rated */}
                <div className="category-section">
                <div className="title-wrapper">
                    <Link to="/category/top-rated" className="section-title-link">
                    <h2>Top Rated <span className="material-icons">chevron_right</span></h2>
                    </Link>
                </div>
                <div className="carousel-wrapper">
                    <MovieCarouselResponsive movies={topRated} />
                </div>
                </div>

                {/* 2. Now Playing */}
                <div className="category-section">
                    <div className="title-wrapper">
                    <Link to="/category/now-playing" className="section-title-link">
                    <h2>Now Playing <span className="material-icons">chevron_right</span></h2>
                    </Link>
                    </div>
                <div className="carousel-wrapper">
                    <MovieCarouselResponsive movies={nowPlaying} />
                </div>
                </div>

                {/* 3. Popular */}
                <div className="category-section">
                    <div className="title-wrapper">
                    <Link to="/category/popular" className="section-title-link">
                        <h2>Popular <span className="material-icons">chevron_right</span></h2>
                    </Link>
                    </div>
                <div className="carousel-wrapper">
                    <MovieCarouselResponsive movies={popular} />
                </div>
                </div>

                {/* 4. Upcoming */}
                <div className="category-section">
                    <div className="title-wrapper">
                    <Link to="/category/upcoming" className="section-title-link">
                        <h2>Upcoming <span className="material-icons">chevron_right</span></h2>
                    </Link>
                    </div>
                <div className="carousel-wrapper">
                    <MovieCarouselResponsive movies={upcoming} />
                </div>
                </div>
            </>
        )}

      </div>

      <button 
        className={`scroll-to-top ${showScrollBtn ? "visible" : ""}`} 
        onClick={scrollToTop}
        aria-label="Scroll to top"
      >
        <span className="material-icons">arrow_upward</span>
      </button>

    </div>
  );
}

export default Home;