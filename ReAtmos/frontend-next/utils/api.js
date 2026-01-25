import axios from "axios";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8000";

// ✅ backend base should be: https://reatmos.onrender.com/api
const API_BASE_URL = `${BACKEND}/api`;

const client = axios.create({
    baseURL: API_BASE_URL,
});

export const resolveLocation = async (place) => {
    const response = await client.post("/location/resolve/", { place });
    return response.data;
};

export const getEmissionHistory = async (lat, lng, pollutant, months = 12) => {
    const response = await client.get("/emission/history/", {
        params: { lat, lng, pollutant, months },
    });
    return response.data;
};
