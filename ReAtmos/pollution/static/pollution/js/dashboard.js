// ============================
// ✅ BACKEND BASE URL (Render)
// ============================
const BACKEND_URL = "https://reatmos.onrender.com";

// Init Map (Focus on India)
const map = L.map("map").setView([20.5937, 78.9629], 5);

// Base Layer (Light)
L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
  subdomains: "abcd",
  maxZoom: 19,
}).addTo(map);

// ✅ DB markers LayerGroup
const dbMarkersLayer = L.layerGroup().addTo(map);

// ✅ File markers LayerGroup
const fileMarkersLayer = L.layerGroup().addTo(map);

// ----------------------------
// helpers
// ----------------------------
function safeText(v, fallback = "-") {
  if (v === null || v === undefined || v === "") return fallback;
  return String(v);
}

// ----------------------------
// AQI helpers
// ----------------------------
function getAQIClass(avg) {
  const aqi = Number(avg);
  if (Number.isNaN(aqi)) return "aqi-moderate";
  if (aqi <= 50) return "aqi-good";
  if (aqi <= 100) return "aqi-moderate";
  return "aqi-unhealthy";
}

function createAQIIcon(avgAqi) {
  const cls = getAQIClass(avgAqi);

  return L.divIcon({
    className: "",
    html: `<div class="aqi-marker ${cls}"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });
}

// ----------------------------
// Sidebar Selected Info render
// ----------------------------
function renderSelectedInfo(payload) {
  const box = document.getElementById("selected-info");

  const name = safeText(payload.name, "Unknown Location");
  const state = safeText(payload.state, "-");
  const lat = payload.lat;
  const lng = payload.lng;
  const avgAqi = payload.avgAqi;

  const cls = getAQIClass(avgAqi);
  const avgAqiText =
    avgAqi === null || avgAqi === undefined || avgAqi === ""
      ? "-"
      : Number(avgAqi).toFixed(0);

  box.innerHTML = `
    <div class="badge">
      <span style="opacity:.75">📍</span>
      <span>${name}</span>
    </div>

    <div class="info-row">
      <div class="info-key">State</div>
      <div class="info-val">${state}</div>
    </div>

    <div class="info-row">
      <div class="info-key">Coordinates</div>
      <div class="info-val">${Number(lat).toFixed(5)}, ${Number(lng).toFixed(5)}</div>
    </div>

    <div class="aqi-pill ${cls}">
      <span class="aqi-dot"></span>
      <span>Average AQI: ${avgAqiText}</span>
    </div>

    ${
      payload.source
        ? `<div class="info-row">
            <div class="info-key">Source</div>
            <div class="info-val">${safeText(payload.source)}</div>
          </div>`
        : ""
    }
  `;
}

// ----------------------------
// Load MongoDB markers (Render)
// ----------------------------
async function loadDBMarkers() {
  try {
    const res = await fetch(`${BACKEND_URL}/map/mongo/users-apicenters/`);
    const data = await res.json();

    dbMarkersLayer.clearLayers();

    if (!data.results || data.results.length === 0) return;

    data.results.forEach((u) => {
      const latNum = Number(u.lat);
      const lngNum = Number(u.lng);

      if (Number.isNaN(latNum) || Number.isNaN(lngNum)) return;

      const name = u.apiCenterName || u.user_name || "DB Location";
      const avgAqi = u.average_aqi ?? "-";

      const marker = L.marker([latNum, lngNum]).addTo(dbMarkersLayer);

      marker.bindPopup(`
        <b>${safeText(name)}</b><br/>
        <b>Lat:</b> ${latNum.toFixed(5)}<br/>
        <b>Lng:</b> ${lngNum.toFixed(5)}<br/>
        <b>Average AQI:</b> ${safeText(avgAqi)}
      `);

      marker.on("click", () => {
        marker.openPopup();

        renderSelectedInfo({
          name: name,
          state: "-",
          lat: latNum,
          lng: lngNum,
          avgAqi: avgAqi,
          source: "MongoDB (Render)",
        });
      });
    });
  } catch (err) {
    console.error("DB marker load error:", err);
  }
}

// ----------------------------
// Load File markers (Render)
// ----------------------------
async function loadFileMarkers() {
  try {
    const res = await fetch(
      `${BACKEND_URL}/static/pollution/predictions_200_spread.json`
    );
    const data = await res.json();

    fileMarkersLayer.clearLayers();

    if (!Array.isArray(data) || data.length === 0) return;

    data.forEach((item) => {
      const lat = Number(item.lat);
      const lng = Number(item.lng);
      const avgAqi = item?.response?.data?.average_aqi;

      if (Number.isNaN(lat) || Number.isNaN(lng)) return;

      const areaName = item.area || "Unknown Area";
      const stateName = item.state || "-";

      const marker = L.marker([lat, lng], {
        icon: createAQIIcon(avgAqi),
      }).addTo(fileMarkersLayer);

      marker.bindPopup(`
        <b>${safeText(areaName)}</b><br/>
        <b>State:</b> ${safeText(stateName)}<br/>
        <b>Lat:</b> ${lat.toFixed(5)}<br/>
        <b>Lng:</b> ${lng.toFixed(5)}<br/>
        <b>Average AQI:</b> ${safeText(avgAqi)}
      `);

      marker.on("click", () => {
        marker.openPopup();

        renderSelectedInfo({
          name: areaName,
          state: stateName,
          lat: lat,
          lng: lng,
          avgAqi: avgAqi ?? "-",
          source: "Static JSON (Render)",
        });
      });
    });
  } catch (err) {
    console.error("File marker load error:", err);
  }
}

// ----------------------------
// Mouse Move Event for coords
// ----------------------------
map.on("mousemove", function (e) {
  const { lat, lng } = e.latlng;
  const coordText = `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`;

  document.getElementById("sidebar-coords").innerText = coordText;
  document.getElementById("map-coords").innerText = coordText;
});

// ----------------------------
// Auto load markers on page load
// ----------------------------
loadFileMarkers();
loadDBMarkers();
