import { createContext, useEffect, useState } from "react";
import api from "../api/axios";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
const [loading, setLoading] = useState(true);

const fetchUser = async () => {
  try {
    const res = await api.get("/auth/me");
    setUser(res.data);
  } catch {
    setUser(null);
  } finally {
    setLoading(false);
  }
};

useEffect(() => {
  fetchUser();
}, []);


  return (
    <AuthContext.Provider value={{ user, setUser, fetchUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
