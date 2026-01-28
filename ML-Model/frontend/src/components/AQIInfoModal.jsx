import React, { useState } from 'react';
import './AQIInfoModal.css';

export default function AQIInfoModal({ isOpen, onClose, aqi }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>AQI Information</h2>
        <p>Current AQI Level: {aqi}</p>
        <p>Air Quality Index (AQI) is used to communicate air quality to the public.</p>
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );
}
