// ================================================================
// HOME PAGE — The Main Dashboard of the Application
// ================================================================
// This is the LARGEST and most feature-rich page in the app (800+ lines).
//
// WHAT IT DOES:
//   - Displays a hero banner carousel at the top
//   - Shows content tabs (Home / Movies / Series / About)
//   - Search bar with autocomplete suggestions
//   - Filter system (genre dropdown, Oscar winners toggle)
//   - Sort system (by rating, release year, ascending/descending)
//   - "Top Rated Movies" and "Top Rated Series" ranked lists
//   - "For You" (random picks) and "Trending Now" scroll rows
//   - Main movie grid showing all movies
//
// REACT CONCEPTS USED:
//   useState   → Store data that changes (movies, filters, etc.)
//   useEffect  → Run code when something changes (fetch data on load)
//   useRef     → Reference DOM elements (scroll containers, search input)
//   useCallback → Memoize functions to prevent unnecessary re-creates
//   useNavigate → Programmatically go to another page
//
// SUB-COMPONENTS (defined at bottom of file):
//   TopRatedRow  → A single row in the Top Rated section
//   ScrollCard   → A card in the horizontal scroll rows
// ================================================================
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { getAllMoviesWithRatings, filterByGenre, filterByOscar, searchMovies, getAllGenres, getSearchSuggestions } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { searchMoviePoster } from '../services/tmdb';
import HeroBanner from '../components/HeroBanner';
import MovieCard from '../components/MovieCard';
import '../styles/Home.css';

