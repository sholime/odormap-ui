// Talking to the OdorMap API.
//
// After logging in, the API gives two tokens (see odormap-api/src/services/tokens.ts):
// - an access token, sent with every request, valid for 15 minutes;
// - a refresh token, used to get new tokens when the access token runs out.
// Both are kept in the browser's localStorage, so the person stays logged in.

import type {
  Area,
  AuthTokens,
  CreateReportRequest,
  Language,
  OdorReport,
  RegisterRequest,
  User,
} from '@odormap/common';

const API_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:3000') + '/api/v1';
const TOKENS_KEY = 'odormap.tokens';

/** An error answer from the API, e.g. 401 for a wrong password. */
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

// ---------------------------------------------------------------------------
// Tokens
// ---------------------------------------------------------------------------

function readTokens(): AuthTokens | undefined {
  const saved = localStorage.getItem(TOKENS_KEY);
  return saved ? (JSON.parse(saved) as AuthTokens) : undefined;
}

function saveTokens(tokens: AuthTokens): void {
  localStorage.setItem(TOKENS_KEY, JSON.stringify(tokens));
}

export function isLoggedIn(): boolean {
  return readTokens() !== undefined;
}

export function logOut(): void {
  localStorage.removeItem(TOKENS_KEY);
}

// ---------------------------------------------------------------------------
// Requests
// ---------------------------------------------------------------------------

/**
 * Sends a request and returns the answer as JSON.
 * If the access token has run out, it gets new tokens once and tries again.
 */
async function send<T>(method: string, path: string, body?: unknown, canRefresh = true): Promise<T> {
  const tokens = readTokens();
  const headers: Record<string, string> = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (tokens) headers['Authorization'] = `Bearer ${tokens.accessToken}`;

  const response = await fetch(API_URL + path, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (response.status === 401 && tokens && canRefresh) {
    await refreshTokens(tokens.refreshToken);
    return send<T>(method, path, body, false);
  }
  if (!response.ok) {
    // The API answers errors as { "error": "..." }.
    const answer = (await response.json().catch(() => ({}))) as { error?: string };
    throw new ApiError(response.status, answer.error ?? response.statusText);
  }
  // 204 means "done, nothing to send back".
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

async function refreshTokens(refreshToken: string): Promise<void> {
  const response = await fetch(`${API_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });
  if (!response.ok) {
    // The refresh token has run out too: the person has to log in again.
    logOut();
    throw new ApiError(401, 'Session expired');
  }
  saveTokens((await response.json()) as AuthTokens);
}

/**
 * Login requests save the tokens they get back.
 * They are sent with the current (guest) token, so the API can keep a guest's reports.
 */
async function logInWith(path: string, body: unknown): Promise<void> {
  saveTokens(await send<AuthTokens>('POST', path, body, false));
}

// ---------------------------------------------------------------------------
// Endpoints
// ---------------------------------------------------------------------------

export const api = {
  continueAsGuest: (language: Language) => logInWith('/auth/guest', { language, acceptPrivacy: true }),

  register: (details: RegisterRequest) => logInWith('/auth/register', details),

  logIn: (email: string, password: string) => logInWith('/auth/login', { email, password }),

  logInWithGoogle: (idToken: string, language: Language, acceptPrivacy: boolean) =>
    logInWith('/auth/google', { idToken, language, acceptPrivacy }),

  me: () => send<User>('GET', '/me'),

  /** Deletes the account (its reports stay, unlinked), then forgets the login. */
  deleteAccount: async () => {
    await send<void>('DELETE', '/me');
    logOut();
  },

  areas: () => send<Area[]>('GET', '/areas'),

  sendReport: (report: CreateReportRequest) => send<OdorReport>('POST', '/reports', report),

  /** The last 50 reports of the logged-in person, newest first. */
  myReports: () => send<OdorReport[]>('GET', '/reports/mine'),
};
