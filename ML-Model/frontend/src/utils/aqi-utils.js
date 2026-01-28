export function calculateAQICategory(aqi) {
  if (aqi <= 50) return 'Good';
  if (aqi <= 100) return 'Satisfactory';
  if (aqi <= 200) return 'Moderately Polluted';
  if (aqi <= 300) return 'Poor';
  if (aqi <= 400) return 'Very Poor';
  return 'Severe';
}

export function getColorForAQI(aqi) {
  const category = calculateAQICategory(aqi);
  const colors = {
    'Good': '#27ae60',
    'Satisfactory': '#f39c12',
    'Moderately Polluted': '#e74c3c',
    'Poor': '#c0392b',
    'Very Poor': '#8b0000',
    'Severe': '#000000'
  };
  return colors[category];
}
