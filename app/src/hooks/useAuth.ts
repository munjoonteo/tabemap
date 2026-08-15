import { useState } from 'react';
import { SESSION_KEY, getSessionToken } from '../lib/auth';

export { getSessionToken, NotAuthenticatedError } from '../lib/auth';

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!getSessionToken());

  function login(password: string) {
    sessionStorage.setItem(SESSION_KEY, password);
    setIsAuthenticated(true);
  }

  function logout() {
    sessionStorage.removeItem(SESSION_KEY);
    setIsAuthenticated(false);
  }

  return { isAuthenticated, login, logout };
}
