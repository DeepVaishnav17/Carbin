import { useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

export default function OAuthSuccess() {
  const { fetchUser } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      await fetchUser();  // cookies → get user
      navigate("/");
    };
    load();
  }, []);

  return <h2>Logging you in...</h2>;
}
