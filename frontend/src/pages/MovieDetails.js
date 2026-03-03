// ================================================================
// MOVIE DETAILS PAGE — Full Information About a Single Movie
// ================================================================
// This page shows EVERYTHING about a movie/series:
//   - Movie info (title, description, poster, year, duration)
//   - Average rating and review count
//   - Genres, Oscar badge, Netflix link
//   - YouTube trailer (embedded)
//   - Season breakdown (for series)
//   - Directors, Writers, Cast members
//   - User reviews with ability to write new ones
//   - Similar movie recommendations
//   - Add to Watchlist button
//
// PERFORMANCE:
//   Uses the getMovieFull() API endpoint which returns ALL of this
//   data in a SINGLE API call (instead of 7 separate calls).
//   This is possible because the backend uses Promise.all() to
//   run all 7 database queries in parallel.
//
// REACT PATTERNS:
//   useParams()   → Gets the :id from the URL (/movie/42 → id = 42)
//   useNavigate() → Programmatic navigation (e.g., redirect to login)
//   useUser()     → Access current user from context (for auth)
// ================================================================
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  getMovieFull, 
  addReview, 
  addToWatchlist
} from '../services/api';
import { useUser } from '../context/UserContext';
import { searchPersonPhoto, searchMovieRating, searchMovieProviders, searchMoviePoster } from '../services/tmdb';
import '../styles/MovieDetails.css';

