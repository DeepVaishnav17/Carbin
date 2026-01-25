import React from 'react';
import { getHealthAdvice, getAQICategory } from '../../utils/aqi-utils';
import './HealthAdvisory.css';

/**
 * Health Advisory Component
 * Displays health recommendations based on AQI value
 */
const HealthAdvisory = ({ aqi }) => {
    const advice = getHealthAdvice(aqi);
    const category = getAQICategory(aqi);

    return (
        <div className="health-advisory-container">
            <h2 className="advisory-title">Health Advisory</h2>

            <div
                className="advisory-category"
                style={{
                    backgroundColor: category.darkBg,
                    borderLeftColor: category.bgColor,
                }}
            >
                <span style={{ color: category.bgColor, fontWeight: 700 }}>
                    Current Level: {category.name}
                </span>
            </div>

            <div className="advisory-cards">
                <div className="advisory-card">
                    <div className="card-header">General Population</div>
                    <p className="card-content">{advice.general}</p>
                </div>

                <div className="advisory-card">
                    <div className="card-header">Children & Elderly</div>
                    <p className="card-content">{advice.sensitive}</p>
                </div>

                <div className="advisory-card">
                    <div className="card-header">People with Asthma/Heart Conditions</div>
                    <p className="card-content">{advice.vulnerable}</p>
                </div>
            </div>
        </div>
    );
};

export default HealthAdvisory;
