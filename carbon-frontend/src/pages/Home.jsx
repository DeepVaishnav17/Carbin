import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

export default function Home() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      try {
        const res = await api.get("/auth/me");

        if (!res.data.city || !res.data.apiCenter) {
          navigate("/location");
          return;
        }
      } catch (err) {
        // ❗ user not logged in — do nothing
      } finally {
        setLoading(false);
      }
    };

    checkUser();
  }, []);

  if (loading) return <p>Loading...</p>;

  return <h1>Public Home Page</h1>;
}
