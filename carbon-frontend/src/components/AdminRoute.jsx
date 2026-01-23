import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

export default function AdminRoute({ children }) {
  const { user } = useContext(AuthContext);

  if (!user) return <Navigate to="/login" />;

  if (user.role !== "admin") return <Navigate to="/" />;

  return children;
}
