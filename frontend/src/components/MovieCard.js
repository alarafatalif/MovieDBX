import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchMoviePoster } from '../services/tmdb';

function MovieCard({ movie }) {
  const navigate = useNavigate();

  const [posterSrc, setPosterSrc] = useState(movie.poster_url || null);
  const [posterLoaded, setPosterLoaded] = useState(false);
  const [fetchedFromTMDB, setFetchedFromTMDB] = useState(false);

  React.useEffect(() => {
    if (!movie.poster_url && !fetchedFromTMDB) {
      setFetchedFromTMDB(true);
      searchMoviePoster(movie.title, movie.release_year).then(url => {
        if (url) setPosterSrc(url);
      });
    }
  }, [movie]);

  const genreColors = {
    'Action':    ['#1a1a2e', '#e94560'],
    'Drama':     ['#0f3460', '#533483'],
    'Comedy':    ['#1a1a2e', '#f5a623'],
    'Sci-Fi':    ['#0d1b2a', '#00b4d8'],
    'Thriller':  ['#1b1b2f', '#c94b4b'],
    'Horror':    ['#0d0208', '#8B0000'],
    'Romance':   ['#1a0533', '#e91e8c'],
    'Crime':     ['#1c1c1c', '#8d8d8d'],
  };

  const firstGenre = (movie.genres || []).filter(Boolean)[0];
  const [gradFrom, gradTo] = genreColors[firstGenre] || ['#1a1a2e', '#667eea'];

  const rating = parseFloat(movie.average_rating || 0).toFixed(1);
  const reviewCount = movie.review_count || 0;

  return (
    <div className="movie-card" onClick={() => navigate(`/movie/${movie.movie_id}`)}>
      <div className="movie-poster-wrap">
        {posterSrc ? (
          <>
            <img
              src={posterSrc}
              alt={movie.title}
              className={`movie-poster ${posterLoaded ? 'loaded' : ''}`}
              onLoad={() => setPosterLoaded(true)}
              onError={() => setPosterSrc(null)}
            />
            {!posterLoaded && (
              <div className="poster-skeleton">
                <div className="poster-skeleton-shine" />
              </div>
            )}
          </>
        ) : (
          <div
            className="movie-poster-placeholder"
            style={{ background: `linear-gradient(160deg, ${gradFrom} 0%, ${gradTo} 100%)` }}
          >
            <span className="placeholder-icon">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="2" y1="7" x2="7" y2="7"/><line x1="2" y1="17" x2="7" y2="17"/><line x1="17" y1="17" x2="22" y2="17"/><line x1="17" y1="7" x2="22" y2="7"/></svg>
            </span>
            <p className="placeholder-title">{movie.title}</p>
            {firstGenre && <span className="placeholder-genre">{firstGenre}</span>}
          </div>
        )}

        {movie.has_oscar && (
          <div className="poster-oscar-badge">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#f5c518" stroke="#f5c518" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>
          </div>
        )}

        {reviewCount > 0 && (
          <div className="poster-rating-pill">
            {rating}
          </div>
        )}
      </div>

      <div className="movie-card-content">
        <div className="movie-card-header">
          <h3 className="movie-card-title">{movie.title}</h3>
        </div>

        <div className="movie-card-meta">
          <span className="movie-year">{movie.release_year}</span>
          {movie.duration && <span className="movie-duration">{movie.duration}m</span>}
        </div>

        {reviewCount === 0 && (
          <span className="no-rating-tag">No ratings yet</span>
        )}

        <div className="movie-genres">
          {(movie.genres || []).filter(Boolean).slice(0, 2).map((g, i) => (
            <span key={i} className="genre-tag">{g}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default MovieCard;
