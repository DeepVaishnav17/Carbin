import React from 'react';
import './Navbar.css';

export default function Navbar() {
  return (
    <nav className="navbar">
      <h1>ML-Model Dashboard</h1>
      <ul>
        <li>Home</li>
        <li>Predictions</li>
        <li>Analytics</li>
      </ul>
    </nav>
  );
}
