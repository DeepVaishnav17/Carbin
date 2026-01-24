import { useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

export default function OAuthSuccess() {
  const { fetchUser } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    const init = async () => {
      await fetchUser();   // THIS will call /auth/me
      navigate("/");       // now HomeRedirect will work
    };
    init();
  }, []);

  return <h2>Logging you in...</h2>;
}
