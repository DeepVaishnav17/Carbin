import React, { useState } from 'react';
import './AQIPredictorPage.css';

export default function AQIPredictorPage() {
  const [prediction, setPrediction] = useState(null);

  const handlePredict = () => {
    // Call API to predict AQI
    setPrediction(65);
  };

  return (
    <div className="predictor-page">
      <h2>AQI Predictor</h2>
      <button onClick={handlePredict}>Get Prediction</button>
      {prediction && <p>Predicted AQI: {prediction}</p>}
    </div>
  );
}
