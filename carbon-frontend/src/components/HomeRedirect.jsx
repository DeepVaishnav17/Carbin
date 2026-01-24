import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

export default function HomeRedirect() {
  const { user, loading } = useContext(AuthContext);

  if (loading) return <h2>Loading...</h2>;

  if (!user) return <Navigate to="/login" />;


  if (user.role === "admin") return <Navigate to="/admin" />;
  if (!user.city) return <Navigate to="/location" />;

  return <Navigate to="/dashboard" />;
}
