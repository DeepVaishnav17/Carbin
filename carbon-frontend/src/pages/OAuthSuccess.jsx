import { useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import api from "../api/axios";   // ✅ YOU MISSED THIS

export default function OAuthSuccess() {
  const navigate = useNavigate();
  const { fetchUser } = useContext(AuthContext);

  useEffect(() => {
    const run = async () => {
      const id = new URLSearchParams(window.location.search).get("id");

      await api.get(`/auth/set-cookie?id=${id}`);  // sets cookies on Render
      await fetchUser();                           // now /auth/me works
      navigate("/");                               // HomeRedirect runs
    };

    run();
  }, []);

  return <h2>Logging you in...</h2>;
}
