import React, { useState } from 'react';
import Navbar from './components/Navbar';
import Home from './components/Home';
import AQIPredictorPage from './components/AQIPredictorPage';
import './App.css';

export default function App() {
  const [currentPage, setCurrentPage] = useState('home');

  return (
    <div className="app">
      <Navbar />
      {currentPage === 'home' && <Home />}
      {currentPage === 'predictor' && <AQIPredictorPage />}
    </div>
  );
}
