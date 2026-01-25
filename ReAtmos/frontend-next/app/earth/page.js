// frontend-next/app/earth/page.js
'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { getEmissionHistory } from '@/utils/api';
import Chart from '@/components/Chart';

// Dynamic import for Map to avoid SSR issues
const Map = dynamic(() => import('@/components/Map'), {
    ssr: false,
    loading: () => <div style={{ height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>Loading Map...</div>
});

export default function EarthPage() {
    const [center, setCenter] = useState([20, 0]);
    const [zoom, setZoom] = useState(3);
    const [pollutant, setPollutant] = useState('NO2');
    const [dateRange, setDateRange] = useState({
        from: new Date().toISOString().slice(0, 10),
        to: new Date().toISOString().slice(0, 10)
    });
    const [chartData, setChartData] = useState(null);

    const handleMapClick = async ({ lat, lng }) => {
        try {
            const data = await getEmissionHistory(lat, lng, pollutant, 12);
            setChartData({ data, lat, lng });
        } catch (error) {
            console.error(error);
        }
    };

    const redirectToDashboard = () => {
        const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8000";
        window.location.href = BACKEND;
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <button onClick={redirectToDashboard} style={{ position: 'absolute', top: 10, left: 10, zIndex: 1000, padding: '10px', background: 'white', border: '1px solid #ccc' }}>Go to Dashboard</button>
            {/* Map Area */}
            <div style={{ flex: 1, position: 'relative' }}>
                <Map
                    center={center}
                    zoom={zoom}
                    pollutant={pollutant}
                    dateRange={dateRange}
                    onMapClick={handleMapClick}
                />

                {/* Chart Overlay */}
                {chartData && (
                    <div style={{
                        position: 'absolute', bottom: 20, right: 20, width: 400, zIndex: 1000,
                        background: 'white', padding: '1rem', borderRadius: '8px', boxShadow: '0 0 10px rgba(0,0,0,0.5)'
                    }}>
                        <button onClick={() => setChartData(null)} style={{ float: 'right', background: 'transparent', color: 'black', border: '1px solid #ccc' }}>X</button>
                        <h4 style={{ color: 'black', margin: '0 0 1rem 0' }}>History at {chartData.lat.toFixed(2)}, {chartData.lng.toFixed(2)}</h4>
                        <Chart data={chartData.data} pollutant={pollutant} />
                    </div>
                )}
            </div>
        </div>
    );
}
