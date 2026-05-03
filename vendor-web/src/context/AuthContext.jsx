'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { signInWithPopup, onAuthStateChanged, signOut as fbSignOut } from 'firebase/auth';
import { auth, googleProvider, initError } from '../lib/firebase';
import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [refreshToken, setRefreshToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(initError || null);

  // Exchange Firebase ID token for our backend JWT
  const exchangeToken = useCallback(async (firebaseUser) => {
    try {
      const idToken = await firebaseUser.getIdToken();
      const res = await axios.post(`${API_BASE}/auth/firebase`, { idToken });
      const { user: backendUser, accessToken: at, refreshToken: rt } = res.data;

      setUser(backendUser);
      setAccessToken(at);
      setRefreshToken(rt);
      setError(null);

      localStorage.setItem('pp_access_token', at);
      localStorage.setItem('pp_refresh_token', rt);
      localStorage.setItem('pp_user', JSON.stringify(backendUser));

      return backendUser;
    } catch (err) {
      console.error('Token exchange failed:', err);
      setError(err.response?.data?.message || 'Backend authentication failed. Is the server running?');
      // Keep Firebase user data as fallback so dashboard is accessible
      const fallbackUser = {
        name: firebaseUser.displayName,
        email: firebaseUser.email,
        photoUrl: firebaseUser.photoURL,
        role: 'user',
      };
      setUser(fallbackUser);
      return fallbackUser;
    }
  }, []);

  // Listen for Firebase auth state
  useEffect(() => {
    // If Firebase didn't initialize, just stop loading
    if (!auth) {
      setLoading(false);
      return;
    }

    // Check localStorage for persisted session
    const storedToken = localStorage.getItem('pp_access_token');
    const storedUser = localStorage.getItem('pp_user');
    if (storedToken && storedUser) {
      try {
        setUser(JSON.parse(storedUser));
        setAccessToken(storedToken);
        setRefreshToken(localStorage.getItem('pp_refresh_token'));
      } catch {}
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        await exchangeToken(firebaseUser);
      } else if (!localStorage.getItem('pp_access_token')) {
        setUser(null);
        setAccessToken(null);
        setRefreshToken(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [exchangeToken]);

  // Google Sign-In
  const signIn = useCallback(async () => {
    if (!auth || !googleProvider) {
      setError('Firebase is not configured. Please add your API key to .env.local');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      await exchangeToken(result.user);
    } catch (err) {
      console.error('Sign-in failed:', err);
      setError(err.message || 'Sign-in failed');
    } finally {
      setLoading(false);
    }
  }, [exchangeToken]);

  // Sign Out
  const signOutUser = useCallback(async () => {
    try {
      if (auth) await fbSignOut(auth);
    } catch {}
    setUser(null);
    setAccessToken(null);
    setRefreshToken(null);
    localStorage.removeItem('pp_access_token');
    localStorage.removeItem('pp_refresh_token');
    localStorage.removeItem('pp_user');
  }, []);

  // Refresh the access token
  const refreshAccessToken = useCallback(async () => {
    const rt = refreshToken || localStorage.getItem('pp_refresh_token');
    if (!rt) return null;
    try {
      const res = await axios.post(`${API_BASE}/auth/refresh`, { refreshToken: rt });
      const newAt = res.data.accessToken;
      setAccessToken(newAt);
      localStorage.setItem('pp_access_token', newAt);

      // Sync latest user data (role may have changed, e.g. user → vendor)
      if (res.data.user) {
        setUser(res.data.user);
        localStorage.setItem('pp_user', JSON.stringify(res.data.user));
      }

      return newAt;
    } catch {
      await signOutUser();
      return null;
    }
  }, [refreshToken, signOutUser]);

  const value = {
    user,
    vendor: user?.vendor || null,
    isVerified: user?.vendor?.is_verified || false,
    accessToken,
    loading,
    error,
    signIn,
    signOut: signOutUser,
    refreshAccessToken,
    firebaseReady: !!auth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
