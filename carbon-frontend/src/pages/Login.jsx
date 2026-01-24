import { useState, useContext } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import api from "../api/axios";
import { AuthContext } from "../context/AuthContext";

export default function Login() {
  const navigate = useNavigate();
  const { fetchUser, user, loading } = useContext(AuthContext);

  // 🔥 Prevent logged-in users from seeing login page
  if (loading) return null;
  if (user) return <Navigate to="/" />;

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await api.post("/auth/login", form);

      const me = await api.get("/auth/me");
      await fetchUser();

      if (me.data.role === "admin") {
        navigate("/admin");
      } else if (!me.data.city) {
        navigate("/location");
      } else {
        navigate("/");
      }
    } catch (err) {
      alert(err.response?.data?.message || "Login failed");
    }
  };

  return (
    <div style={{ padding: "40px" }}>
      <h2>Login</h2>

      <form onSubmit={handleSubmit}>
        <input name="email" placeholder="Email" onChange={handleChange} />
        <br /><br />

        <input
          name="password"
          type="password"
          placeholder="Password"
          onChange={handleChange}
        />
        <br /><br />

        <button type="submit">Login</button>

        <button
          type="button"
          onClick={() => {
            window.location.href =
              `${import.meta.env.VITE_API_URL.replace("/api","")}/api/auth/google`;
          }}
        >
          Login with Google
        </button>
      </form>
    </div>
  );
}
