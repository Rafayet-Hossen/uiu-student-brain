import { useEffect, useState } from "react";
import { getMe, login as loginRequest } from "./api";
import { AuthContext } from "./context";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(() =>
    Boolean(localStorage.getItem("access_token")),
  );

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
    const data = await loginRequest(credentials);
    const { access, refresh, user } = data;
    localStorage.setItem("access_token", access);
    localStorage.setItem("refresh_token", refresh);
    const me = user || (await getMe());
    setUser(me);
    return me;
  }

  function updateUser(updatedUser) {
    setUser((prev) => (prev ? { ...prev, ...updatedUser } : updatedUser));
  }

  function logout() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}
