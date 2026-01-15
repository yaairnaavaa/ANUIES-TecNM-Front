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

  private readonly MENU_KEY = 'anuies_menu';
  private readonly ROLE_KEY = 'anuies_role';

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
          if (res.success && res.data) {
            this.startSession(res.data);
          }
        })
      );
  }

  logout(): void {
    // Llamar al backend para limpiar la cookie
    this.http.post(`${environment.apiUrl}/auth/logout`, {}).subscribe({
      next: () => {
        this.clearSession();
      },
      error: () => {
        // Aunque falle, limpiar la sesión local
        this.clearSession();
      }
    });
  }

  private clearSession(): void {
    localStorage.removeItem(this.MENU_KEY);
    localStorage.removeItem(this.ROLE_KEY);

    this.currentUser.set(null);
    this.isAuthenticated.set(false);

    this.router.navigate(['/login']);
  }

  /* ============================
   * SESSION
   * ============================ */

  private startSession(user: UserAuth): void {
    // Solo guardar menú y rol en localStorage
    localStorage.setItem(this.MENU_KEY, JSON.stringify(user.menu));
    localStorage.setItem(this.ROLE_KEY, JSON.stringify(user.role));

    this.currentUser.set(user);
    this.isAuthenticated.set(true);
  }

  private restoreSession(): void {
    const menuStr = localStorage.getItem(this.MENU_KEY);
    const roleStr = localStorage.getItem(this.ROLE_KEY);

    if (!menuStr || !roleStr) return;

    try {
      const menu = JSON.parse(menuStr);
      const role = JSON.parse(roleStr);

      // Verificar la sesión con el backend (la cookie se envía automáticamente)
      this.http.get<{ success: boolean; data: UserAuth }>(`${environment.apiUrl}/auth/me`)
        .subscribe({
          next: (response) => {
            if (response.success && response.data) {
              this.currentUser.set(response.data);
              this.isAuthenticated.set(true);
            } else {
              this.clearSession();
            }
          },
          error: () => {
            this.clearSession();
          }
        });
    } catch {
      this.clearSession();
    }
  }

  /* ============================
   * HELPERS
   * ============================ */

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
