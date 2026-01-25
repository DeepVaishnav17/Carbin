import React from 'react';
import { getGoOutsideDecision } from '../utils/aqi-utils';
import './GoOutsideIndicator.css';

/**
 * SVG Icons for decision states
 */
const IconCheck = ({ color }) => (
  <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="24" cy="24" r="22" stroke={color} strokeWidth="5"/>
    <path d="M18 24L22 28L32 18" stroke={color} strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const IconWarning = ({ color }) => (
  <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M24 4L4 42H44L24 4Z" stroke={color} strokeWidth="5" strokeLinejoin="round"/>
    <circle cx="24" cy="32" r="1.5" fill={color}/>
    <path d="M24 22V28" stroke={color} strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const IconClose = ({ color }) => (
  <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="24" cy="24" r="22" stroke={color} strokeWidth="3"/>
    <path d="M16 16L32 32M32 16L16 32" stroke={color} strokeWidth="5.5" strokeLinecap="round"/>
  </svg>
);

/**
 * Should I Go Outside Indicator Component
 * Displays decision based on current AQI
 */
const GoOutsideIndicator = ({ aqi }) => {
  const decision = getGoOutsideDecision(aqi);

  const renderIcon = () => {
    switch (decision.icon) {
      case 'check':
        return <IconCheck color={decision.color} />;
      case 'warning':
        return <IconWarning color={decision.color} />;
      case 'close':
        return <IconClose color={decision.color} />;
      default:
        return <IconCheck color={decision.color} />;
    }
  };

  return (
    <div className="go-outside-container">
      <div
        className="decision-card"
        style={{
          borderColor: decision.color,
          backgroundColor: `${decision.color}15`,
        }}
      >
        <div className="decision-icon" style={{ color: decision.color }}>
          {renderIcon()}
        </div>

        <div className="decision-status" style={{ color: decision.color }}>
          {decision.status}
        </div>

        <div className="decision-advice">{decision.advice}</div>
      </div>
    </div>
  );
};

export default GoOutsideIndicator;
