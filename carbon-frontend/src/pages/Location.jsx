import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

export default function Location() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    city: "",
    apiCenter: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await api.post("/auth/set-location", form);
      alert(res.data.message);
      await api.get("/auth/me");  // fetch updated user
window.location.href = "/dashboard";

    } catch (err) {
      alert("Error saving location");
    }
  };

  return (
    <div style={{ padding: "40px" }}>
      <h2>Set Your Location</h2>

      <form onSubmit={handleSubmit}>
        <input
          name="city"
          placeholder="Enter your city"
          onChange={handleChange}
        />
        <br /><br />

        <input
          name="apiCenter"
          placeholder="Nearest API Center"
          onChange={handleChange}
        />
        <br /><br />

        <button type="submit">Save Location</button>
      </form>
    </div>
  );
}
