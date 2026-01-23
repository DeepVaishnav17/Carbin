import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";


export default function Login() {
  const navigate = useNavigate();
    const { fetchUser } = useContext(AuthContext);

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
    const res = await api.post("/auth/login", form);
    alert(res.data.message);

    // get user directly
    const me = await api.get("/auth/me");

    // update context after
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
        <input
          name="email"
          placeholder="Email"
          onChange={handleChange}
        />
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
    window.location.href = `${import.meta.env.VITE_API_URL.replace("/api","")}/api/auth/google`;
  }}
>
  Login with Google
</button>

      </form>
    </div>
  );
}
