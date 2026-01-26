import React from 'react';
import './AQISummaryCards.css';

export default function AQISummaryCards({ data }) {
  return (
    <div className="summary-cards">
      <div className="card">
        <h3>PM2.5</h3>
        <p>{data?.pm25 || 0}</p>
      </div>
      <div className="card">
        <h3>PM10</h3>
        <p>{data?.pm10 || 0}</p>
      </div>
    </div>
  );
}
