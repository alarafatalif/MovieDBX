import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import {
  addMovie,
  deleteMovie,
  getAllGenres,
  getAllMovies,
  getAllUsers,
  deleteUser
} from '../services/api';
import '../styles/Admin.css';

const emptyForm = {
  title: '',
  description: '',
  release_year: '',
  duration: '',
  poster_url: '',
  trailer_url: '',
  netflix_url: '',
  platforms: '',
  has_oscar: false,
  content_type: 'movie',
  seasons: '',
  total_episodes: '',
  episodes_per_season: '',
  genres: []
};

function Admin() {
  const { user } = useUser();
  const navigate = useNavigate();

  const [genres, setGenres] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [users, setUsers] = useState([]);

  const [contentFilter, setContentFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(true);

  const [formData, setFormData] = useState(emptyForm);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  useEffect(() => {
    if (!user) return;
    if (!user.is_admin) {
      navigate('/home');
      return;
    }
    loadGenres();
    loadCatalog();
    loadUsers();
  }, [user, navigate]);

  const loadGenres = async () => {
    try {
      const response = await getAllGenres();
      setGenres(response.data || []);
    } catch (error) {
      console.error('Error loading genres:', error);
    }
  };

  const loadCatalog = async () => {
    try {
      setLoadingCatalog(true);
      const response = await getAllMovies();
      setCatalog(response.data || []);
    } catch (error) {
      console.error('Error loading catalog:', error);
    } finally {
      setLoadingCatalog(false);
    }
  };

  const loadUsers = async () => {
    try {
      setLoadingUsers(true);
      const response = await getAllUsers();
      setUsers(response.data || []);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoadingUsers(false);
    }
  };

  const filteredCatalog = useMemo(() => {
    let items = [...catalog];
    if (contentFilter !== 'all') {
      items = items.filter((item) => item.content_type === contentFilter);
    }
    if (searchTerm.trim()) {
      const q = searchTerm.trim().toLowerCase();
      items = items.filter((item) => item.title?.toLowerCase().includes(q));
    }
    return items;
  }, [catalog, contentFilter, searchTerm]);

  const movieCount = catalog.filter((item) => item.content_type === 'movie').length;
  const seriesCount = catalog.filter((item) => item.content_type === 'series').length;
  const userCount = users.length;
  const adminCount = users.filter((item) => item.is_admin).length;

  const handleFieldChange = (event) => {
    const { name, value, type, checked } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    setFormError('');
    setFormSuccess('');
  };

  const toggleGenre = (genreName) => {
    setFormData((prev) => {
      const exists = prev.genres.includes(genreName);
      const nextGenres = exists
        ? prev.genres.filter((name) => name !== genreName)
        : [...prev.genres, genreName];
      return { ...prev, genres: nextGenres };
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!formData.title.trim()) {
      setFormError('Title is required.');
      return;
    }

    let episodesPayload = null;
    if (formData.episodes_per_season.trim()) {
      try {
        episodesPayload = JSON.parse(formData.episodes_per_season);
      } catch (error) {
        setFormError('Episodes per season must be valid JSON.');
        return;
      }
    }

    const platforms = formData.platforms
      .split(',')
      .map((platform) => platform.trim())
      .filter(Boolean);

    const payload = {
      title: formData.title.trim(),
      description: formData.description.trim() || null,
      release_year: formData.release_year ? Number(formData.release_year) : null,
      duration: formData.duration ? Number(formData.duration) : null,
      poster_url: formData.poster_url.trim() || null,
      trailer_url: formData.trailer_url.trim() || null,
      netflix_url: formData.netflix_url.trim() || null,
      platforms: platforms.length ? platforms : [],
      has_oscar: formData.has_oscar,
      content_type: formData.content_type,
      seasons: formData.seasons ? Number(formData.seasons) : null,
      total_episodes: formData.total_episodes ? Number(formData.total_episodes) : null,
      episodes_per_season: episodesPayload,
      genres: formData.genres
    };

    try {
      await addMovie(payload);
      setFormSuccess('Title added successfully.');
      setFormData((prev) => ({ ...emptyForm, content_type: prev.content_type }));
      await loadCatalog();
    } catch (error) {
      setFormError(error.response?.data?.error || 'Failed to add title.');
    }
  };

  const handleDeleteMovie = async (movieId) => {
    if (!window.confirm('Delete this title? This cannot be undone.')) return;
    try {
      await deleteMovie(movieId);
      await loadCatalog();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to delete title.');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Delete this user account? This cannot be undone.')) return;
    try {
      await deleteUser(userId);
      await loadUsers();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to delete user.');
    }
  };

  if (!user) {
    return (
      <div className="admin-guard">
        <div className="admin-guard-card">
          <h2>Admin access required</h2>
          <p>Sign in as an admin to open the dashboard.</p>
          <button onClick={() => navigate('/login')} className="admin-btn admin-btn-primary">
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (!user.is_admin) {
    return (
      <div className="admin-guard">
        <div className="admin-guard-card">
          <h2>Access denied</h2>
          <p>Your account does not have admin privileges.</p>
          <button onClick={() => navigate('/home')} className="admin-btn admin-btn-ghost">
            Back to Browse
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-shell">
        <header className="admin-hero">
          <div>
            <p className="admin-kicker">Control Room</p>
            <h1>Admin dashboard</h1>
            <p className="admin-subtitle">
              Curate titles, manage members, and keep the catalog pristine.
            </p>
          </div>
          <div className="admin-hero-actions">
            <div className="admin-chip">
              <span className="admin-chip-label">Admin</span>
              <span className="admin-chip-name">{user.username}</span>
            </div>
            <button onClick={() => navigate('/home')} className="admin-btn admin-btn-ghost">
              Back to Browse
            </button>
          </div>
        </header>

        <section className="admin-stats">
          <div className="admin-stat">
            <span>Total titles</span>
            <strong>{catalog.length}</strong>
          </div>
          <div className="admin-stat">
            <span>Movies</span>
            <strong>{movieCount}</strong>
          </div>
          <div className="admin-stat">
            <span>Series</span>
            <strong>{seriesCount}</strong>
          </div>
          <div className="admin-stat">
            <span>Members</span>
            <strong>{userCount}</strong>
          </div>
          <div className="admin-stat">
            <span>Admins</span>
            <strong>{adminCount}</strong>
          </div>
        </section>

        <section className="admin-main">
          <div className="admin-panel">
            <div className="admin-panel-header">
              <div>
                <h2>Add new title</h2>
                <p>Upload movies and series with a complete profile.</p>
              </div>
            </div>

            <form className="admin-form" onSubmit={handleSubmit}>
              <div className="admin-field">
                <label htmlFor="title">Title</label>
                <input
                  id="title"
                  name="title"
                  type="text"
                  value={formData.title}
                  onChange={handleFieldChange}
                  placeholder="Enter title name"
                  required
                />
              </div>

              <div className="admin-field admin-field-wide">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleFieldChange}
                  placeholder="Short synopsis for the detail page"
                  rows={4}
                />
              </div>

              <div className="admin-field">
                <label htmlFor="content_type">Content type</label>
                <select
                  id="content_type"
                  name="content_type"
                  value={formData.content_type}
                  onChange={handleFieldChange}
                >
                  <option value="movie">Movie</option>
                  <option value="series">Series</option>
                </select>
              </div>

              <div className="admin-field">
                <label htmlFor="release_year">Release year</label>
                <input
                  id="release_year"
                  name="release_year"
                  type="number"
                  min="1900"
                  max="2100"
                  value={formData.release_year}
                  onChange={handleFieldChange}
                  placeholder="2024"
                />
              </div>

              <div className="admin-field">
                <label htmlFor="duration">Duration (min)</label>
                <input
                  id="duration"
                  name="duration"
                  type="number"
                  min="1"
                  value={formData.duration}
                  onChange={handleFieldChange}
                  placeholder="120"
                />
              </div>

              <div className="admin-field">
                <label htmlFor="poster_url">Poster URL</label>
                <input
                  id="poster_url"
                  name="poster_url"
                  type="url"
                  value={formData.poster_url}
                  onChange={handleFieldChange}
                  placeholder="https://"
                />
              </div>

              <div className="admin-field">
                <label htmlFor="trailer_url">Trailer URL</label>
                <input
                  id="trailer_url"
                  name="trailer_url"
                  type="url"
                  value={formData.trailer_url}
                  onChange={handleFieldChange}
                  placeholder="https://"
                />
              </div>

              <div className="admin-field">
                <label htmlFor="netflix_url">Platform URL</label>
                <input
                  id="netflix_url"
                  name="netflix_url"
                  type="url"
                  value={formData.netflix_url}
                  onChange={handleFieldChange}
                  placeholder="https://"
                />
              </div>

              <div className="admin-field">
                <label htmlFor="platforms">Platforms (comma separated)</label>
                <input
                  id="platforms"
                  name="platforms"
                  type="text"
                  value={formData.platforms}
                  onChange={handleFieldChange}
                  placeholder="Netflix, Prime, Hulu"
                />
              </div>

              <div className="admin-field">
                <label className="admin-checkbox">
                  <input
                    type="checkbox"
                    name="has_oscar"
                    checked={formData.has_oscar}
                    onChange={handleFieldChange}
                  />
                  Oscar winner
                </label>
              </div>

              {formData.content_type === 'series' && (
                <>
                  <div className="admin-field">
                    <label htmlFor="seasons">Seasons</label>
                    <input
                      id="seasons"
                      name="seasons"
                      type="number"
                      min="1"
                      value={formData.seasons}
                      onChange={handleFieldChange}
                      placeholder="4"
                    />
                  </div>

                  <div className="admin-field">
                    <label htmlFor="total_episodes">Total episodes</label>
                    <input
                      id="total_episodes"
                      name="total_episodes"
                      type="number"
                      min="1"
                      value={formData.total_episodes}
                      onChange={handleFieldChange}
                      placeholder="42"
                    />
                  </div>

                  <div className="admin-field admin-field-wide">
                    <label htmlFor="episodes_per_season">Episodes per season (JSON)</label>
                    <textarea
                      id="episodes_per_season"
                      name="episodes_per_season"
                      value={formData.episodes_per_season}
                      onChange={handleFieldChange}
                      placeholder='[{"season":1,"episodes":8},{"season":2,"episodes":10}]'
                      rows={3}
                    />
                  </div>
                </>
              )}

              <div className="admin-field admin-field-wide">
                <label>Genres</label>
                <div className="admin-genre-grid">
                  {genres.map((genre) => (
                    <button
                      key={genre.genre_id}
                      type="button"
                      className={
                        formData.genres.includes(genre.genre_name)
                          ? 'admin-genre active'
                          : 'admin-genre'
                      }
                      onClick={() => toggleGenre(genre.genre_name)}
                    >
                      {genre.genre_name}
                    </button>
                  ))}
                </div>
              </div>

              {formError && <div className="admin-alert admin-alert-error">{formError}</div>}
              {formSuccess && <div className="admin-alert admin-alert-success">{formSuccess}</div>}

              <div className="admin-form-actions">
                <button type="submit" className="admin-btn admin-btn-primary">
                  Publish title
                </button>
              </div>
            </form>
          </div>

          <div className="admin-panel">
            <div className="admin-panel-header">
              <div>
                <h2>Catalog control</h2>
                <p>Search and remove titles instantly.</p>
              </div>
            </div>

            <div className="admin-filter-bar">
              <div className="admin-tabs">
                <button
                  type="button"
                  className={contentFilter === 'all' ? 'admin-tab active' : 'admin-tab'}
                  onClick={() => setContentFilter('all')}
                >
                  All
                </button>
                <button
                  type="button"
                  className={contentFilter === 'movie' ? 'admin-tab active' : 'admin-tab'}
                  onClick={() => setContentFilter('movie')}
                >
                  Movies
                </button>
                <button
                  type="button"
                  className={contentFilter === 'series' ? 'admin-tab active' : 'admin-tab'}
                  onClick={() => setContentFilter('series')}
                >
                  Series
                </button>
              </div>
              <input
                className="admin-search"
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search titles"
              />
            </div>

            {loadingCatalog ? (
              <div className="admin-loading">Loading catalog...</div>
            ) : filteredCatalog.length === 0 ? (
              <div className="admin-empty">No titles found.</div>
            ) : (
              <div className="admin-list">
                {filteredCatalog.map((item) => (
                  <div key={item.movie_id} className="admin-list-row">
                    <div>
                      <div className="admin-title-row">
                        <h3>{item.title}</h3>
                        <span className="admin-pill">{item.content_type}</span>
                      </div>
                      <div className="admin-meta">
                        <span>{item.release_year || 'Year TBD'}</span>
                        {item.genres && item.genres.filter(Boolean).length > 0 && (
                          <div className="admin-genre-tags">
                            {item.genres.filter(Boolean).slice(0, 3).map((genre) => (
                              <span key={genre} className="admin-tag">
                                {genre}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <button
                      className="admin-btn admin-btn-danger"
                      type="button"
                      onClick={() => handleDeleteMovie(item.movie_id)}
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="admin-panel admin-users">
          <div className="admin-panel-header">
            <div>
              <h2>User management</h2>
              <p>Remove accounts and monitor access levels.</p>
            </div>
          </div>

          {loadingUsers ? (
            <div className="admin-loading">Loading users...</div>
          ) : users.length === 0 ? (
            <div className="admin-empty">No users found.</div>
          ) : (
            <div className="admin-users-grid">
              {users.map((item) => (
                <div key={item.user_id} className="admin-user-card">
                  <div>
                    <div className="admin-user-name">
                      <strong>{item.username}</strong>
                      {item.is_admin && <span className="admin-pill">admin</span>}
                    </div>
                    <p>{item.email}</p>
                    <span className="admin-user-date">
                      Joined {new Date(item.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="admin-btn admin-btn-outline"
                    disabled={item.is_admin}
                    onClick={() => handleDeleteUser(item.user_id)}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default Admin;
