import { useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

export default function OAuthSuccess() {
  const navigate = useNavigate();
  const { fetchUser } = useContext(AuthContext);

  useEffect(() => {
    const run = async () => {
      await fetchUser();   // cookies already set by backend callback
      navigate("/");
    };

    run();
  }, []);

  return <h2>Logging you in...</h2>;
}
