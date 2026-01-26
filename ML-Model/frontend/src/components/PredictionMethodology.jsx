import React from 'react';
import './PredictionMethodology.css';

export default function PredictionMethodology() {
  return (
    <div className="methodology">
      <h2>Prediction Methodology</h2>
      <div className="methodology-steps">
        <div className="step">
          <h3>Step 1: Data Collection</h3>
          <p>We collect air quality data from various monitoring stations.</p>
        </div>
        <div className="step">
          <h3>Step 2: Feature Engineering</h3>
          <p>Extract relevant features including PM2.5, PM10, O3, NO2, and SO2.</p>
        </div>
        <div className="step">
          <h3>Step 3: Model Training</h3>
          <p>Train Random Forest and Neural Network models on historical data.</p>
        </div>
        <div className="step">
          <h3>Step 4: Prediction</h3>
          <p>Generate AQI predictions with confidence intervals.</p>
        </div>
      </div>
    </div>
  );
}
