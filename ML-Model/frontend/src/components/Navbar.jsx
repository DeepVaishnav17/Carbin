import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaBars, FaTimes } from 'react-icons/fa';
import './Navbar.css';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const navItems = [
    { name: 'Home', path: '/' },
    { name: 'Events', path: '/events' },
    { name: 'Predict', path: '/aqi-predictor' }, // Assuming this is the main predictor route
    { name: 'Profile', path: '/profile' }
  ];

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo" onClick={() => setIsOpen(false)}>
          <span className="logo-re">Re</span>
          <span className="logo-atmos">Atmos</span>
        </Link>
        
        <div className="menu-icon" onClick={toggleMenu}>
          {isOpen ? <FaTimes /> : <FaBars />}
        </div>

        <ul className={isOpen ? 'nav-menu active' : 'nav-menu'}>
          {navItems.map((item, index) => (
            <li key={index} className="nav-item">
              <Link 
                to={item.path} 
                className={`nav-links ${location.pathname === item.path ? 'active-link' : ''}`}
                onClick={() => setIsOpen(false)}
              >
                {item.name}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;
