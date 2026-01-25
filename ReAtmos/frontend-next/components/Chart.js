'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Chart({ data, pollutant }) {
    if (!data || data.length === 0) return <div>No data available</div>;

    // Normalize data: backend might send { history: [...] } or just array
    const chartData = Array.isArray(data) ? data : (data.history || data.forecast || []);

    return (
        <div style={{ height: 300, width: '100%', background: '#fff', color: 'black', padding: '1rem', borderRadius: '8px' }}>
            <h3>{pollutant} Data</h3>
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" tick={{ fill: 'black' }} />
                    <YAxis tick={{ fill: 'black' }} />
                    <Tooltip contentStyle={{ color: 'black' }} />
                    <Line type="monotone" dataKey="value" stroke="#8884d8" strokeWidth={2} />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}
