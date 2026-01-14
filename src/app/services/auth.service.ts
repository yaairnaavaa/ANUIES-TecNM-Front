import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthResponse, UserAuth } from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  // Estado de autenticación
  currentUser = signal<UserAuth | null>(null);
  isAuthenticated = signal<boolean>(false);

  private readonly TOKEN_KEY = 'anuies_token';
  private readonly USER_KEY = 'anuies_user';

  constructor() {
    this.restoreSession();
  }

  /* ============================
   * AUTH
   * ============================ */

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${environment.apiUrl}/auth/login`, { email, password })
      .pipe(
        tap((res) => {
          if (res.success && res.token && res.data) {
            this.startSession(res.token, res.data);
          }
        })
      );
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);

    this.currentUser.set(null);
    this.isAuthenticated.set(false);

    this.router.navigate(['/login']);
  }

  /* ============================
   * SESSION
   * ============================ */

  private startSession(token: string, user: UserAuth): void {
    localStorage.setItem(this.TOKEN_KEY, token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));

    this.currentUser.set(user);
    this.isAuthenticated.set(true);
  }

  private restoreSession(): void {
    const token = localStorage.getItem(this.TOKEN_KEY);
    const userStr = localStorage.getItem(this.USER_KEY);

    if (!token || !userStr) return;

    try {
      const user = JSON.parse(userStr) as UserAuth;
      this.currentUser.set(user);
      this.isAuthenticated.set(true);
    } catch {
      this.logout();
    }
  }

  /* ============================
   * HELPERS
   * ============================ */

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  getMenu() {
    return this.currentUser()?.menu ?? [];
  }

  hasRole(role: string | string[]): boolean {
    const user = this.currentUser();
    if (!user) return false;

    const roleName = user.role.name;

    return Array.isArray(role) ? role.includes(roleName) : roleName === role;
  }

  isAdmin(): boolean {
    return this.hasRole(['Admin Nacional', 'Admin IES']);
  }
}
