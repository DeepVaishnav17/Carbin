import { useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

export default function OAuthSuccess() {
  const navigate = useNavigate();
  const { fetchUser } = useContext(AuthContext);

  useEffect(() => {
    const run = async () => {
      // ⬇️ THIS is the magic
      await new Promise((res) => setTimeout(res, 800));

      await fetchUser();

      navigate("/");
    };

    run();
  }, []);

  return <h2>Logging you in...</h2>;
}
