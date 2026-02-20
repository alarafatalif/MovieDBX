import axios from 'axios';

const TMDB_API_KEY = process.env.REACT_APP_TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

const posterCache = new Map();

try {
  const saved = sessionStorage.getItem('tmdb_poster_cache');
  if (saved) {
    const parsed = JSON.parse(saved);
    Object.entries(parsed).forEach(([k, v]) => posterCache.set(k, v));
  }
} catch {}

const saveCacheToStorage = () => {
  try {
    const obj = Object.fromEntries(posterCache);
    sessionStorage.setItem('tmdb_poster_cache', JSON.stringify(obj));
  } catch {}
};

const inFlight = new Map();

export const searchMoviePoster = async (movieTitle, year) => {
  const cacheKey = `${movieTitle}-${year || ''}`;

  if (posterCache.has(cacheKey)) {
    return posterCache.get(cacheKey);
  }

  if (inFlight.has(cacheKey)) {
    return inFlight.get(cacheKey);
  }

  const promise = (async () => {
    try {
      const response = await axios.get(`${TMDB_BASE_URL}/search/movie`, {
        params: { api_key: TMDB_API_KEY, query: movieTitle, year }
      });

      let url = null;
      if (response.data.results.length > 0) {
        const posterPath = response.data.results[0].poster_path;
        if (posterPath) url = `${TMDB_IMAGE_BASE_URL}${posterPath}`;
      }

      posterCache.set(cacheKey, url);
      saveCacheToStorage();
      return url;
    } catch (error) {
      console.error('Error fetching poster:', error);
      return null;
    } finally {
      inFlight.delete(cacheKey);
    }
  })();

  inFlight.set(cacheKey, promise);
  return promise;
};
