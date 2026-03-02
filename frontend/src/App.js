import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { UserProvider, useUser } from './context/UserContext';
import Home from './pages/Home';
import MovieDetails from './pages/MovieDetails';
import Watchlist from './pages/Watchlist';
import Register from './pages/Register';
import Login from './pages/Login';
import Landing from './pages/Landing';
import './App.css';

function Navbar() {
  const { user, logout } = useUser();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navbar">
      <div className="nav-left">
        <Link to="/home" className="nav-link nav-brand">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/></svg>
          MovieDBX
        </Link>
        {user && (
          <Link to="/watchlist" className={`nav-link ${isActive('/watchlist') ? 'active' : ''}`}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
            {' '}Watchlist
          </Link>
        )}
      </div>

      <div className="nav-right">
        {user ? (
          <>
            <span className="user-info">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              {' '}{user.username}
            </span>
            <button onClick={logout} className="nav-btn logout-btn">
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className={`nav-link ${isActive('/login') ? 'active' : ''}`}>Login</Link>
            <Link to="/register" className="nav-btn-link">Sign Up</Link>
          </>
        )}
      </div>
    </nav>
  );
}

function Footer() {
  return (
    <footer className="app-footer">
      <div className="footer-content">
        <div className="footer-brand">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f5c518" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/></svg>
          <span>MovieDBX</span>
        </div>
        <div className="footer-links">
          <Link to="/home" className="footer-link">Browse</Link>
          <span className="footer-dot">·</span>
          <Link to="/login" className="footer-link">Sign In</Link>
          <span className="footer-dot">·</span>
          <Link to="/register" className="footer-link">Register</Link>
        </div>
        <p className="footer-copy">
          Designed & built by Al Arafat Alif · Powered by TMDB
        </p>
      </div>
    </footer>
  );
}

function AppContent() {
  const { user } = useUser();
  const location = useLocation();

  const isLandingPage = location.pathname === '/';

  const pageVariants = {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -12 }
  };

  const pageTransition = {
    type: 'tween',
    duration: 0.25,
    ease: 'easeInOut'
  };

  return (
    <div className="App">
      {!isLandingPage && <Navbar />}

      <AnimatePresence mode="wait">
        <motion.div
          key={location.pathname}
          initial="initial"
          animate="animate"
          exit="exit"
          variants={pageVariants}
          transition={pageTransition}
          style={{ flex: 1 }}
        >
          <Routes location={location}>
            <Route path="/" element={<Landing />} />
            <Route path="/home" element={<Home />} />
            <Route path="/movie/:id" element={<MovieDetails />} />
            <Route 
              path="/watchlist" 
              element={user ? <Watchlist /> : <Navigate to="/login" />} 
            />
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />
          </Routes>
        </motion.div>
      </AnimatePresence>

      {!isLandingPage && <Footer />}
    </div>
  );
}

function App() {
  return (
    <Router>
      <UserProvider>
        <AppContent />
      </UserProvider>
    </Router>
  );
}

export default App;
