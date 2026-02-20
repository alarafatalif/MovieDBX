import React, { useState, useEffect, useCallback } from 'react';
import Slider from 'react-slick';
import { getTopRatedMovies } from '../services/api';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/HeroBanner.css';

const TMDB_API_KEY = process.env.REACT_APP_TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

const backdropCache = new Map();
try {
  const saved = sessionStorage.getItem('tmdb_backdrop_cache');
  if (saved) Object.entries(JSON.parse(saved)).forEach(([k, v]) => backdropCache.set(k, v));
} catch {}

const fetchBackdrop = async (title, year) => {
  const key = `${title}-${year || ''}`;
  if (backdropCache.has(key)) return backdropCache.get(key);
  try {
    const res = await axios.get(`${TMDB_BASE_URL}/search/movie`, {
      params: { api_key: TMDB_API_KEY, query: title, year }
    });
    let url = null;
    if (res.data.results.length > 0) {
      const backdrop = res.data.results[0].backdrop_path;
      if (backdrop) url = `https://image.tmdb.org/t/p/original${backdrop}`;
    }
    backdropCache.set(key, url);
    try { sessionStorage.setItem('tmdb_backdrop_cache', JSON.stringify(Object.fromEntries(backdropCache))); } catch {}
    return url;
  } catch {
    return null;
  }
};

function NextArrow({ onClick }) {
  return (
    <button className="hero-arrow hero-arrow-next" onClick={onClick} aria-label="Next">
      ›
    </button>
  );
}

function PrevArrow({ onClick }) {
  return (
    <button className="hero-arrow hero-arrow-prev" onClick={onClick} aria-label="Previous">
      ‹
    </button>
  );
}

function HeroBanner() {
  const [slides, setSlides] = useState([]);
  const navigate = useNavigate();

  const loadSlides = useCallback(async () => {
    try {
      const res = await getTopRatedMovies(6);
      const movies = res.data;

      const withBackdrops = await Promise.all(
        movies.map(async (m) => {
          const backdrop = await fetchBackdrop(m.title, m.release_year);
          return { ...m, backdrop_url: backdrop };
        })
      );

      const validSlides = withBackdrops
        .map(m => ({ ...m, display_image: m.backdrop_url || m.poster_url }))
        .filter(m => m.display_image);
      setSlides(validSlides);
    } catch (err) {
      console.error('Failed to load hero slides:', err);
    }
  }, []);

  useEffect(() => {
    loadSlides();
  }, [loadSlides]);

  if (slides.length === 0) return null;

  const settings = {
    dots: true,
    infinite: true,
    speed: 700,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 5000,
    pauseOnHover: true,
    fade: true,
    cssEase: 'ease-in-out', // CSS easing function for transitions
    nextArrow: <NextArrow />,
    prevArrow: <PrevArrow />,
    appendDots: (dots) => <ul className="hero-dots">{dots}</ul>,
    customPaging: () => <button className="hero-dot" />,
  };

  return (
    <section className="hero-banner">
      <Slider {...settings}>
        {slides.map((movie) => (
          <div key={movie.movie_id} className="hero-slide">
            <div
              className="hero-backdrop"
              style={{ backgroundImage: `url(${movie.display_image})` }}
            >
              <div className="hero-overlay" />
              <div className="hero-content">
                <h2 className="hero-title">{movie.title}</h2>
                <p className="hero-description">
                  {movie.description
                    ? movie.description.length > 180
                      ? movie.description.slice(0, 180) + '…'
                      : movie.description
                    : 'No description available.'}
                </p>
                <button
                  className="hero-details-btn"
                  onClick={() => navigate(`/movie/${movie.movie_id}`)}
                >
                  ▶ Details
                </button>
              </div>
            </div>
          </div>
        ))}
      </Slider>
    </section>
  );
}

export default HeroBanner;
