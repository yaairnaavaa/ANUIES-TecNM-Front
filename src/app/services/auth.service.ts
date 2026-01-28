import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthResponse, UserAuth } from '../models/api.models';
import { computed } from '@angular/core';
@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  // Estado de autenticación
  currentUser = signal<UserAuth | null>(null);
  isAuthenticated = signal<boolean>(false);

  // Control de inicialización de sesión con Promise
  private sessionInitPromise: Promise<boolean>;
  private sessionInitResolve?: (value: boolean) => void;

  private readonly MENU_KEY = 'anuies_menu';
  private readonly ROLE_KEY = 'anuies_role';
  private readonly USER_INFO_KEY = 'anuies_user_info';
  private readonly IES_ID_KEY = 'anuies_ies_id'; // Nueva constante

  menu = computed(() => this.currentUser()?.menu ?? []);

  constructor() {
    // Crear nueva promesa en cada construcción
    this.sessionInitPromise = new Promise<boolean>((resolve) => {
      this.sessionInitResolve = resolve;
    });
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
        }),
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
      },
    });
  }

  private clearSession(): void {
    localStorage.removeItem(this.ROLE_KEY);
    localStorage.removeItem(this.USER_INFO_KEY);
    localStorage.removeItem(this.IES_ID_KEY);

    this.currentUser.set(null);
    this.isAuthenticated.set(false);

    this.router.navigate(['/login']);
  }

  /* ============================
   * SESSION
   * ============================ */

  private startSession(user: UserAuth): void {
    // Extraemos el ID de la IES (usando tu lógica de computed)
    const iesId = (user.ies as any)?.id ?? (user.ies as any)?._id ?? null;

    // Guardar rol e info básica del usuario en localStorage
    localStorage.setItem(this.ROLE_KEY, JSON.stringify(user.role));
    localStorage.setItem(
      this.USER_INFO_KEY,
      JSON.stringify({
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        secondLastName: user.secondLastName,
        email: user.email,
        ies: user.ies,
      }),
    );

    // Guardar iesId si existe
    if (iesId) {
      localStorage.setItem(this.IES_ID_KEY, iesId.toString());
    }

    this.currentUser.set(user);
    this.isAuthenticated.set(true);
  }

  private restoreSession(): void {
    const roleStr = localStorage.getItem(this.ROLE_KEY);
    const userInfoStr = localStorage.getItem(this.USER_INFO_KEY);

    if (!roleStr || !userInfoStr) {
      // No hay datos de sesión guardados
      this.sessionInitResolve?.(false);
      return;
    }

    try {
      const role = JSON.parse(roleStr);
      const userInfo = JSON.parse(userInfoStr);

      // Setear autenticado inmediatamente con datos de localStorage
      this.isAuthenticated.set(true);

      // Crear usuario con datos de localStorage
      const restoredUser: UserAuth = {
        ...userInfo,
        role: role,
      };
      this.currentUser.set(restoredUser);

      // Verificar la sesión con el backend y obtener datos completos
      this.http
        .get<{ success: boolean; data: UserAuth }>(`${environment.apiUrl}/auth/me`, {
          withCredentials: true,
        })
        .subscribe({
          next: (response) => {
            if (response.success && response.data) {
              // Actualizar con datos completos del backend
              this.currentUser.set(response.data);

              // Lógica para extraer y guardar el IES ID fresco
              const newIesId =
                (response.data.ies as any)?.id ?? (response.data.ies as any)?._id ?? null;
              if (newIesId) {
                localStorage.setItem(this.IES_ID_KEY, newIesId.toString());
              }
              // Actualizar localStorage con datos frescos
              localStorage.setItem(this.ROLE_KEY, JSON.stringify(response.data.role));
              localStorage.setItem(
                this.USER_INFO_KEY,
                JSON.stringify({
                  id: response.data.id,
                  firstName: response.data.firstName,
                  lastName: response.data.lastName,
                  secondLastName: response.data.secondLastName,
                  email: response.data.email,
                }),
              );
              this.isAuthenticated.set(true);
              this.sessionInitResolve?.(true);
            } else {
              this.clearSessionSilently();
              this.sessionInitResolve?.(false);
            }
          },
          error: () => {
            this.clearSessionSilently();
            this.sessionInitResolve?.(false);
          },
        });
    } catch {
      this.clearSessionSilently();
      this.sessionInitResolve?.(false);
    }
  }

  private clearSessionSilently(): void {
    localStorage.removeItem(this.MENU_KEY);
    localStorage.removeItem(this.ROLE_KEY);
    localStorage.removeItem(this.USER_INFO_KEY);
    localStorage.removeItem(this.IES_ID_KEY);
    this.currentUser.set(null);
    this.isAuthenticated.set(false);
  }

  /**
   * Espera a que la sesión se inicialice (útil para guards)
   */
  async waitForSessionInit(): Promise<boolean> {
    await this.sessionInitPromise;
    return this.isAuthenticated();
  }

  /* ============================
   * HELPERS
   * ============================ */

  getMenu() {
    return this.currentUser()?.menu ?? [];
  }

  getStoredIesId(): string {
    return localStorage.getItem('anuies_ies_id') || '';
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
