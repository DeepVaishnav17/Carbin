'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Icon fix
// We need to delete the default icon config and re-assign? 
// Or just imports. 
// Next.js with Leaflet icons can be tricky. Using CDN for simplicity or just ignoring marker if we don't use it much.
// But we need a marker for the click.

const icon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = icon;


const MapController = ({ center, zoom }) => {
    const map = useMap();
    useEffect(() => {
        map.setView(center, zoom);
    }, [center, zoom, map]);
    return null;
};

const ClickHandler = ({ onClick }) => {
    useMapEvents({
        click: (e) => {
            onClick(e.latlng);
        }
    });
    return null;
};

export default function Map({ center, zoom, pollutant, dateRange, onMapClick }) {
    // Tile URL
    const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8000";

    const tileUrl = `${baseUrl}/api/map/tiles/{z}/{x}/{y}/?pollutant=${pollutant}&from=${dateRange.from}&to=${dateRange.to}`;

    return (
        <MapContainer center={center} zoom={zoom} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
            <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; OpenStreetMap contributors'
            />
            <TileLayer
                key={`${pollutant}-${dateRange.from}-${dateRange.to}`}
                url={tileUrl}
                opacity={0.7}
            />
            <MapController center={center} zoom={zoom} />
            <ClickHandler onClick={onMapClick} />
        </MapContainer>
    );
}
