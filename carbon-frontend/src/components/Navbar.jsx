import { Link, useNavigate } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import api from "../api/axios";

export default function Navbar() {
  const { user, setUser } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await api.get("/auth/logout");
    setUser(null);
    navigate("/");
  };

  return (
    <nav style={{ padding: "15px", borderBottom: "1px solid gray" }}>
      
      {/* Role based Home */}
      {user?.role === "admin" ? (
        <Link to="/admin">Dashboard</Link>
      ) : (
        <Link to="/">Home</Link>
      )}

      {" | "}
      <Link to="/events">Events</Link>
      {" | "}

      {user ? (
        <>
          <span>Welcome, {user.name}</span>{" | "}
          <button onClick={handleLogout}>Logout</button>
        </>
      ) : (
        <>
          <Link to="/login">Login</Link>{" | "}
          <Link to="/register">Register</Link>
        </>
      )}
    </nav>
  );
}
