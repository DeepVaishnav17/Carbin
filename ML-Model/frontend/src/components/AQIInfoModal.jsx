import React, { useState, useRef } from 'react';
import './AQIInfoModal.css';
import PredictionMethodology from './PredictionMethodology';

/**
 * AQI Info Modal Component
 * Collapsible section explaining AQI, categories, and pollutants
 */
const AQIInfoModal = () => {
  const [isOpen, setIsOpen] = useState(true);
  const [showMethodology, setShowMethodology] = useState(false);
  const containerRef = useRef(null);

  const pollutants = [
    {
      name: 'PM2.5',
      description: 'Fine particulate matter (2.5 microns). Inhalable particles causing respiratory issues.',
    },
    {
      name: 'PM10',
      description: 'Coarse particulate matter (10 microns). Can affect the lower respiratory tract.',
    },
    {
      name: 'NO₂',
      description: 'Nitrogen dioxide. Harmful gas affecting lungs and respiratory system.',
    },
    {
      name: 'SO₂',
      description: 'Sulfur dioxide. Can aggravate asthma and other respiratory diseases.',
    },
    {
      name: 'O₃',
      description: 'Ozone. Ground-level ozone affects respiratory and cardiovascular health.',
    },
  ];

  return (
    <div className="aqi-info-container" ref={containerRef}>
      <button
        className="info-toggle"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="toggle-icon">{isOpen ? '−' : '+'}</span>
        <span className="toggle-text">Learn About AQI</span>
      </button>

      {isOpen && (
        <div className="info-content">
          <section className="info-section">
            <h3 className="section-title">What is AQI?</h3>
            <p className="section-text">
              The Air Quality Index (AQI) is a standardized numerical scale used to communicate how polluted
              the air is. The AQI ranges from 0 to 500, where a higher value indicates worse air quality and
              greater health concerns.
            </p>
          </section>

          <section className="info-section">
            <h3 className="section-title">AQI Categories</h3>
            <div className="categories-grid">
              <div className="category-info">
                <span className="category-badge" style={{ backgroundColor: '#1db854' }}>0–50</span>
                <span>Good</span>
              </div>
              <div className="category-info">
                <span className="category-badge" style={{ backgroundColor: '#7cb342' }}>51–100</span>
                <span>Moderate</span>
              </div>
              <div className="category-info">
                <span className="category-badge" style={{ backgroundColor: '#fdd835' }}>101–150</span>
                <span>Unhealthy for Sensitive</span>
              </div>
              <div className="category-info">
                <span className="category-badge" style={{ backgroundColor: '#fb8c00' }}>151–200</span>
                <span>Unhealthy</span>
              </div>
              <div className="category-info">
                <span className="category-badge" style={{ backgroundColor: '#e53935' }}>201–300</span>
                <span>Very Unhealthy</span>
              </div>
              <div className="category-info">
                <span className="category-badge" style={{ backgroundColor: '#6a1b9a' }}>301–500</span>
                <span>Hazardous</span>
              </div>
            </div>
          </section>

          <section className="info-section">
            <h3 className="section-title">Main Pollutants</h3>
            <div className="pollutants-list">
              {pollutants.map((pollutant, index) => (
                <div key={index} className="pollutant-item">
                  <span className="pollutant-name">{pollutant.name}</span>
                  <p className="pollutant-desc">{pollutant.description}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="info-section">
            <h3 className="section-title">How Predictions Work</h3>
            <p className="section-text">
              This AQI prediction system uses an advanced <strong>LSTM (Long Short-Term Memory)</strong> neural network architecture trained on historical air quality data. The model analyzes temporal patterns from the past 30 days of AQI measurements to forecast the next 7 days with high accuracy.
            </p>
            <p className="section-text" style={{ marginTop: '12px' }}>
              <strong>Technical Implementation:</strong> The LSTM model captures complex dependencies in air quality trends, considering factors like seasonal patterns, daily cycles, and external influences. It is calibrated using exponential decay adjustment with a formula: <code>adjustment = deviation × e^(-i×0.3) × 0.7</code>, where deviations from real-time API data are progressively reduced across forecast days for improved accuracy.
            </p>
            <p className="section-text" style={{ marginTop: '12px' }}>
              <strong>Real-time Comparison:</strong> The system compares predictions with actual AQI data from the WAQI (World Air Quality Index) API to ensure calibration accuracy and provides adjusted forecasts that account for model drift over time.
            </p>
            <button 
              className="learn-more-button"
              onClick={() => setShowMethodology(true)}
            >
              Learn More About Our Methodology →
            </button>
          </section>

          <section className="info-section disclaimer">
            <p className="disclaimer-text">
              <span className="disclaimer-word">Disclaimer</span>: These predictions are estimates generated by machine learning models trained on historical air quality data. They provide forecast trends but may not match actual AQI values due to unpredictable environmental factors, sudden pollution events, or seasonal anomalies. The system uses real-time WAQI API data for continuous calibration to improve accuracy. However, predictions are most reliable for general trend analysis rather than precise point forecasts. For critical health decisions, air quality alerts, or urgent respiratory concerns, always consult official environmental agencies (like CPCB in India), local air quality monitoring networks, and health professionals. Never rely solely on these predictions for medical emergencies or severe air quality events.
            </p>
          </section>
        </div>
      )}

      <PredictionMethodology 
        isOpen={showMethodology} 
        onClose={() => setShowMethodology(false)} 
      />
    </div>
  );
};

export default AQIInfoModal;
