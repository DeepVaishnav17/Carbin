import React from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    Legend,
    ResponsiveContainer,
    CartesianGrid,
} from 'recharts';
import { getAQICategory, formatDate } from '../../utils/aqi-utils';
import './AQILineChart.css';

/**
 * AQI Line Chart Component
 * Displays 7-day AQI predictions with bright green line
 */
const AQILineChart = ({ data, selectedDay, onDaySelect }) => {
    // Calculate dynamic Y-axis domain for better precision
    const aqiValues = data.map(d => d.aqi);
    const minAQI = Math.min(...aqiValues);
    const maxAQI = Math.max(...aqiValues);
    const range = maxAQI - minAQI;

    // Add 15% padding above and below to show better range
    const padding = Math.max(range * 0.15, 10); // Minimum 10 unit padding
    const yAxisMin = Math.max(0, minAQI - padding);
    const yAxisMax = maxAQI + padding;

    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            const category = getAQICategory(data.aqi);
            return (
                <div className="aqi-tooltip">
                    <p className="tooltip-date">{formatDate(data.date)}</p>
                    <p className="tooltip-aqi">AQI: {data.aqi}</p>
                    <p className="tooltip-category" style={{ color: category.bgColor }}>
                        {category.name}
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="aqi-chart-container">
            <h2 className="chart-title">7-Day AQI Forecast</h2>
            <ResponsiveContainer width="100%" height={400}>
                <LineChart
                    data={data}
                    margin={{ top: 5, right: 30, left: 60, bottom: 5 }}
                    onClick={(e) => {
                        if (e && e.activeLabel !== undefined) {
                            const dayIndex = data.findIndex((d) => d.day === e.activeLabel);
                            if (dayIndex !== -1) {
                                onDaySelect(dayIndex);
                            }
                        }
                    }}
                >
                    <CartesianGrid stroke="#333333" strokeDasharray="3 3" vertical={false} opacity={0.5} />
                    <XAxis
                        dataKey="day"
                        label={{ value: 'Day', position: 'bottom', offset: 10 }}
                        stroke="#999999"
                    />
                    <YAxis
                        label={{ value: 'AQI', angle: -90, position: 'left', offset: -5 }}
                        domain={[yAxisMin, yAxisMax]}
                        stroke="#999999"
                        type="number"
                        tickFormatter={(value) => {
                            // Only show integer values to avoid 499999 issue
                            return Math.round(value).toString();
                        }}
                        ticks={Math.ceil((yAxisMax - yAxisMin) / 10) > 0 ? undefined : [yAxisMin, yAxisMax]}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ paddingTop: '20px' }} />
                    <Line
                        type="monotone"
                        dataKey="aqi"
                        stroke="#2CFF05"
                        strokeWidth={3}
                        dot={{
                            fill: '#2CFF05',
                            r: 5,
                        }}
                        activeDot={{
                            r: 8,
                            fill: '#BF00FF',
                        }}
                        name="AQI"
                        cursor="pointer"
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};

export default AQILineChart;
