import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { API_BASE_URL } from './api.config';

export interface AuthSessionResponse {
  accessToken: string;
  accessTokenExpiresUtc: string;
  userId: string;
  username: string;
  email: string;
  role: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private static readonly sessionStorageKey = 'qm_auth_session';

  private accessToken: string | null = null;
  private user: AuthSessionResponse | null = null;

  constructor(private http: HttpClient) {
    this.restoreSessionFromStorage();
  }

  getToken(): string | null {
    return this.accessToken;
  }

  getUser(): AuthSessionResponse | null {
    return this.user;
  }

  isAuthenticated(): boolean {
    return !!this.accessToken;
  }

  isAdmin(): boolean {
    const role = this.user?.role ?? '';
    return role.toLowerCase() === 'admin';
  }

  clearSession(): void {
    this.accessToken = null;
    this.user = null;
    sessionStorage.removeItem(AuthService.sessionStorageKey);
  }

  async register(username: string, email: string, password: string): Promise<string> {
    const res = await firstValueFrom(
      this.http.post(
        `${API_BASE_URL}/api/auth/register`,
        { username, email, password },
        {
          responseType: 'text',
          withCredentials: true
        }
      )
    );

    return res;
  }

  async login(login: string, password: string): Promise<AuthSessionResponse> {
    const session = await firstValueFrom(
      this.http.post<AuthSessionResponse>(
        `${API_BASE_URL}/api/auth/login`,
        { login, password },
        { withCredentials: true }
      )
    );

    this.setSession(session);
    return session;
  }

  async googleLogin(idToken: string): Promise<AuthSessionResponse> {
    const session = await firstValueFrom(
      this.http.post<AuthSessionResponse>(
        `${API_BASE_URL}/api/auth/google/login`,
        { idToken },
        { withCredentials: true }
      )
    );

    this.setSession(session);
    return session;
  }

  async googleRegister(username: string, idToken: string): Promise<AuthSessionResponse> {
    const session = await firstValueFrom(
      this.http.post<AuthSessionResponse>(
        `${API_BASE_URL}/api/auth/google/register`,
        { username, idToken },
        { withCredentials: true }
      )
    );

    this.setSession(session);
    return session;
  }

  async refresh(): Promise<AuthSessionResponse | null> {
    try {
      const session = await firstValueFrom(
        this.http.post<AuthSessionResponse>(
          `${API_BASE_URL}/api/auth/refresh`,
          {},
          { withCredentials: true }
        )
      );

      this.setSession(session);
      return session;
    } catch {
      this.clearSession();
      return null;
    }
  }

  async logout(): Promise<void> {
    try {
      await firstValueFrom(
        this.http.post(
          `${API_BASE_URL}/api/auth/logout`,
          {},
          { withCredentials: true }
        )
      );
    } finally {
      this.clearSession();
    }
  }

  logoutClientOnly(): void {
    this.clearSession();
  }

  private setSession(session: AuthSessionResponse): void {
    this.accessToken = session.accessToken;
    this.user = session;
    sessionStorage.setItem(AuthService.sessionStorageKey, JSON.stringify(session));
  }

  private restoreSessionFromStorage(): void {
    const raw = sessionStorage.getItem(AuthService.sessionStorageKey);
    if (!raw) {
      return;
    }

    try {
      const session = JSON.parse(raw) as AuthSessionResponse;

      if (!session?.accessToken || !session?.userId) {
        sessionStorage.removeItem(AuthService.sessionStorageKey);
        return;
      }

      this.accessToken = session.accessToken;
      this.user = session;
    } catch {
      sessionStorage.removeItem(AuthService.sessionStorageKey);
    }
  }
}
