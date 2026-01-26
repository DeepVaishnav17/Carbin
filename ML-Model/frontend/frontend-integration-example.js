import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

export async function predictAQI(features) {
  const response = await axios.post($API_BASE/predict, { features });
  return response.data;
}

export function getHistoricalData() {
  return axios.get($API_BASE/historical);
}
