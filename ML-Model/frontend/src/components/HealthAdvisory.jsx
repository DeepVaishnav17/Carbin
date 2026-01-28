import React from 'react';
import './HealthAdvisory.css';

export default function HealthAdvisory({ aqi }) {
  const getAdvisory = (aqi) => {
    if (aqi <= 50) return 'Air quality is satisfactory';
    if (aqi <= 100) return 'Acceptable quality, but some pollutants may be a concern';
    return 'Unhealthy - Consider limiting outdoor activities';
  };

  return (
    <div className="health-advisory">
      <h3>Health Advisory</h3>
      <p>{getAdvisory(aqi)}</p>
    </div>
  );
}
