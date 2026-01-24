import { useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

export default function OAuthSuccess() {
  const navigate = useNavigate();
  const { fetchUser } = useContext(AuthContext);

  useEffect(() => {
    const timer = setTimeout(async () => {
      await fetchUser();   // now cookies are ready
      navigate("/");       // HomeRedirect
    }, 900);               // <-- the magic

    return () => clearTimeout(timer);
  }, []);

  return <h2>Logging you in...</h2>;
}
