import axios from 'axios';

const TMDB_API_KEY = process.env.REACT_APP_TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

const posterCache = new Map();
const personCache = new Map();
const ratingCache = new Map();

try {
  const saved = sessionStorage.getItem('tmdb_poster_cache');
  if (saved) {
    const parsed = JSON.parse(saved);
    Object.entries(parsed).forEach(([k, v]) => posterCache.set(k, v));
  }
} catch {}

try {
  const saved = sessionStorage.getItem('tmdb_person_cache');
  if (saved) {
    const parsed = JSON.parse(saved);
    Object.entries(parsed).forEach(([k, v]) => personCache.set(k, v));
  }
} catch {}

try {
  const saved = sessionStorage.getItem('tmdb_rating_cache');
  if (saved) {
    const parsed = JSON.parse(saved);
    Object.entries(parsed).forEach(([k, v]) => ratingCache.set(k, v));
  }
} catch {}

const saveCacheToStorage = () => {
  try {
    const obj = Object.fromEntries(posterCache);
    sessionStorage.setItem('tmdb_poster_cache', JSON.stringify(obj));
  } catch {}
};

const savePersonCacheToStorage = () => {
  try {
    const obj = Object.fromEntries(personCache);
    sessionStorage.setItem('tmdb_person_cache', JSON.stringify(obj));
  } catch {}
};

const saveRatingCacheToStorage = () => {
  try {
    const obj = Object.fromEntries(ratingCache);
    sessionStorage.setItem('tmdb_rating_cache', JSON.stringify(obj));
  } catch {}
};

const inFlight = new Map();
const personInFlight = new Map();
const ratingInFlight = new Map();

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

export const searchPersonPhoto = async (personName) => {
  if (!personName) return null;
  const cacheKey = personName.trim().toLowerCase();

  if (personCache.has(cacheKey)) {
    return personCache.get(cacheKey);
  }

  if (personInFlight.has(cacheKey)) {
    return personInFlight.get(cacheKey);
  }

  const promise = (async () => {
    try {
      const response = await axios.get(`${TMDB_BASE_URL}/search/person`, {
        params: { api_key: TMDB_API_KEY, query: personName }
      });

      let url = null;
      if (response.data.results.length > 0) {
        const profilePath = response.data.results[0].profile_path;
        if (profilePath) url = `https://image.tmdb.org/t/p/w185${profilePath}`;
      }

      personCache.set(cacheKey, url);
      savePersonCacheToStorage();
      return url;
    } catch (error) {
      console.error('Error fetching person photo:', error);
      return null;
    } finally {
      personInFlight.delete(cacheKey);
    }
  })();

  personInFlight.set(cacheKey, promise);
  return promise;
};

export const searchMovieRating = async (movieTitle, year, contentType = 'movie') => {
  if (!movieTitle) return null;
  const type = contentType === 'series' ? 'tv' : 'movie';
  const cacheKey = `${type}-${movieTitle}-${year || ''}`.toLowerCase();

  if (ratingCache.has(cacheKey)) {
    return ratingCache.get(cacheKey);
  }

  if (ratingInFlight.has(cacheKey)) {
    return ratingInFlight.get(cacheKey);
  }

  const promise = (async () => {
    try {
      const endpoint = type === 'tv' ? 'search/tv' : 'search/movie';
      const params = { api_key: TMDB_API_KEY, query: movieTitle };
      if (year) {
        params[type === 'tv' ? 'first_air_date_year' : 'year'] = year;
      }

      const response = await axios.get(`${TMDB_BASE_URL}/${endpoint}`, { params });
      let result = null;
      if (response.data.results.length > 0) {
        const item = response.data.results[0];
        if (typeof item.vote_average === 'number') {
          result = { rating: item.vote_average, count: item.vote_count || 0 };
        }
      }

      ratingCache.set(cacheKey, result);
      saveRatingCacheToStorage();
      return result;
    } catch (error) {
      console.error('Error fetching rating:', error);
      return null;
    } finally {
      ratingInFlight.delete(cacheKey);
    }
  })();

  ratingInFlight.set(cacheKey, promise);
  return promise;
};
