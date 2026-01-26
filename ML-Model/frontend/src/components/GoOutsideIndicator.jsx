import React from 'react';
import './GoOutsideIndicator.css';

export default function GoOutsideIndicator({ aqi }) {
  const canGoOutside = aqi < 150;
  const message = canGoOutside ? 'It is safe to go outside!' : 'It is not recommended to go outside.';

  return (
    <div className={go-outside-indicator }>
      <h3>Can I Go Outside?</h3>
      <p>{message}</p>
      <p className="aqi-value">AQI: {aqi}</p>
    </div>
  );
}
