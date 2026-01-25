import { Link, NavLink, useNavigate } from "react-router-dom";
import { useContext, useState, useEffect } from "react";
import { AuthContext } from "../context/AuthContext";
import api from "../api/axios";
import "./Navbar.css";

export default function Navbar() {
  const { user, setUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [navigate]);

  // Prevent scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const handleLogout = async () => {
    await api.get("/auth/logout");
    setUser(null);
    setMobileMenuOpen(false);
    navigate("/");
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  // Determine home link based on user state
  const homeLink = user?.role === "admin" ? "/admin" : user ? "/profile" : "/";
  const homeLabel = user?.role === "admin" ? "Dashboard" : user ? "Profile" : "Home";

  return (
    <>
      <nav className="navbar">
        <div className="navbar-inner">
          {/* Logo */}
          <Link to="/" className="navbar-logo" onClick={closeMobileMenu}>
            <span className="navbar-logo-text">
              <span className="navbar-logo-re">Re</span>
              <span className="navbar-logo-atmos">Atmos</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="navbar-nav">
            <NavLink
              to="/"
              className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`}
            >
              Home
            </NavLink>
            <NavLink
              to="/events"
              className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`}
            >
              Events
            </NavLink>
            <NavLink
              to="/predict"
              className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`}
            >
              Predict
            </NavLink>
            {user && (
              <>
                <NavLink
                  to="/profile"
                  className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`}
                >
                  Profile
                </NavLink>
                {user.role === "admin" && (
                  <NavLink
                    to="/admin"
                    className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`}
                  >
                    Admin Dashboard
                  </NavLink>
                )}
              </>
            )}

            {!user && (
              <Link to="/login" className="navbar-link navbar-profile">
                Login
              </Link>
            )}
          </div>

          {/* Mobile Hamburger */}
          <button
            className={`navbar-hamburger ${mobileMenuOpen ? 'open' : ''}`}
            onClick={toggleMobileMenu}
            aria-label="Toggle menu"
          >
            <span className="navbar-hamburger-line"></span>
            <span className="navbar-hamburger-line"></span>
            <span className="navbar-hamburger-line"></span>
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      <div className={`navbar-mobile-menu ${mobileMenuOpen ? 'open' : ''}`}>
        <NavLink
          to="/"
          className={({ isActive }) => `navbar-mobile-link ${isActive ? 'active' : ''}`}
          onClick={closeMobileMenu}
        >
          Home
        </NavLink>
        <NavLink
          to="/events"
          className={({ isActive }) => `navbar-mobile-link ${isActive ? 'active' : ''}`}
          onClick={closeMobileMenu}
        >
          Events
        </NavLink>
        <NavLink
          to="/predict"
          className={({ isActive }) => `navbar-mobile-link ${isActive ? 'active' : ''}`}
          onClick={closeMobileMenu}
        >
          Predict
        </NavLink>
        {user && (
          <>
            <NavLink
              to="/profile"
              className={({ isActive }) => `navbar-mobile-link ${isActive ? 'active' : ''}`}
              onClick={closeMobileMenu}
            >
              Profile
            </NavLink>
            {user.role === "admin" && (
              <NavLink
                to="/admin"
                className={({ isActive }) => `navbar-mobile-link ${isActive ? 'active' : ''}`}
                onClick={closeMobileMenu}
              >
                Admin Dashboard
              </NavLink>
            )}
          </>
        )}

        <div className="navbar-mobile-divider"></div>

        {!user && (
          <Link
            to="/login"
            className="navbar-mobile-link"
            onClick={closeMobileMenu}
          >
            Login
          </Link>
        )}
      </div>

      {/* Spacer to prevent content from hiding under fixed navbar */}
      <div className="navbar-spacer"></div>
    </>
  );
}
