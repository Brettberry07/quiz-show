"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";

interface UserContextType {
  username: string;
  userId: string | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticating: boolean;
  login: (username: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
  refreshSession: () => Promise<boolean>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5200";

const STORAGE_KEYS = {
  username: "quizsink_username",
  userId: "quizsink_user_id",
  accessToken: "quizsink_access_token",
  refreshToken: "quizsink_refresh_token",
};

export function UserProvider({ children }: { children: ReactNode }) {
  const [username, setUsernameState] = useState<string>("");
  const [userId, setUserId] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const persistSession = useCallback(
    (session: {
      username?: string;
      userId?: string | null;
      accessToken?: string | null;
      refreshToken?: string | null;
    }) => {
      if (session.username !== undefined) {
        setUsernameState(session.username);
        if (session.username) {
          localStorage.setItem(STORAGE_KEYS.username, session.username);
        } else {
          localStorage.removeItem(STORAGE_KEYS.username);
        }
      }

      if (session.userId !== undefined) {
        setUserId(session.userId || null);
        if (session.userId) {
          localStorage.setItem(STORAGE_KEYS.userId, session.userId);
        } else {
          localStorage.removeItem(STORAGE_KEYS.userId);
        }
      }

      if (session.accessToken !== undefined) {
        setAccessToken(session.accessToken || null);
        if (session.accessToken) {
          localStorage.setItem(STORAGE_KEYS.accessToken, session.accessToken);
        } else {
          localStorage.removeItem(STORAGE_KEYS.accessToken);
        }
      }

      if (session.refreshToken !== undefined) {
        setRefreshToken(session.refreshToken || null);
        if (session.refreshToken) {
          localStorage.setItem(STORAGE_KEYS.refreshToken, session.refreshToken);
        } else {
          localStorage.removeItem(STORAGE_KEYS.refreshToken);
        }
      }
    },
    []
  );

  const logout = useCallback(() => {
    persistSession({
      username: "",
      userId: null,
      accessToken: null,
      refreshToken: null,
    });
  }, [persistSession]);

  const fetchCurrentUser = useCallback(
    async (token: string) => {
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        return { ok: false } as const;
      }

      const data = await response.json();
      const userData = data?.data;

      if (userData?.username) {
        persistSession({
          username: userData.username,
          userId: userData.id,
        });
      }

      return { ok: true } as const;
    },
    [persistSession]
  );

  const refreshSession = useCallback(async () => {
    if (!refreshToken) return false;

    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!response.ok) {
      return false;
    }

    const data = await response.json();
    if (!data?.access_token) {
      return false;
    }

    persistSession({
      accessToken: data.access_token,
      refreshToken: data.refresh_token || refreshToken,
    });

    await fetchCurrentUser(data.access_token);
    return true;
  }, [fetchCurrentUser, persistSession, refreshToken]);

  const login = useCallback(
    async (usernameInput: string) => {
      if (!usernameInput.trim()) {
        return { ok: false, error: "Username is required" };
      }

      setIsAuthenticating(true);

      try {
        const response = await fetch(`${API_BASE_URL}/login`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ username: usernameInput.trim() }),
        });

        if (!response.ok) {
          const payload = await response.json().catch(() => null);
          const errorMessage = payload?.message || "Login failed";
          return { ok: false, error: errorMessage };
        }

        const payload = await response.json();

        persistSession({
          accessToken: payload.access_token,
          refreshToken: payload.refresh_token,
          userId: payload.user_id || null,
          username: usernameInput.trim(),
        });

        if (payload.access_token) {
          await fetchCurrentUser(payload.access_token);
        }

        return { ok: true };
      } catch (error) {
        return { ok: false, error: "Network error. Please try again." };
      } finally {
        setIsAuthenticating(false);
      }
    },
    [fetchCurrentUser, persistSession]
  );

  // Hydrate session from localStorage on mount
  useEffect(() => {
    const storedUsername = localStorage.getItem(STORAGE_KEYS.username) || "";
    const storedUserId = localStorage.getItem(STORAGE_KEYS.userId);
    const storedAccessToken = localStorage.getItem(STORAGE_KEYS.accessToken);
    const storedRefreshToken = localStorage.getItem(STORAGE_KEYS.refreshToken);

    setUsernameState(storedUsername);
    setUserId(storedUserId);
    setAccessToken(storedAccessToken);
    setRefreshToken(storedRefreshToken);
  }, []);

  // Validate access token or refresh on load
  useEffect(() => {
    if (!accessToken) return;

    const verify = async () => {
      const result = await fetchCurrentUser(accessToken);
      if (!result.ok) {
        const refreshed = await refreshSession();
        if (!refreshed) {
          logout();
        }
      }
    };

    void verify();
  }, [accessToken, fetchCurrentUser, logout, refreshSession]);

  return (
    <UserContext.Provider
      value={{
        username,
        userId,
        accessToken,
        refreshToken,
        isAuthenticating,
        login,
        logout,
        refreshSession,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}
