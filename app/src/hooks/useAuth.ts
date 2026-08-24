import { useState } from 'react';
import { clearSessionToken, getSessionToken, setSessionToken } from '../lib/auth';
import { validateToken } from '../db';

export { getSessionToken, NotAuthenticatedError } from '../lib/auth';

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!getSessionToken());

  async function login(password: string): Promise<boolean> {
    const valid = await validateToken(password);
    if (!valid) return false;
    setSessionToken(password);
    setIsAuthenticated(true);
    return true;
  }

  function logout() {
    clearSessionToken();
    setIsAuthenticated(false);
  }

  return { isAuthenticated, login, logout };
}
