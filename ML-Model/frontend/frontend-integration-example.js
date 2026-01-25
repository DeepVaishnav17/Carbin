/**
 * Frontend Integration Example - Real-time AQI Comparison
 *
 * How to integrate the new real-time AQI calibration in your React frontend
 *
 * Usage in your component:
 * import { AQIService } from './services/aqi-service.js';
 *
 * const forecast = await AQIService.getPredictionWithCalibration('Karnataka', 'Bengaluru');
 */

class AQIService {
  static API_BASE = "http://localhost:5000";
  static CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  static cache = new Map();

  /**
   * Get 7-day forecast with automatic real-time calibration
   * Best for: Displaying simple 7-day forecast to users
   */
  static async getPredictionWithCalibration(state, area) {
    const cacheKey = `predict_${state}_${area}`;

    // Check cache
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.CACHE_DURATION) {
        console.log("Using cached prediction for", area);
        return cached.data;
      }
    }

    try {
      const response = await fetch(
        `${this.API_BASE}/predict?state=${encodeURIComponent(state)}&area=${encodeURIComponent(area)}`,
      );

      if (!response.ok) {
        throw new Error(`API returned ${response.status}`);
      }

      const data = await response.json();

      // Cache the result
      this.cache.set(cacheKey, {
        data: data,
        timestamp: Date.now(),
      });

      return data;
    } catch (error) {
      console.error("Error fetching prediction:", error);
      throw error;
    }
  }

  /**
   * Get detailed comparison between raw and adjusted predictions
   * Best for: Analytics, accuracy checking, debugging
   */
  static async getDetailedComparison(state, area) {
    try {
      const response = await fetch(
        `${this.API_BASE}/predict-with-comparison?state=${encodeURIComponent(state)}&area=${encodeURIComponent(area)}`,
      );

      if (!response.ok) {
        throw new Error(`API returned ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching comparison:", error);
      throw error;
    }
  }

  /**
   * Get current real-time AQI
   * Best for: Current air quality displays
   */
  static async getCurrentAQI(city, state = null) {
    try {
      let url = `${this.API_BASE}/realtime-aqi?city=${encodeURIComponent(city)}`;
      if (state) {
        url += `&state=${encodeURIComponent(state)}`;
      }

      const response = await fetch(url);

      if (!response.ok) {
        return null; // Return null if city not found
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching current AQI:", error);
      return null;
    }
  }

  /**
   * Get API health status
   */
  static async checkHealth() {
    try {
      const response = await fetch(`${this.API_BASE}/health`);
      return response.ok ? await response.json() : null;
    } catch (error) {
      console.error("API health check failed:", error);
      return null;
    }
  }

  /**
   * Clear cache (useful for manual refresh)
   */
  static clearCache() {
    this.cache.clear();
    console.log("API cache cleared");
  }
}

/**
 * React Component Example
 */

/* Example 1: Simple 7-Day Forecast Component
---------------------------------------------*/

import React, { useState, useEffect } from "react";

export function AQIForecastCard({ state, area }) {
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchForecast = async () => {
      try {
        const data = await AQIService.getPredictionWithCalibration(state, area);
        setForecast(data);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchForecast();
  }, [state, area]);

  if (loading) return <div className="loading">Loading forecast...</div>;
  if (error) return <div className="error">Error: {error}</div>;
  if (!forecast) return <div className="error">No data available</div>;

  return (
    <div className="forecast-card">
      <h2>
        {forecast.area}, {forecast.state}
      </h2>

      {/* Current Status */}
      {forecast.comparison_report?.has_realtime_data && (
        <div className="realtime-status">
          <p>Real-time AQI: {forecast.comparison_report.realtime_aqi}</p>
          <p>Using live calibration for accuracy</p>
        </div>
      )}

      {/* 7-Day Forecast */}
      <div className="forecast-grid">
        {forecast.forecast.map((day) => (
          <div key={day.day} className="day-card">
            <div className="day-number">Day {day.day}</div>
            <div className="aqi-value">{day.aqi}</div>
            <div className="emoji">{day.emoji}</div>
            <div className="category">{day.category}</div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="summary">
        <p>
          Average: {forecast.average_aqi} - {forecast.condition}
        </p>
      </div>
    </div>
  );
}

/* Example 2: Detailed Comparison & Accuracy Component
------------------------------------------------------*/

export function AQIPredictionAccuracy({ state, area }) {
  const [comparison, setComparison] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchComparison = async () => {
      try {
        const data = await AQIService.getDetailedComparison(state, area);
        setComparison(data);
      } catch (err) {
        console.error("Error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchComparison();
  }, [state, area]);

  if (loading) return <div>Loading comparison...</div>;
  if (!comparison) return <div>No comparison data</div>;

  if (!comparison.realtime_aqi) {
    return (
      <div className="info-box">
        <p>⚠️ Real-time data not available</p>
        <p>Using raw predictions only</p>
      </div>
    );
  }

  return (
    <div className="accuracy-comparison">
      <h3>Prediction Accuracy Analysis</h3>

      {/* Three-Way Comparison */}
      <div className="comparison-table">
        <table>
          <thead>
            <tr>
              <th>Metric</th>
              <th>Day 1 (Raw)</th>
              <th>Real-time (Actual)</th>
              <th>Day 1 (Adjusted)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>AQI Value</td>
              <td>{comparison.raw_predictions[0].aqi}</td>
              <td>{comparison.realtime_aqi}</td>
              <td>{comparison.adjusted_predictions[0].aqi}</td>
            </tr>
            <tr>
              <td>Error</td>
              <td className="error">
                {comparison.accuracy_metrics.raw_prediction_error_percent.toFixed(
                  1,
                )}
                %
              </td>
              <td>—</td>
              <td className="success">
                {comparison.accuracy_metrics.adjusted_prediction_error_percent.toFixed(
                  1,
                )}
                %
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Improvement Badge */}
      <div className="improvement-badge success">
         Accuracy Improved by{" "}
        {comparison.accuracy_metrics.improvement_percent.toFixed(0)}%
      </div>

      {/* 7-Day Comparison Charts */}
      <div className="forecast-comparison">
        <h4>7-Day Comparison</h4>
        <div className="days-grid">
          {comparison.adjusted_predictions.map((day, idx) => (
            <div key={day.day} className="day-comparison">
              <p className="day-label">Day {day.day}</p>
              <p className="raw-value" title="Raw prediction from model">
                {comparison.raw_predictions[idx].aqi}
              </p>
              <p className="adjusted-value" title="Calibrated with real-time">
                {day.aqi}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Trend Summary */}
      <div className="summary-stats">
        <div className="stat">
          <label>Trend</label>
          <value>{comparison.summary.trend}</value>
        </div>
        <div className="stat">
          <label>Best Day</label>
          <value>Day {comparison.summary.best_day}</value>
        </div>
        <div className="stat">
          <label>Worst Day</label>
          <value>Day {comparison.summary.worst_day}</value>
        </div>
      </div>

      {/* Info Note */}
      <p className="info-text">
        Model predictions are automatically calibrated using current real-time
        AQI data to account for changes since the model was trained on
        historical data.
      </p>
    </div>
  );
}

/* Example 3: Current AQI Display Component
-------------------------------------------*/

export function CurrentAQIDisplay({ city, state }) {
  const [current, setCurrent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCurrent = async () => {
      const data = await AQIService.getCurrentAQI(city, state);
      if (data?.status === "success") {
        setCurrent(data);
      }
      setLoading(false);
    };

    fetchCurrent();
    // Refresh every 30 minutes
    const interval = setInterval(fetchCurrent, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [city, state]);

  if (loading) return <div className="skeleton">Loading...</div>;
  if (!current) return null;

  return (
    <div className={`aqi-badge category-${current.category.toLowerCase()}`}>
      <span className="emoji">{current.emoji}</span>
      <div className="info">
        <div className="value">{current.aqi}</div>
        <div className="category">{current.category}</div>
      </div>
    </div>
  );
}

/* Example 4: Integration in a Dashboard
----------------------------------------*/

export function AQIDashboard({ cities }) {
  return (
    <div className="dashboard">
      <h1>Air Quality Forecast Dashboard</h1>

      {cities.map((city) => (
        <div key={`${city.state}_${city.area}`} className="city-section">
          <h2>
            {city.area}, {city.state}
          </h2>

          {/* Current AQI */}
          <CurrentAQIDisplay city={city.area} state={city.state} />

          {/* 7-Day Forecast */}
          <AQIForecastCard state={city.state} area={city.area} />

          {/* Detailed Analysis */}
          <AQIPredictionAccuracy state={city.state} area={city.area} />

          <hr />
        </div>
      ))}
    </div>
  );
}

// Usage:
// <AQIDashboard cities={[
//   { state: 'Karnataka', area: 'Bengaluru' },
//   { state: 'Maharashtra', area: 'Mumbai' }
// ]} />

/**
 * CSS Styling Examples
 */

const styles = `
.forecast-card {
  padding: 20px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background: #f9f9f9;
}

.realtime-status {
  background: #e3f2fd;
  padding: 10px;
  border-radius: 4px;
  margin-bottom: 15px;
  color: #1976d2;
  font-size: 14px;
}

.forecast-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: 10px;
  margin: 15px 0;
}

.day-card {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 10px;
  text-align: center;
}

.day-number {
  font-weight: bold;
  font-size: 12px;
  color: #666;
}

.aqi-value {
  font-size: 24px;
  font-weight: bold;
  margin: 5px 0;
}

.emoji {
  font-size: 32px;
  margin: 5px 0;
}

.category {
  font-size: 11px;
  color: #999;
}

.improvement-badge {
  display: inline-block;
  padding: 10px 15px;
  border-radius: 4px;
  margin: 10px 0;
  font-weight: bold;
}

.improvement-badge.success {
  background: #c8e6c9;
  color: #2e7d32;
}

.comparison-table {
  overflow-x: auto;
  margin: 15px 0;
}

.comparison-table table {
  width: 100%;
  border-collapse: collapse;
}

.comparison-table th,
.comparison-table td {
  padding: 10px;
  text-align: left;
  border-bottom: 1px solid #e0e0e0;
}

.comparison-table th {
  background: #f5f5f5;
  font-weight: bold;
}

.comparison-table .error {
  color: #d32f2f;
  font-weight: bold;
}

.comparison-table .success {
  color: #388e3c;
  font-weight: bold;
}

.aqi-badge {
  display: flex;
  align-items: center;
  padding: 15px;
  border-radius: 8px;
  gap: 15px;
  margin-bottom: 20px;
}

.aqi-badge .emoji {
  font-size: 48px;
}

.aqi-badge .value {
  font-size: 32px;
  font-weight: bold;
}

.aqi-badge .category {
  font-size: 14px;
}
`;

// Export for use in your project
export default AQIService;
