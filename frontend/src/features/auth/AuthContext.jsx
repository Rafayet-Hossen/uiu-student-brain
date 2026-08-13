import { useEffect, useState } from "react";
import { getMe, login as loginRequest } from "./api";
import { AuthContext } from "./context";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(() => Boolean(localStorage.getItem("access_token")));

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) return;
    getMe()
      .then(setUser)
      .catch(() => {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
      })
      .finally(() => setLoading(false));
  }, []);

  async function login(credentials) {
    const { access, refresh } = await loginRequest(credentials);
    localStorage.setItem("access_token", access);
    localStorage.setItem("refresh_token", refresh);
    const me = await getMe();
    setUser(me);
    return me;
  }

  function logout() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
