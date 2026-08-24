export class NotAuthenticatedError extends Error {
  constructor() {
    super('Not authenticated');
    this.name = 'NotAuthenticatedError';
  }
}

let _token: string | null = null;

export function getSessionToken(): string | null {
  return _token;
}

export function setSessionToken(token: string): void {
  _token = token;
}

export function clearSessionToken(): void {
  _token = null;
}
