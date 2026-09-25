import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check if token was passed in URL hash from OAuth callback
    if (window.location.hash.includes('token=')) {
      const match = window.location.hash.match(/token=([^&]+)/);
      if (match && match[1]) {
        localStorage.setItem('repolens_token', match[1]);
        // Clean URL hash without reloading
        window.history.replaceState(null, '', window.location.pathname);
      }
    }

    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      setLoading(true);
      const currentUser = await authService.getMe();
      setUser(currentUser);
      setError(null);
    } catch (err) {
      setUser(null);
      // Not logged in or expired token
      if (err.response?.status !== 401) {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const loginWithGitHub = () => {
    window.location.href = authService.getGitHubLoginUrl();
  };

  const loginDemo = async () => {
    try {
      setLoading(true);
      const demoUser = await authService.loginDemo();
      setUser(demoUser);
      setError(null);
      return demoUser;
    } catch (err) {
      setError(err.message || 'Demo login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } finally {
      setUser(null);
      window.location.href = '/';
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        isAuthenticated: Boolean(user),
        loginWithGitHub,
        loginDemo,
        logout,
        refreshUser: checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
