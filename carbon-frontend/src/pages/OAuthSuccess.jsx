import { useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

export default function OAuthSuccess() {
  const navigate = useNavigate();
  const { fetchUser } = useContext(AuthContext);

  useEffect(() => {
    const run = async () => {
      await fetchUser();       // 🔥 this is what was missing
      navigate("/");           // go to HomeRedirect
    };

    run();
  }, []);

  return <h2>Logging you in...</h2>;
}
