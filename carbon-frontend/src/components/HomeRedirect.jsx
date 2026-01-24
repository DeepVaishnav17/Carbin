import { useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { Navigate } from "react-router-dom";


export default function HomeRedirect() {
  const { user, loading, fetchUser } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    const run = async () => {
      if (!user) {
        await fetchUser();   // 🔥 force wait for auth
      }
    };
    run();
  }, []);

  if (loading) return <h2>Loading...</h2>;

  if (!user) return <Navigate to="/login" />;

  if (user.role === "admin") return <Navigate to="/admin" />;
  if (!user.city) return <Navigate to="/location" />;

  return <Navigate to="/dashboard" />;
}
