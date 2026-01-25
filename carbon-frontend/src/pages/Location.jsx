import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { AuthContext } from "../context/AuthContext";
import "./Location.css";

// Location Pin Icon
const LocationIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

// Crosshair Icon for detect
const CrosshairIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="22" y1="12" x2="18" y2="12" />
    <line x1="6" y1="12" x2="2" y2="12" />
    <line x1="12" y1="6" x2="12" y2="2" />
    <line x1="12" y1="22" x2="12" y2="18" />
  </svg>
);

export default function Location() {
  const navigate = useNavigate();
  const { fetchUser } = useContext(AuthContext);

  const [form, setForm] = useState({
    city: "",
  });

  const [detecting, setDetecting] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      return;
    }

    setDetecting(true);
    setError("");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        // Try to reverse geocode to get city name
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await response.json();
          const city = data.address?.city ||
            data.address?.town ||
            data.address?.village ||
            data.address?.county ||
            data.address?.state ||
            "Unknown Location";
          setForm({ ...form, city });
        } catch {
          setError("Could not detect city. Please enter manually.");
        }

        setDetecting(false);
      },
      (err) => {
        setError("Unable to retrieve your location. Please enter manually.");
        setDetecting(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.city.trim()) {
      setError("Please enter your city");
      return;
    }

    setSubmitting(true);

    try {
      await api.post("/auth/set-location", form);
      await fetchUser(); // Refresh user context with new location
      navigate("/profile", { replace: true });
    } catch (err) {
      setError("Error saving location. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <div className="location-page">
      {/* Background Effects */}
      <div className="location-bg-effects">
        <div className="location-grid"></div>
        <div className="location-graph-lines">
          <div className="location-graph-line"></div>
          <div className="location-graph-line"></div>
          <div className="location-graph-line"></div>
          <div className="location-graph-line"></div>
        </div>
        <div className="location-particles">
          <div className="location-particle"></div>
          <div className="location-particle"></div>
          <div className="location-particle"></div>
          <div className="location-particle"></div>
          <div className="location-particle"></div>
          <div className="location-particle"></div>
        </div>
      </div>

      {/* Main Card */}
      <div className="location-card">
        {/* Logo */}
        <div className="location-logo">
          <span className="location-logo-text">
            <span className="location-logo-re">Re</span>
            <span className="location-logo-atmos">Atmos</span>
          </span>
        </div>

        {/* Icon */}
        <div className="location-icon">
          <div className="location-icon-circle">
            <LocationIcon />
          </div>
        </div>

        {/* Title */}
        <h1 className="location-title">Set Your Location</h1>

        {/* Subtitle */}
        <p className="location-subtitle">
          Enter your city to receive personalized air quality data,
          health recommendations, and nearby environmental events.
        </p>

        {/* Error */}
        {error && <div className="location-error">{error}</div>}

        {/* Form */}
        <form className="location-form" onSubmit={handleSubmit}>
          {/* Detect Location Button */}
          <button
            type="button"
            className="location-detect-btn"
            onClick={handleDetectLocation}
            disabled={detecting}
          >
            {detecting ? (
              <>
                <span className="location-spinner"></span>
                Detecting...
              </>
            ) : (
              <>
                <CrosshairIcon />
                Detect My Location
              </>
            )}
          </button>

          {/* Divider */}
          <div className="location-divider">
            <span className="location-divider-line"></span>
            <span className="location-divider-text">or enter manually</span>
            <span className="location-divider-line"></span>
          </div>

          {/* City Input */}
          <div className="location-input-group">
            <label className="location-input-label" htmlFor="city">City Name</label>
            <input
              type="text"
              id="city"
              name="city"
              className="location-input"
              placeholder="Enter your city"
              value={form.city}
              onChange={handleChange}
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="location-submit"
            disabled={submitting || !form.city.trim()}
          >
            {submitting ? "Saving..." : "Save & Continue"}
          </button>
        </form>
      </div>
    </div>
  );
}
