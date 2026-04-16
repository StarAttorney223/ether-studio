import { createContext, useContext, useEffect, useState } from "react";
import { api, clearAuthToken, getAuthToken, setAuthToken } from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    async function bootstrapUser() {
      const token = getAuthToken();
      if (!token) {
        setAuthLoading(false);
        return;
      }

      try {
        const response = await api.getCurrentUser();
        setUser(response.data);
      } catch {
        clearAuthToken();
        setUser(null);
      } finally {
        setAuthLoading(false);
      }
    }

    bootstrapUser();
  }, []);

  const login = async (payload) => {
    const response = await api.login(payload);
    setAuthToken(response.data.token);
    setUser(response.data.user);
    return response.data.user;
  };

  const register = async (payload) => {
    const response = await api.register(payload);
    setAuthToken(response.data.token);
    setUser(response.data.user);
    return response.data.user;
  };

  const refreshUser = async () => {
    const response = await api.getCurrentUser();
    setUser(response.data);
    return response.data;
  };

  const updateProfile = async (payload) => {
    const response = await api.updateProfile(payload);
    setUser(response.data);
    return response.data;
  };

  const logout = () => {
    clearAuthToken();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, authLoading, isAuthenticated: Boolean(user), login, register, refreshUser, updateProfile, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