function MovieDetails() {
  // useParams() extracts the :id from the URL route defined in App.js
  // For /movie/42, id = "42"
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useUser();  // Current logged-in user (or null)

  // ── STATE ──
  // All of this data comes from a single getMovieFull() API call
  const [movie, setMovie]           = useState(null);    // Movie details + rating
  const [reviews, setReviews]       = useState([]);      // All reviews for this movie
  const [cast, setCast]             = useState([]);      // Actor list
  const [directors, setDirectors]   = useState([]);      // Director list
  const [writers, setWriters]       = useState([]);      // Writer list
  const [similar, setSimilar]       = useState([]);      // Similar movie recommendations
  const [loading, setLoading]       = useState(true);    // Loading spinner visibility
  const [showReviewForm, setShowReviewForm] = useState(false);  // Review form toggle
  const [newReview, setNewReview]   = useState({ rating: 5, review_text: '' });  // Form data
  const [inWatchlist, setInWatchlist] = useState(false);  // Is this movie in user's watchlist?
  const [reviewError, setReviewError] = useState('');     // Error message for review form
  const [personPhotos, setPersonPhotos] = useState({});    // TMDB person photos { name: url }
  const [tmdbRating, setTmdbRating] = useState(null);      // TMDB rating info
  const [tmdbProviders, setTmdbProviders] = useState(null); // TMDB watch providers
  const [posterSrc, setPosterSrc] = useState(null);         // Poster fallback src

  // ── EFFECT: Reload data when movie ID or user changes ──
  // Runs when: 1) navigating to a different movie, 2) user logs in/out
  useEffect(() => {
    loadAll();
  }, [id, user]);

  // ── EFFECT: Fetch person photos from TMDB for cast, directors, writers ──
  useEffect(() => {
    const allPeople = [
      ...directors.map(d => d.name),
      ...writers.map(w => w.name),
      ...cast.map(a => a.name)
    ].filter(Boolean);

    if (allPeople.length === 0) return;

    // Only fetch photos for people we don't already have
    const toFetch = allPeople.filter(name => !(name in personPhotos));
    if (toFetch.length === 0) return;

    let cancelled = false;
    const fetchPhotos = async () => {
      const results = {};
      // Batch in groups of 5 to avoid rate-limiting
      for (let i = 0; i < toFetch.length; i += 5) {
        const batch = toFetch.slice(i, i + 5);
        const photos = await Promise.all(batch.map(name => searchPersonPhoto(name)));
        batch.forEach((name, idx) => { results[name] = photos[idx]; });
      }
      if (!cancelled) {
        setPersonPhotos(prev => ({ ...prev, ...results }));
      }
    };
    fetchPhotos();
    return () => { cancelled = true; };
  }, [cast, directors, writers]);

  // ── EFFECT: Fetch TMDB rating for this title ──
  useEffect(() => {
    if (!movie?.title) return;
    let cancelled = false;

    const fetchRating = async () => {
      const result = await searchMovieRating(
        movie.title,
        movie.release_year,
        movie.content_type
      );
      if (!cancelled) setTmdbRating(result);
    };

    fetchRating();
    return () => { cancelled = true; };
  }, [movie]);

  // ── EFFECT: Fetch TMDB watch providers for this title (region BD) ──
  useEffect(() => {
    if (!movie?.title) return;
    let cancelled = false;

    const fetchProviders = async () => {
      const result = await searchMovieProviders(
        movie.title,
        movie.release_year,
        movie.content_type,
        'BD'
      );
      if (!cancelled) setTmdbProviders(result);
    };

    fetchProviders();
    return () => { cancelled = true; };
  }, [movie]);

  // ── EFFECT: Fetch poster from TMDB if missing in DB ──
  useEffect(() => {
    if (!movie) return;
    setPosterSrc(movie.poster_url || null);

    if (movie.poster_url) return;
    let cancelled = false;

    const fetchPoster = async () => {
      const url = await searchMoviePoster(movie.title, movie.release_year);
      if (!cancelled) setPosterSrc(url || null);
    };

    fetchPoster();
    return () => { cancelled = true; };
  }, [movie]);

  // Fetch ALL movie data in one API call
  // This calls getMovieFull() which hits /api/movies/:id/full on the backend
  const loadAll = async () => {
    setLoading(true);
    try {
      // Single API call returns EVERYTHING the page needs
      // Backend runs 7 queries in parallel using Promise.all()
      const res = await getMovieFull(id, user?.user_id);
      const data = res.data;  // axios wraps the response in .data

      // Distribute the combined response to individual state variables
      setMovie(data.movie);
      setReviews(data.reviews);
      setCast(data.cast);
      setDirectors(data.directors);
      setWriters(data.writers);
      setSimilar(data.similar);
      setInWatchlist(data.inWatchlist || false);
    } catch (error) {
      console.error('Error loading movie details:', error);
    } finally {
      setLoading(false);
    }
  };

  // ── ADD TO WATCHLIST ──
  // If user isn't logged in, redirect to login page.
  // If already in watchlist, the API returns an error which we handle gracefully.
  const handleAddToWatchlist = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    try {
      await addToWatchlist(user.user_id, id);
      setInWatchlist(true);
    } catch (error) {
      if (error.response?.data?.error === 'Movie already in watchlist') {
        setInWatchlist(true);
      }
    }
  };

  // ── SUBMIT A NEW REVIEW ──
  // e.preventDefault() stops the form from doing a full page reload.
  // After submitting, we refresh the movie data to show the updated
  // average rating and the new review in the list.
  const handleSubmitReview = async (e) => {
    e.preventDefault();  // Prevent browser default form submission
    if (!user) { navigate('/login'); return; }
    setReviewError('');  // Clear any previous error

    try {
      await addReview({
        user_id: user.user_id,
        movie_id: id,
        rating: parseFloat(newReview.rating),
        review_text: newReview.review_text
      });
      setShowReviewForm(false);
      setNewReview({ rating: 5, review_text: '' });
      // After successful review, re-fetch movie data to update:
      //   - The average_rating (recalculated with new review)
      //   - The review_count
      //   - The reviews list
      const res = await getMovieFull(id, user?.user_id);
      setMovie(res.data.movie);
      setReviews(res.data.reviews);
    } catch (error) {
      setReviewError(error.response?.data?.error || 'Error adding review');
    }
  };

  // ── LOADING & ERROR STATES ──
  // These are shown BEFORE the main content renders
  if (loading) return (
    <div className="md-loading">
      <div className="md-loading-spinner" />
      <span>Loading details...</span>
    </div>
  );
  if (!movie)  return <div className="error">Movie not found. <button onClick={() => navigate('/home')}>Go back</button></div>;

  // Parse the rating for display (e.g., "7.5" not "7.50000001")
  const ratingValue = parseFloat(movie.average_rating || 0).toFixed(1);
  const tmdbRatingValue = tmdbRating?.rating != null
    ? parseFloat(tmdbRating.rating).toFixed(1)
    : null;
  const isSeries = movie.content_type === 'series';

  const normalizePlatforms = () => {
    const raw = movie.platforms;
    let list = [];
    if (Array.isArray(raw)) {
      list = raw;
    } else if (raw && typeof raw === 'string') {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) list = parsed;
      } catch {}
    }

    const cleaned = list
      .map((item) => ({
        name: (item?.name || '').trim(),
        url: (item?.url || '').trim()
      }))
      .filter((item) => item.name);

    if (cleaned.length === 0 && movie.netflix_url) {
      return [{ name: 'Netflix', url: movie.netflix_url }];
    }

    return cleaned;
  };

  const platforms = normalizePlatforms();
  const providerPlatforms = (tmdbProviders?.providers || [])
    .filter((p) => {
      const name = (p?.name || '').toLowerCase();
      return name && !name.includes('hulu') && !name.includes('hbo max') && name !== 'max';
    })
    .map((p) => ({
      name: p.name,
      url: tmdbProviders?.link || ''
    }));
  const availabilityList = providerPlatforms.length > 0 ? providerPlatforms : platforms;
  const getPlatformClass = (name) => {
    const key = name.toLowerCase();
    if (key.includes('netflix')) return 'netflix';
    if (key.includes('prime')) return 'prime';
    if (key.includes('disney')) return 'disney';
    return 'generic';
  };

  // ============================================================
  // RENDER — The JSX that creates the visible UI
  // Organized into sections: Header, Trailer, Seasons, 
  // Directors, Writers, Cast, Reviews, Similar
  // ============================================================
  return (
    <div className="movie-details">
      {/* Back button */}
      <button onClick={() => navigate('/home')} className="back-btn">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        Back to Browse
      </button>

      {/* ── Movie Header ── */}
      <div className="movie-header">
        <div className="movie-header-content">
          {posterSrc ? (
            <img src={posterSrc} alt={movie.title} className="movie-poster-large"
              onError={() => setPosterSrc(null)} />
          ) : (
            <div className="movie-poster-large poster-skeleton">
              <div className="poster-skeleton-shine" />
            </div>
          )}
          <div className="movie-header-info">
            <div className="md-title-row">
              <h1>{movie.title}</h1>
              {movie.has_oscar && (
                <span className="md-oscar-badge" title="Academy Award Winner">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="#f5c518" stroke="#f5c518" strokeWidth="1.5"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>
                </span>
              )}
            </div>
            {isSeries && (
              <span className="content-type-badge">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="15" rx="2" ry="2"/><polyline points="17 2 12 7 7 2"/></svg>
                TV Series
              </span>
            )}

            {/* Rating block */}
            <div className="md-rating-block">
              <div className="md-rating-group">
                <span className="md-rating-label">User rating</span>
                <div className="md-rating-score">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="#f5c518" stroke="#f5c518" strokeWidth="1"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                  <span className="md-rating-number">{ratingValue}</span>
                  <span className="md-rating-max">/10</span>
                </div>
                <span className="md-rating-subtext">
                  {movie.review_count || 0} review{(movie.review_count || 0) !== 1 ? 's' : ''}
                </span>
              </div>

              <span className="md-rating-divider" />

              <div className="md-rating-group">
                <span className="md-rating-label">TMDB</span>
                <div className="md-rating-score">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="#f5c518" stroke="#f5c518" strokeWidth="1"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                  <span className="md-rating-number">{tmdbRatingValue || '—'}</span>
                  <span className="md-rating-max">/10</span>
                </div>
                <span className="md-rating-subtext">
                  {tmdbRating ? `${tmdbRating.count || 0} votes` : 'No TMDB rating'}
                </span>
              </div>
            </div>

            <div className="movie-meta">
              <span className="md-meta-item">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                {movie.release_year}
              </span>
              {isSeries ? (
                <>
                  <span className="md-meta-divider" />
                  <span className="md-meta-item">{movie.seasons} Season{movie.seasons > 1 ? 's' : ''}</span>
                  <span className="md-meta-divider" />
                  <span className="md-meta-item">{movie.total_episodes} Episodes</span>
                  <span className="md-meta-divider" />
                  <span className="md-meta-item">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    ~{movie.duration} min/ep
                  </span>
                </>
              ) : (
                <>
                  <span className="md-meta-divider" />
                  <span className="md-meta-item">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    {movie.duration} min
                  </span>
                </>
              )}
            </div>

            <div className="movie-genres">
              {(movie.genres || []).filter(Boolean).map((genre, i) => (
                <span key={i} className="genre-tag">{genre}</span>
              ))}
            </div>

            <p className="movie-description">{movie.description}</p>

            {availabilityList.length > 0 && (
              <div className="md-platforms">
                <span className="md-platforms-label">Available on</span>
                <div className="md-platforms-list">
                  {availabilityList.map((platform, idx) => {
                    const className = `md-platform-chip ${getPlatformClass(platform.name)}`;
                    if (platform.url) {
                      return (
                        <a
                          key={`${platform.name}-${idx}`}
                          className={className}
                          href={platform.url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {platform.name}
                        </a>
                      );
                    }
                    return (
                      <span key={`${platform.name}-${idx}`} className={className}>
                        {platform.name}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="md-actions">
              <button
                onClick={handleAddToWatchlist}
                className={inWatchlist ? 'watchlist-btn in-watchlist' : 'watchlist-btn'}
                disabled={inWatchlist}
              >
                {inWatchlist ? (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    In Watchlist
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
                    Add to Watchlist
                  </>
                )}
              </button>

              {movie.netflix_url && (
                <a
                  href={movie.netflix_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="netflix-btn"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M5.398 0v.006c3.028 8.556 5.37 15.175 8.348 23.596 2.344.058 4.85.398 4.854.398-2.8-7.924-5.923-16.747-8.487-24zm8.489 0v9.63L18.6 22.951c.043.007.295.046.678.078V0zm-8.488 0v15.88l4.713 8.12c-.05-.173-.05-.173-.098-.333V0z"/>
                  </svg>
                  Watch on Netflix
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Trailer ── */}
      {movie.trailer_url && (() => {
        const ytMatch = movie.trailer_url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
        const videoId = ytMatch ? ytMatch[1] : null;
        return videoId ? (
          <div className="md-section trailer-section">
            <div className="md-section-header">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              <h2>Official Trailer</h2>
            </div>
            <div className="trailer-wrapper">
              <iframe
                src={`https://www.youtube.com/embed/${videoId}`}
                title={`${movie.title} Trailer`}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        ) : null;
      })()}

      {/* ── Season Breakdown (series only) ── */}
      {isSeries && movie.episodes_per_season && (
        <div className="md-section seasons-section">
          <div className="md-section-header">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
            <h2>Season Breakdown</h2>
          </div>
          <div className="seasons-grid">
            {(Array.isArray(movie.episodes_per_season) ? movie.episodes_per_season : []).map((s) => (
              <div key={s.season} className="season-card">
                <div className="season-number">Season {s.season}</div>
                <div className="season-episodes">{s.episodes} Episodes</div>
                <div className="season-duration">~{s.episodes * movie.duration} min total</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Directors ── */}
      {directors.length > 0 && (
        <div className="md-section cast-section">
          <div className="md-section-header">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
            <h2>Director{directors.length > 1 ? 's' : ''}</h2>
          </div>
          <div className="cast-list">
            {directors.map(d => {
              const photoUrl = d.photo_url || personPhotos[d.name];
              return (
                <div key={d.person_id} className="cast-card">
                  {photoUrl ? (
                    <img src={photoUrl} alt={d.name} className="cast-photo"
                      onError={(e) => { e.target.src = 'https://via.placeholder.com/80x80/333/fff?text=?'; }} />
                  ) : (
                    <div className="cast-photo-placeholder">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8b949e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    </div>
                  )}
                  <div className="cast-info">
                    <span className="cast-name">{d.name}</span>
                    <span className="cast-role">Director</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Writers ── */}
      {writers.length > 0 && (
        <div className="md-section cast-section">
          <div className="md-section-header">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
            <h2>Writer{writers.length > 1 ? 's' : ''}</h2>
          </div>
          <div className="cast-list">
            {writers.map(w => {
              const photoUrl = w.photo_url || personPhotos[w.name];
              return (
                <div key={w.person_id} className="cast-card">
                  {photoUrl ? (
                    <img src={photoUrl} alt={w.name} className="cast-photo"
                      onError={(e) => { e.target.src = 'https://via.placeholder.com/80x80/333/fff?text=?'; }} />
                  ) : (
                    <div className="cast-photo-placeholder">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8b949e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    </div>
                  )}
                  <div className="cast-info">
                    <span className="cast-name">{w.name}</span>
                    <span className="cast-role">Writer</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Cast ── */}
      {cast.length > 0 && (
        <div className="md-section cast-section">
          <div className="md-section-header">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            <h2>Cast</h2>
          </div>
          <div className="cast-list">
            {cast.map(a => {
              const photoUrl = a.photo_url || personPhotos[a.name];
              return (
                <div key={a.person_id} className="cast-card">
                  {photoUrl ? (
                    <img src={photoUrl} alt={a.name} className="cast-photo"
                      onError={(e) => { e.target.src = 'https://via.placeholder.com/80x80/333/fff?text=?'; }} />
                  ) : (
                    <div className="cast-photo-placeholder">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8b949e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    </div>
                  )}
                  <div className="cast-info">
                    <span className="cast-name">{a.name}</span>
                    {a.character_name && (
                      <span className="cast-role">as {a.character_name}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Reviews ── */}
      <div className="md-section reviews-section">
        <div className="reviews-header">
          <div className="md-section-header">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            <h2>Reviews ({reviews.length})</h2>
          </div>
          {user ? (
            <button onClick={() => setShowReviewForm(!showReviewForm)} className="add-review-btn">
              {showReviewForm ? 'Cancel' : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  Write a Review
                </>
              )}
            </button>
          ) : (
            <button onClick={() => navigate('/login')} className="add-review-btn">
              Sign in to Review
            </button>
          )}
        </div>

        {showReviewForm && (
          <form onSubmit={handleSubmitReview} className="review-form">
            {reviewError && <p className="error-msg">{reviewError}</p>}
            <div className="form-group">
              <label>Rating (0 &ndash; 10)</label>
              <input type="number" min="0" max="10" step="0.5"
                value={newReview.rating}
                onChange={(e) => setNewReview({ ...newReview, rating: e.target.value })}
                required />
            </div>
            <div className="form-group">
              <label>Your Review</label>
              <textarea
                value={newReview.review_text}
                onChange={(e) => setNewReview({ ...newReview, review_text: e.target.value })}
                placeholder="Share your thoughts about this title..."
                rows="4" required />
            </div>
            <button type="submit" className="submit-review-btn">Submit Review</button>
          </form>
        )}

        <div className="reviews-list">
          {reviews.length === 0 ? (
            <p className="no-reviews">No reviews yet. Be the first to share your thoughts.</p>
          ) : (
            reviews.map(review => (
              <div key={review.review_id} className="review-card">
                <div className="review-header">
                  <span className="review-user">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    {review.username}
                  </span>
                  <span className="review-rating">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="#f5c518" stroke="#f5c518" strokeWidth="1"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                    {review.rating}/10
                  </span>
                </div>
                <p className="review-text">{review.review_text}</p>
                <span className="review-date">
                  {new Date(review.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── Similar Titles ── */}
      {similar.length > 0 && (
        <div className="md-section similar-section">
          <div className="md-section-header">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/></svg>
            <h2>You Might Also Like</h2>
          </div>
          <div className="similar-list">
            {similar.map(m => (
              <div key={m.movie_id} className="similar-card"
                onClick={() => navigate(`/movie/${m.movie_id}`)}>
                {m.poster_url ? (
                  <img src={m.poster_url} alt={m.title} className="similar-poster"
                    onError={(e) => { e.target.src = 'https://via.placeholder.com/120x180/333/fff?text=?'; }} />
                ) : (
                  <div className="similar-poster-placeholder">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#484f58" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/></svg>
                  </div>
                )}
                <p className="similar-title">{m.title}</p>
                <p className="similar-year">{m.release_year}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default MovieDetails;
