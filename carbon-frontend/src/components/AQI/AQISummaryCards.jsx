import React from 'react';
import { getAQICategory, formatDate, getDayName } from '../../utils/aqi-utils';
import './AQISummaryCards.css';

/**
 * AQI Summary Cards Component
 * Displays AQI values and categories for each day
 */
const AQISummaryCards = ({ data, selectedDay, onDaySelect }) => {
    return (
        <div className="aqi-cards-container">
            <h2 className="cards-title">  </h2>
            <div className="cards-grid">
                {data.map((dayData, index) => {
                    const category = getAQICategory(dayData.aqi);
                    const isSelected = index === selectedDay;

                    return (
                        <div
                            key={index}
                            className={`aqi-card ${isSelected ? 'selected' : ''}`}
                            onClick={() => onDaySelect(index)}
                        >
                            <div className="card-day">
                                <span className="day-name">{getDayName(dayData.date)}</span>
                                <span className="day-date">{formatDate(dayData.date)}</span>
                            </div>

                            <div className="card-aqi">
                                <span className="aqi-value">{dayData.aqi}</span>
                                <span className="aqi-label">AQI</span>
                            </div>

                            <div
                                className="card-category"
                                style={{
                                    backgroundColor: category.darkBg,
                                    borderLeftColor: category.bgColor,
                                }}
                            >
                                <span style={{ color: category.bgColor }}>
                                    {category.name}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default AQISummaryCards;