function Home() {
  // ── STATE MANAGEMENT ──
  // Each useState creates a piece of reactive data.
  // When state changes, React automatically re-renders the component.
  
  const [movies, setMovies] = useState([]);          // All movies currently displayed
  const [genres, setGenres] = useState([]);           // Available genres for filter dropdown
  const [selectedGenre, setSelectedGenre] = useState('');  // Currently selected genre filter
  const [searchQuery, setSearchQuery] = useState('');      // Current search input text
  const [showOscarOnly, setShowOscarOnly] = useState(false); // Oscar filter toggle
  const [sortBy, setSortBy] = useState('default');         // Sort field: 'default', 'rating', 'year'
  const [sortDirection, setSortDirection] = useState('desc'); // Sort order: 'desc' or 'asc'
  const [showSortMenu, setShowSortMenu] = useState(false);   // Sort dropdown visibility
  const sortRef = useRef(null);    // Reference to sort dropdown (for click-outside detection)
  const [loading, setLoading] = useState(true);   // Show loading spinner
  
  // Search autocomplete state
  const [suggestions, setSuggestions] = useState([]);        // Search autocomplete results
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef(null);   // Reference to search box (for click-outside)
  const debounceTimer = useRef(null); // Timer for debouncing search input
  const navigate = useNavigate();    // React Router's navigation function

  // Top rated sections data
  const [topMovies, setTopMovies] = useState([]);    // Top 5 rated movies
  const [topSeries, setTopSeries] = useState([]);    // Top 5 rated series

  // Content type filter: 'all', 'movie', or 'series'
  const [contentFilter, setContentFilter] = useState('all');
  const [showAbout, setShowAbout] = useState(false);  // Show About page instead of content
  
  // Horizontal scroll section data
  const [trendingMovies, setTrendingMovies] = useState([]); // Top 15 for trending section
  const [forYouMovies, setForYouMovies] = useState([]);     // Random picks for "For You"
  const forYouScrollRef = useRef(null);      // Scroll container ref for "For You"
  const trendingScrollRef = useRef(null);    // Scroll container ref for "Trending"

  // ── EFFECT: Runs when contentFilter changes (Home/Movies/Series tabs) ──
  // Resets ALL filters and reloads movies for the selected content type.
  // The dependency array [contentFilter] means this runs ONLY when
  // contentFilter changes, not on every render.
  useEffect(() => {
    const type = contentFilter === 'all' ? undefined : contentFilter;
    // Reset all filters when switching tabs
    setSelectedGenre('');
    setShowOscarOnly(false);
    setSearchQuery('');
    setSortBy('default');
    setSortDirection('desc');
    loadGenres();
    loadMovies(type);
  }, [contentFilter]);

  // ── EFFECT: Derive top-rated and trending from the main movies list ──
  // Instead of making separate API calls for Top Rated and Trending,
  // we sort/filter the movies we already have. This is more efficient!
  useEffect(() => {
    if (movies.length === 0) return;
    const rated = [...movies].sort((a, b) => 
      (parseFloat(b.average_rating) || 0) - (parseFloat(a.average_rating) || 0)
    );
    const moviesOnly = rated.filter(m => m.content_type === 'movie');
    const seriesOnly = rated.filter(m => m.content_type === 'series');

    if (contentFilter === 'all' || contentFilter === 'movie') {
      setTopMovies(moviesOnly.slice(0, 5));
    } else {
      setTopMovies([]);
    }
    if (contentFilter === 'all' || contentFilter === 'series') {
      setTopSeries(seriesOnly.slice(0, 5));
    } else {
      setTopSeries([]);
    }
    setTrendingMovies(rated.slice(0, 15));
  }, [movies, contentFilter]);

  // Helper: convert 'all' to undefined for API calls
  const getContentType = () => contentFilter === 'all' ? undefined : contentFilter;

  // Helper: scroll a horizontal row left or right by 400px
  const scrollRow = (ref, direction) => {
    if (ref.current) {
      ref.current.scrollBy({ left: direction === 'left' ? -400 : 400, behavior: 'smooth' });
    }
  };

  // ── EFFECT: Close search suggestions when clicking outside ──
  // This uses a DOM event listener to detect clicks outside the search box.
  // The cleanup function (return () => ...) removes the listener when
  // the component unmounts, preventing memory leaks.
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ── DEBOUNCED SEARCH SUGGESTIONS ──
  // Debouncing means: "wait 300ms after the user STOPS typing before fetching."
  // Without debouncing, we'd fire an API call for every keystroke:
  //   "b" → API call, "ba" → API call, "bat" → API call, "batm" → ...
  // With debouncing (300ms), we only call the API once ("batman").
  //
  // useCallback prevents this function from being recreated on every render.
  const fetchSuggestions = useCallback((query, type) => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);  // Cancel previous timer
    if (query.trim().length < 2) {
      setSuggestions([]);       // Don't search for 1-char queries
      setShowSuggestions(false);
      return;
    }
    // Set a new timer — the API call only fires after 300ms of silence
    debounceTimer.current = setTimeout(async () => {
      try {
        const response = await getSearchSuggestions(query, type);
        setSuggestions(response.data);
        setShowSuggestions(response.data.length > 0);
      } catch (error) {
        console.error('Error fetching suggestions:', error);
      }
    }, 300);
  }, []);

  // Handle typing in the search bar
  const handleSearchInputChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    // Fetch suggestions as user types (with debouncing)
    fetchSuggestions(value, contentFilter === 'all' ? undefined : contentFilter);
  };

  // Navigate to movie details when a suggestion is clicked
  const handleSuggestionClick = (movieId) => {
    setShowSuggestions(false);
    setSearchQuery('');
    navigate(`/movie/${movieId}`);
  };

  // ── EFFECT: Re-sort movies when sort criteria changes ──
  useEffect(() => {
    if (movies.length > 0) {
      applySorting();
    }
  }, [sortBy, sortDirection]);

  // ── EFFECT: Close sort dropdown when clicking outside ──
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (sortRef.current && !sortRef.current.contains(e.target)) {
        setShowSortMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ── DATA LOADING FUNCTIONS ──
  
  // Fetch all available genres for the filter dropdown
  const loadGenres = async () => {
    try {
      const response = await getAllGenres();
      setGenres(response.data);
    } catch (error) {
      console.error('Error loading genres:', error);
    }
  };

  // Fetch all movies with their ratings (main data source for the grid)
  const loadMovies = async (type) => {
    try {
      setLoading(true);
      const response = await getAllMoviesWithRatings(type);
      setMovies(response.data);
      // Generate "For You" section: shuffle all movies randomly and take 12
      // Math.random() - 0.5 produces values between -0.5 and 0.5,
      // which randomizes the sort order
      const shuffled = [...response.data].sort(() => Math.random() - 0.5);
      setForYouMovies(shuffled.slice(0, 12));
      setLoading(false);
    } catch (error) {
      console.error('Error loading movies:', error);
      setLoading(false);
    }
  };

  // ── SORTING LOGIC ──
  
  // Available sort options
  const sortOptions = [
    { key: 'rating', label: 'Rating', icon: 'star' },
    { key: 'year', label: 'Release Year', icon: 'calendar' },
  ];

  const getSortLabel = () => {
    if (sortBy === 'default') return 'Sort';
    const opt = sortOptions.find(o => o.key === sortBy);
    return opt ? opt.label : 'Sort';
  };

  const handleSortSelect = (key) => {
    if (sortBy === key) {
      setSortDirection(prev => prev === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(key);
      setSortDirection('desc');
    }
    setShowSortMenu(false);
  };

  const toggleSortDirection = () => {
    if (sortBy !== 'default') {
      setSortDirection(prev => prev === 'desc' ? 'asc' : 'desc');
    }
  };

  // Apply sorting to the movies array (in-place via setState)
  // Uses the spread operator [...movies] to create a copy before sorting
  // (never mutate state directly in React!)
  const applySorting = () => {
    const sortedMovies = [...movies];
    const dir = sortDirection === 'desc' ? -1 : 1;
    switch (sortBy) {
      case 'rating':
        sortedMovies.sort((a, b) => {
          const ratingA = parseFloat(a.average_rating) || 0;
          const ratingB = parseFloat(b.average_rating) || 0;
          return (ratingB - ratingA) * dir;
        });
        break;
      case 'year':
        sortedMovies.sort((a, b) => (b.release_year - a.release_year) * dir);
        break;
      default:
        break;
    }
    setMovies(sortedMovies);
  };

  // ── FILTER HANDLERS ──
  
  // Handle genre filter selection from dropdown
  const handleGenreFilter = async (genre) => {
    setSelectedGenre(genre);
    setShowOscarOnly(false);
    setSearchQuery('');
    if (genre === '') {
      loadMovies(getContentType());
    } else {
      try {
        setLoading(true);
        const response = await filterByGenre(genre, getContentType());
        setMovies(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error filtering by genre:', error);
        setLoading(false);
      }
    }
  };

  // Handle Oscar winners filter toggle
  const handleOscarFilter = async () => {
    setShowOscarOnly(!showOscarOnly);
    setSelectedGenre('');
    setSearchQuery('');
    if (!showOscarOnly) {
      try {
        setLoading(true);
        const response = await filterByOscar(getContentType());
        setMovies(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error filtering Oscar movies:', error);
        setLoading(false);
      }
    } else {
      loadMovies(getContentType());
    }
  };

  // Handle search form submission
  const handleSearch = async (e) => {
    e.preventDefault();
    setSelectedGenre('');
    setShowOscarOnly(false);
    setShowSuggestions(false);
    setSuggestions([]);
    if (searchQuery.trim() === '') {
      loadMovies(getContentType());
    } else {
      try {
        setLoading(true);
        const response = await searchMovies(searchQuery, getContentType());
        setMovies(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error searching movies:', error);
        setLoading(false);
      }
    }
  };

  return (
    <div className="home">
      {/* ── HERO BANNER ── */}
      <HeroBanner />

      {/* ── CONTENT TABS ── */}
      <nav className="home-nav">
        <button className={`home-nav-tab ${!showAbout && contentFilter === 'all' ? 'active' : ''}`} onClick={() => { setShowAbout(false); setContentFilter('all'); }}>Home</button>
        <button className={`home-nav-tab ${!showAbout && contentFilter === 'movie' ? 'active' : ''}`} onClick={() => { setShowAbout(false); setContentFilter('movie'); }}>Movies</button>
        <button className={`home-nav-tab ${!showAbout && contentFilter === 'series' ? 'active' : ''}`} onClick={() => { setShowAbout(false); setContentFilter('series'); }}>Series</button>
        <button className={`home-nav-tab ${showAbout ? 'active' : ''}`} onClick={() => setShowAbout(true)}>About</button>
      </nav>

      {showAbout ? (
        <div className="about-section">
          <div className="about-header">
            <div className="about-logo">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#667eea" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/></svg>
            </div>
            <h1 className="about-title">MovieDBX</h1>
            <p className="about-tagline">Your Ultimate Movie & Series Discovery Platform</p>
          </div>

          <div className="about-description">
            <p>MovieDBX is a full-stack movie and series database application designed to help you discover, explore, and manage your favorite entertainment. Built with modern web technologies, it offers a seamless and visually stunning experience for movie enthusiasts.</p>
          </div>

          <div className="about-features">
            <h2 className="about-features-title">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              Features
            </h2>
            <div className="about-features-grid">
              <div className="about-feature-card">
                <div className="about-feature-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#667eea" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                </div>
                <h3>Smart Search</h3>
                <p>Search across movies and series with real-time autocomplete suggestions, poster previews, and instant results.</p>
              </div>
              <div className="about-feature-card">
                <div className="about-feature-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#667eea" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
                </div>
                <h3>Personal Watchlist</h3>
                <p>Save movies and series to your personal watchlist and keep track of what you want to watch next.</p>
              </div>
              <div className="about-feature-card">
                <div className="about-feature-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#667eea" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                </div>
                <h3>Ratings & Reviews</h3>
                <p>Rate and review movies and series. See community ratings and read what others think before you watch.</p>
              </div>
              <div className="about-feature-card">
                <div className="about-feature-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#667eea" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                </div>
                <h3>Trailers</h3>
                <p>Watch official YouTube trailers directly on the movie details page without leaving the app.</p>
              </div>
              <div className="about-feature-card">
                <div className="about-feature-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#e50914" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="2" ry="2"/><path d="M7 2v20M17 2v20M2 12h20"/></svg>
                </div>
                <h3>Watch on Netflix</h3>
                <p>Direct links to Netflix for every movie and series so you can start watching instantly.</p>
              </div>
              <div className="about-feature-card">
                <div className="about-feature-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#667eea" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20V10"/><path d="M18 20V4"/><path d="M6 20v-4"/></svg>
                </div>
                <h3>Advanced Filters & Sorting</h3>
                <p>Filter by genre, Oscar winners, content type (Movies/Series), and sort by rating or release year.</p>
              </div>
              <div className="about-feature-card">
                <div className="about-feature-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#667eea" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>
                </div>
                <h3>Oscar Winners</h3>
                <p>Quickly identify Academy Award-winning films with the Oscar badge and dedicated filter.</p>
              </div>
              <div className="about-feature-card">
                <div className="about-feature-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#667eea" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                </div>
                <h3>Hero Banner & Curated Sections</h3>
                <p>Animated hero carousel, "For You" recommendations, "Trending Now" picks, and top-rated rankings.</p>
              </div>
              <div className="about-feature-card">
                <div className="about-feature-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#667eea" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                </div>
                <h3>User Authentication</h3>
                <p>Register and login to unlock personalized features like watchlists, reviews, and ratings.</p>
              </div>
            </div>
          </div>

          <div className="about-tech">
            <h2 className="about-tech-title">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
              Tech Stack
            </h2>
            <div className="about-tech-chips">
              <span className="about-tech-chip">React 19</span>
              <span className="about-tech-chip">Express.js</span>
              <span className="about-tech-chip">PostgreSQL</span>
              <span className="about-tech-chip">Node.js</span>
              <span className="about-tech-chip">TMDB API</span>
              <span className="about-tech-chip">Axios</span>
              <span className="about-tech-chip">Framer Motion</span>
              <span className="about-tech-chip">React Router</span>
            </div>
          </div>

          <div className="about-credits">
            <div className="about-credits-card">
              <div className="about-credits-avatar">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#667eea" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              </div>
              <div className="about-credits-info">
                <h3>Designed & Developed by</h3>
                <p className="about-credits-name">AL ARAFAT ALIF</p>
                <p className="about-credits-id">2305062 &nbsp;|&nbsp; L-1 &nbsp;|&nbsp; T-2</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
      <>
      {/* ── SEARCH BAR ── */}
      <div className="search-bar-top">
        <div className="search-wrapper" ref={searchRef}>
          <form onSubmit={handleSearch} className="search-form">
            <div className="search-input-wrap">
              <span className="search-icon">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              </span>
              <input
                type="text"
                placeholder="Search movies, series, actors..."
                value={searchQuery}
                onChange={handleSearchInputChange}
                onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                className="search-input"
                autoComplete="off"
              />
            </div>
            <button type="submit" className="search-btn">Search</button>
          </form>

          {showSuggestions && (
            <div className="search-suggestions">
              {suggestions.map((movie) => (
                <div
                  key={movie.movie_id}
                  className="suggestion-item"
                  onClick={() => handleSuggestionClick(movie.movie_id)}
                >
                  <div className="suggestion-poster">
                    {movie.poster_url ? (
                      <img src={movie.poster_url} alt={movie.title} />
                    ) : (
                      <div className="suggestion-poster-placeholder">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/></svg>
                      </div>
                    )}
                  </div>
                  <div className="suggestion-info">
                    <span className="suggestion-title">{movie.title}</span>
                    <span className="suggestion-meta">
                      {movie.release_year}
                      {movie.genres && movie.genres.filter(Boolean).length > 0 && (
                        <> · {movie.genres.filter(Boolean).slice(0, 2).join(', ')}</>
                      )}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── FILTERS ── */}
      <div className="filters">
        <div className="toolbar">
          <div className="toolbar-left">
            <button
              className={showOscarOnly ? 'toolbar-chip active' : 'toolbar-chip'}
              onClick={handleOscarFilter}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>
              Oscar Winners
            </button>
            <div className="toolbar-divider" />
            <select
              value={selectedGenre}
              onChange={(e) => handleGenreFilter(e.target.value)}
              className="genre-select"
            >
              <option value="">All Genres</option>
              {genres.map(genre => (
                <option key={genre.genre_id} value={genre.genre_name}>
                  {genre.genre_name}
                </option>
              ))}
            </select>
          </div>

          <div className="toolbar-right">
            <div className="sort-control" ref={sortRef}>
              <button
                className={`sort-trigger ${sortBy !== 'default' ? 'active' : ''}`}
                onClick={() => setShowSortMenu(!showSortMenu)}
              >
                <span className="sort-trigger-icon">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 15l5 5 5-5"/><path d="M7 9l5-5 5 5"/></svg>
                </span>
                <span className="sort-trigger-label">Sort by: </span>
                <span className="sort-trigger-value">{getSortLabel()}</span>
                <span className={`sort-arrow ${showSortMenu ? 'open' : ''}`}>▾</span>
              </button>

              {sortBy !== 'default' && (
                <button
                  className="sort-direction-btn"
                  onClick={toggleSortDirection}
                  title={sortDirection === 'desc' ? 'Descending' : 'Ascending'}
                >
                  {sortDirection === 'desc' ? '↓' : '↑'}
                </button>
              )}

              {showSortMenu && (
                <div className="sort-menu">
                  <div className="sort-menu-header">Sort results by</div>
                  {sortOptions.map(opt => (
                    <button
                      key={opt.key}
                      className={`sort-menu-item ${sortBy === opt.key ? 'active' : ''}`}
                      onClick={() => handleSortSelect(opt.key)}
                    >
                      <span className="sort-menu-icon">
                        {opt.icon === 'star' ? (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                        ) : (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                        )}
                      </span>
                      <span className="sort-menu-label">{opt.label}</span>
                      {sortBy === opt.key && <span className="sort-menu-check">✓</span>}
                    </button>
                  ))}
                  {sortBy !== 'default' && (
                    <>
                      <div className="sort-menu-divider" />
                      <button
                        className="sort-menu-item sort-menu-clear"
                        onClick={() => { setSortBy('default'); setShowSortMenu(false); }}
                      >
                        <span className="sort-menu-icon">✕</span>
                        <span className="sort-menu-label">Clear Sort</span>
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

            <button onClick={() => {
              setSelectedGenre('');
              setShowOscarOnly(false);
              setSearchQuery('');
              setSortBy('default');
              setSortDirection('desc');
              loadMovies(getContentType());
            }} className="clear-all-btn">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              Clear All
            </button>
          </div>
        </div>

        {(selectedGenre || showOscarOnly || searchQuery || sortBy !== 'default') && (
          <div className="active-filters">
            {selectedGenre && (
              <span className="active-filter">
                Genre: {selectedGenre}
                <button onClick={() => handleGenreFilter('')}>✕</button>
              </span>
            )}
            {showOscarOnly && (
              <span className="active-filter">
                Oscar Winners
                <button onClick={handleOscarFilter}>×</button>
              </span>
            )}
            {searchQuery && (
              <span className="active-filter">
                Search: "{searchQuery}"
                <button onClick={() => { setSearchQuery(''); loadMovies(getContentType()); }}>✕</button>
              </span>
            )}
            {sortBy !== 'default' && (
              <span className="active-filter">
                Sorted: {getSortLabel()} {sortDirection === 'desc' ? '↓' : '↑'}
                <button onClick={() => setSortBy('default')}>✕</button>
              </span>
            )}
          </div>
        )}

        {!loading && (
          <div className="results-bar">
            <span className="results-count">{movies.length} Title{movies.length !== 1 ? 's' : ''}</span>
          </div>
        )}
      </div>

      {/* ── TOP RATED SECTIONS (side by side) ── */}
      <div className={`top-sections ${contentFilter !== 'all' ? 'single' : ''}`}>
        {/* ── Top Rated Movies ── */}
        {(contentFilter === 'all' || contentFilter === 'movie') && topMovies.length > 0 && (
          <div className="top-section">
            <div className="top-section-header">
              <h2 className="top-section-title">Top Rated Movies</h2>
              <div className="top-section-line" />
            </div>
            <div className="top-section-card">
              <div className="top-section-subheader">Based on user ratings</div>
              {topMovies.map((movie, i) => (
                <TopRatedRow key={movie.movie_id} movie={movie} rank={i + 1} />
              ))}
            </div>
          </div>
        )}

        {/* ── Top Rated Series ── */}
        {(contentFilter === 'all' || contentFilter === 'series') && topSeries.length > 0 && (
          <div className="top-section">
            <div className="top-section-header">
              <h2 className="top-section-title">Top Rated Series</h2>
              <div className="top-section-line" />
            </div>
            <div className="top-section-card">
              <div className="top-section-subheader">Based on user ratings</div>
              {topSeries.map((movie, i) => (
                <TopRatedRow key={movie.movie_id} movie={movie} rank={i + 1} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── FOR YOU ── */}
      {forYouMovies.length > 0 && (
        <div className="scroll-section">
          <div className="scroll-section-header">
            <h2 className="scroll-section-title">For You</h2>
            <div className="scroll-section-line" />
            <div className="scroll-arrows">
              <button onClick={() => scrollRow(forYouScrollRef, 'left')} className="scroll-arrow-btn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
              </button>
              <button onClick={() => scrollRow(forYouScrollRef, 'right')} className="scroll-arrow-btn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
            </div>
          </div>
          <div className="scroll-row" ref={forYouScrollRef}>
            {forYouMovies.map(movie => (
              <ScrollCard key={movie.movie_id} movie={movie} />
            ))}
          </div>
        </div>
      )}

      {/* ── TRENDING NOW ── */}
      {trendingMovies.length > 0 && (
        <div className="scroll-section">
          <div className="scroll-section-header">
            <h2 className="scroll-section-title">Trending Now</h2>
            <div className="scroll-section-line" />
            <div className="scroll-arrows">
              <button onClick={() => scrollRow(trendingScrollRef, 'left')} className="scroll-arrow-btn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
              </button>
              <button onClick={() => scrollRow(trendingScrollRef, 'right')} className="scroll-arrow-btn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
            </div>
          </div>
          <div className="scroll-row" ref={trendingScrollRef}>
            {trendingMovies.map(movie => (
              <ScrollCard key={movie.movie_id} movie={movie} />
            ))}
          </div>
        </div>
      )}

      {/* ── ALL MOVIES GRID ── */}
      {loading ? (
        <div className="loading">Loading movies...</div>
      ) : (
        <div className="movies-grid">
          {movies.length === 0 ? (
            <p className="no-movies">No movies found</p>
          ) : (
            movies.map(movie => (
              <MovieCard key={movie.movie_id} movie={movie} />
            ))
          )}
        </div>
      )}
      </>
      )}
    </div>
  );
}

/* ── Top Rated Row Component ─────────────────────────────────
   A single row in the "Top Rated Movies/Series" ranked list.
   Shows rank number, poster, title, year, duration, and rating.
   
   POSTER FALLBACK LOGIC:
     1. Use poster_url from our database (if available)
     2. If not, fetch from TMDB API (with caching)
     3. If TMDB fails, show a placeholder icon
────────────────────────────────────────────────────────────── */
function TopRatedRow({ movie, rank }) {
  const navigate = useNavigate();
  const [posterSrc, setPosterSrc] = useState(movie.poster_url || null);
  const [posterLoaded, setPosterLoaded] = useState(false);
  const [fetchedFromTMDB, setFetchedFromTMDB] = useState(false);

  useEffect(() => {
    if (!movie.poster_url && !fetchedFromTMDB) {
      setFetchedFromTMDB(true);
      searchMoviePoster(movie.title, movie.release_year).then(url => {
        if (url) setPosterSrc(url);
      });
    }
  }, [movie, fetchedFromTMDB]);

  const rating = parseFloat(movie.average_rating || 0).toFixed(1);
  const reviewCount = parseInt(movie.review_count || 0);

  const formatDuration = (mins) => {
    if (!mins) return '';
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}h ${m}m`;
  };

  return (
    <div className="top-row" onClick={() => navigate(`/movie/${movie.movie_id}`)}>
      <span className="top-row-rank">{rank}.</span>
      <div className="top-row-poster">
        {posterSrc ? (
          <img
            src={posterSrc}
            alt={movie.title}
            className={`top-row-poster-img ${posterLoaded ? 'loaded' : ''}`}
            onLoad={() => setPosterLoaded(true)}
            onError={() => setPosterSrc(null)}
          />
        ) : (
          <div className="top-row-poster-ph">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#484f58" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/></svg>
          </div>
        )}
      </div>
      <div className="top-row-info">
        <span className="top-row-title">{movie.title}</span>
        <span className="top-row-meta">
          {movie.release_year || 'N/A'}
          {movie.duration ? ` · ${formatDuration(movie.duration)}` : ''}
        </span>
      </div>
      <div className="top-row-scores">
        {reviewCount > 0 ? (
          <span className="top-row-star">{rating}</span>
        ) : (
          <span className="top-row-no-rating">—</span>
        )}
      </div>
    </div>
  );
}

/* ── Scroll Card Component ───────────────────────────────────
   A card used in the horizontal "For You" and "Trending Now"
   scroll rows. Shows poster, Oscar badge, rating, title, year.
   
   Same poster fallback pattern as TopRatedRow:
     Database poster → TMDB fallback → Placeholder icon
────────────────────────────────────────────────────────────── */
function ScrollCard({ movie }) {
  const navigate = useNavigate();
  const [posterSrc, setPosterSrc] = useState(movie.poster_url || null);
  const [posterLoaded, setPosterLoaded] = useState(false);
  const [fetchedFromTMDB, setFetchedFromTMDB] = useState(false);

  useEffect(() => {
    if (!movie.poster_url && !fetchedFromTMDB) {
      setFetchedFromTMDB(true);
      searchMoviePoster(movie.title, movie.release_year).then(url => {
        if (url) setPosterSrc(url);
      });
    }
  }, [movie, fetchedFromTMDB]);

  const rating = parseFloat(movie.average_rating || 0).toFixed(1);
  const reviewCount = parseInt(movie.review_count || 0);

  return (
    <div className="scroll-card" onClick={() => navigate(`/movie/${movie.movie_id}`)}>
      <div className="scroll-card-poster">
        {posterSrc ? (
          <img
            src={posterSrc}
            alt={movie.title}
            className={`scroll-card-img ${posterLoaded ? 'loaded' : ''}`}
            onLoad={() => setPosterLoaded(true)}
            onError={() => setPosterSrc(null)}
          />
        ) : (
          <div className="scroll-card-placeholder">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#484f58" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/></svg>
          </div>
        )}
        {movie.has_oscar && (
          <span className="scroll-card-oscar">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="#f5c518" stroke="none"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
          </span>
        )}
        {reviewCount > 0 && (
          <span className="scroll-card-rating">{rating}</span>
        )}
      </div>
      <span className="scroll-card-title">{movie.title}</span>
      <span className="scroll-card-year">{movie.release_year || ''}</span>
    </div>
  );
}

export default Home;