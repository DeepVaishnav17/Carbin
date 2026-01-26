import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import './AQILineChart.css';

export default function AQILineChart({ data }) {
  return (
    <div className="chart-container">
      <h3>AQI Trend</h3>
      <LineChart width={600} height={300} data={data}>
        <CartesianGrid />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Line type="monotone" dataKey="aqi" stroke="#3498db" />
      </LineChart>
    </div>
  );
}
