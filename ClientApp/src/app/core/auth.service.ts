import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

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
  private accessToken: string | null = null;
  private user: AuthSessionResponse | null = null;

  constructor(private http: HttpClient) {}

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
  }

  async register(username: string, email: string, password: string): Promise<string> {
    const res = await firstValueFrom(
      this.http.post('/api/auth/register', { username, email, password }, { responseType: 'text' })
    );
    return res;
  }

  async login(login: string, password: string): Promise<AuthSessionResponse> {
    const session = await firstValueFrom(
      this.http.post<AuthSessionResponse>('/api/auth/login', { login, password })
    );

    this.accessToken = session.accessToken;
    this.user = session;
    return session;
  }

  async refresh(): Promise<AuthSessionResponse | null> {
    try {
      const session = await firstValueFrom(
        this.http.post<AuthSessionResponse>('/api/auth/refresh', {})
      );
      this.accessToken = session.accessToken;
      this.user = session;
      return session;
    } catch {
      this.clearSession();
      return null;
    }
  }

  logoutClientOnly(): void {
    this.clearSession();
  }
}
