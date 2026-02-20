import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
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

  return (
    <nav className="navbar">
      <div className="nav-left">
        <Link to="/home" className="nav-link nav-brand">
          🎬 MovieDBX
        </Link>
        {user && (
          <Link to="/watchlist" className="nav-link">
            📌 Watchlist
          </Link>
        )}
      </div>

      <div className="nav-right">
        {user ? (
          <>
            <span className="user-info">👤 {user.username}</span>
            <button onClick={logout} className="nav-btn">
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="nav-link">Login</Link>
            <Link to="/register" className="nav-btn-link">Sign Up</Link>
          </>
        )}
      </div>
    </nav>
  );
}

function AppContent() {
  const { user } = useUser();
  const location = useLocation();

  const isLandingPage = location.pathname === '/';

  return (
    <div className="App">
      {!isLandingPage && <Navbar />}

      <Routes>
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
