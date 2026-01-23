import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

export default function HomeRedirect() {
  const { user } = useContext(AuthContext);

  if (!user) return <Navigate to="/public" />;

  if (user.role === "admin") return <Navigate to="/admin" />;

  return <Navigate to="/home" />;
}
