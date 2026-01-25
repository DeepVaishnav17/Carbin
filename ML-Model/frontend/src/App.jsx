import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './components/Home';
import AQIPredictorPage from './components/AQIPredictorPage';
import './App.css';

/**
 * Main App Component
 * Sets up routing and layout
 */
function App() {
  return (
    <Router>
      <div className="app">
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/aqi-predictor" element={<AQIPredictorPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
