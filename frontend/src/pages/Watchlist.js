import React, { useState, useEffect } from 'react';
import { getWatchlist, removeFromWatchlist } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import '../styles/Watchlist.css';

function Watchlist() {
  const [watchlist, setWatchlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useUser(); // Get user object from global context

  useEffect(() => {
    if (user) {
      loadWatchlist();
    } else {
      setLoading(false);
      navigate('/login');
    }
  }, [user]);

  const loadWatchlist = async () => {
    if (!user) return;

    try {
      const response = await getWatchlist(user.user_id);
      setWatchlist(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error loading watchlist:', error);
      setLoading(false);
    }
  };

  const handleRemove = async (movieId) => {
    if (!user) return;

    if (window.confirm('Remove from watchlist?')) {
      try {
        await removeFromWatchlist(user.user_id, movieId);
        loadWatchlist(); // Refresh the list after removal
      } catch (error) {
        console.error('Error removing from watchlist:', error);
        alert('Error removing movie from watchlist');
      }
    }
  };

  if (!user) {
    return (
      <div className="watchlist">
        <div className="empty-watchlist">
          <h2>Please login to view your watchlist</h2>
          <button onClick={() => navigate('/login')} className="browse-btn">
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="watchlist">
      <header className="header">
        <h1>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#667eea" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
          My Watchlist
        </h1>
        <button onClick={() => navigate('/home')} className="back-btn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          Back to Browse
        </button>
      </header>

      {loading ? (
        <div className="loading">Loading watchlist...</div>
      ) : watchlist.length === 0 ? (
        <div className="empty-watchlist">
          <p>Your watchlist is empty!</p>
          <button onClick={() => navigate('/home')} className="browse-btn">
            Browse Movies
          </button>
        </div>
      ) : (
        <div className="movies-grid">
          {watchlist.map(movie => (
            <div key={movie.movie_id} className="movie-card">
              {movie.poster_url ? (
                <img 
                  src={movie.poster_url} 
                  alt={movie.title}
                  className="movie-poster"
                  onClick={() => navigate(`/movie/${movie.movie_id}`)}
                  onError={(e) => {
                    e.target.src = `https://via.placeholder.com/300x450/667eea/ffffff?text=${encodeURIComponent(movie.title)}`;
                  }}
                />
              ) : (
                <div 
                  className="movie-poster-placeholder"
                  onClick={() => navigate(`/movie/${movie.movie_id}`)}
                >
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#8b949e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="2" y1="7" x2="7" y2="7"/><line x1="2" y1="17" x2="7" y2="17"/><line x1="17" y1="17" x2="22" y2="17"/><line x1="17" y1="7" x2="22" y2="7"/></svg>
                  <p>{movie.title}</p>
                </div>
              )}

              <div 
                className="movie-card-content"
                onClick={() => navigate(`/movie/${movie.movie_id}`)}
              >
                <h3>{movie.title}</h3>
                {movie.has_oscar && <span className="oscar-badge"><svg width="18" height="18" viewBox="0 0 24 24" fill="#f5c518" stroke="none"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg></span>}
                <p className="movie-year">{movie.release_year}</p>
                <div className="movie-genres">
                  {movie.genres && movie.genres.filter(g => g).map((genre, index) => (
                    <span key={index} className="genre-tag">{genre}</span>
                  ))}
                </div>
                <p className="added-date">
                  Added: {new Date(movie.added_at).toLocaleDateString()}
                </p>
              </div>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove(movie.movie_id);
                }}
                className="remove-btn"
              >
                ✕ Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Watchlist;
