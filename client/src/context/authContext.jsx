import { useState, useEffect, createContext } from "react";
import { register, login, logout, getMe } from "../api/authAPI.jsx";

export const AuthContext = createContext();

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // FIX: must start true — we're checking auth on mount
  const [error, setError] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      const accessToken = localStorage.getItem("accessToken");
      if (!accessToken) {
        setLoading(false); 
        return;
      }
      try {
        setError(null);
        const res = await getMe();
        setUser(res.data.data);
      } catch {
        localStorage.removeItem("accessToken");
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  async function handleRegister(username, email, password) {
    setLoading(true);
    setError(null);
    try {
      await register(username, email, password);
      const loginRes = await login(email, password);
      const { loggedInUser, accessToken } = loginRes.data.data;
      localStorage.setItem("accessToken", accessToken);
      setUser(loggedInUser);
      return true;
    } catch (err) {
      setError(err.response?.data?.message || err.message);
      return false;
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin(email, password) {
    setLoading(true);
    setError(null);
    try {
      const res = await login(email, password);
      const { loggedInUser, accessToken } = res.data.data;
      localStorage.setItem("accessToken", accessToken);
      setUser(loggedInUser);
      return true;
    } catch (err) {
      setError(err.response?.data?.message || err.message);
      return false;
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    setLoading(true);
    setError(null);
    try {
      await logout();
      localStorage.removeItem("accessToken");
      setUser(null);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleGetUser() {
    setLoading(true);
    setError(null);
    try {
      const res = await getMe();
      setUser(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        handleRegister,
        handleLogin,
        handleLogout,
        handleGetUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
