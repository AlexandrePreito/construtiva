"use client";

export type AppSession = {
  id: string;
  nome: string;
  loggedAt: string;
};

export const SESSION_STORAGE_KEY = "construtiva::session";

export function saveSession(session: AppSession) {
  window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
}

export function getSession(): AppSession | null {
  try {
    const raw = window.localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AppSession;
  } catch {
    return null;
  }
}

export function clearSession() {
  window.localStorage.removeItem(SESSION_STORAGE_KEY);
}

