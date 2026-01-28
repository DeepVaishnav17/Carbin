import { useContext, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { user } = useContext(AuthContext);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (user !== undefined) {
      setChecking(false);
    }
  }, [user]);

  if (checking) return <p>Loading...</p>;

  if (!user) return <Navigate to="/login" />;

  // if (!user.city) {
  //   return <Navigate to="/location" />;
  // }

  return children;
}
