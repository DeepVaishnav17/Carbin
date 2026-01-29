import React, { useState } from 'react';
import axios from 'axios';
import AQILineChart from '../components/AQI/AQILineChart';
import AQISummaryCards from '../components/AQI/AQISummaryCards';
import HealthAdvisory from '../components/AQI/HealthAdvisory';
import AQIInfoModal from '../components/AQI/AQIInfoModal';
import { generateSampleForecast } from '../utils/aqi-utils';
import './Predict.css';

/**
 * Main AQI Predictor Page Component
 */
const Predict = () => {
    const [forecastData, setForecastData] = useState(null);
    const [selectedDay, setSelectedDay] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [state, setState] = useState('');
    const [area, setArea] = useState('');
    const [location, setLocation] = useState('');

    // Fetch forecast from backend
    const fetchForecast = async (e) => {
        e.preventDefault();

        if (!state.trim() || !area.trim()) {
            setError('Please enter both state and area');
            return;
        }

        setLoading(true);
        setError(null);
        setForecastData(null);

        try {
            // Use backend proxy instead of direct ML server call
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/ml/predict`, {
                params: {
                    state: state.trim(),
                    area: area.trim(),
                },
            });

            if (response.data.status === 'success') {
                // Add date field to forecast data for components
                const today = new Date();
                const forecastWithDates = response.data.forecast.map((item, index) => {
                    const date = new Date(today);
                    date.setDate(date.getDate() + index);
                    return {
                        ...item,
                        date: date, // Pass as Date object for proper handling
                        dateString: date.toISOString().split('T')[0],
                    };
                });
                setForecastData(forecastWithDates);
                setLocation(`${response.data.area}, ${response.data.state}`);
                setSelectedDay(0);
            } else {
                setError(response.data.message || 'Failed to fetch forecast');
            }
        } catch (err) {
            console.error("Error fetching forecast:", err);
            if (err.response?.data?.message) {
                setError(err.response.data.message);
            } else if (err.message === 'Network Error') {
                setError(`Unable to connect to the server. Make sure the Backend is running on ${import.meta.env.VITE_API_URL}`);
            } else {
                setError('Error fetching forecast. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    // Use sample data if no forecast is loaded
    const displayData = forecastData || generateSampleForecast();
    const selectedAQI = displayData[selectedDay]?.aqi || 0;
    // Only show chart and cards if we have actual forecast data from API
    const hasActualData = forecastData !== null;

    return (
        <div className="aqi-predictor-page">
            <div className="predictor-container">
                {/* Header Removed as per request */}
                {/* <div className="predictor-header">...</div> */}

                {/* Search Section */}
                <form className="search-section" onSubmit={fetchForecast}>
                    <div className="search-inputs">
                        <div className="input-group">
                            <label htmlFor="state">State / Region</label>
                            <input
                                id="state"
                                type="text"
                                placeholder="e.g., Gujarat"
                                value={state}
                                onChange={(e) => setState(e.target.value)}
                                disabled={loading}
                            />
                        </div>

                        <div className="input-group">
                            <label htmlFor="area">City / Area</label>
                            <input
                                id="area"
                                type="text"
                                placeholder="e.g., Ahmedabad"
                                value={area}
                                onChange={(e) => setArea(e.target.value)}
                                disabled={loading}
                            />
                        </div>

                        <button
                            type="submit"
                            className="search-button"
                            disabled={loading}
                        >
                            {loading ? 'Fetching...' : 'Get Forecast'}
                        </button>
                    </div>

                    {error && <div className="error-message">{error}</div>}
                </form>

                {/* Location Info */}
                {location && (
                    <div className="location-info">
                        Forecast for: <strong>{location}</strong>
                    </div>
                )}

                {/* Loading State */}
                {loading && (
                    <div className="loading-container">
                        <div className="loader"></div>
                        <p>Fetching forecast data...</p>
                    </div>
                )}

                {/* Main Content - Show ONLY if actual data is loaded or we aren't loading */}
                {hasActualData && !loading && (
                    <>
                        {/* Chart */}
                        <AQILineChart
                            data={displayData}
                            selectedDay={selectedDay}
                            onDaySelect={setSelectedDay}
                        />

                        {/* Summary Cards */}
                        <AQISummaryCards
                            data={displayData}
                            selectedDay={selectedDay}
                            onDaySelect={setSelectedDay}
                        />

                        {/* Health Advisory */}
                        <HealthAdvisory aqi={selectedAQI} />

                        {/* Info Modal */}
                        <AQIInfoModal />
                    </>
                )}


            </div>
        </div>
    );
};

export default Predict;
