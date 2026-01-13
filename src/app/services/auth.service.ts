import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';
import { AuthResponse, User } from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  // Signals para estado de autenticación
  currentUser = signal<User | null>(null);
  isAuthenticated = signal<boolean>(false);

  private readonly TOKEN_KEY = 'anuies_token';
  private readonly USER_KEY = 'anuies_user';

  constructor() {
    // Cargar usuario desde localStorage al iniciar
    this.loadUserFromStorage();
  }

  /**
   * Registrar nuevo usuario (prospect/interesado)
   */
  register(userData: Partial<User>): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/register`, userData).pipe(
      tap(response => {
        if (response.success && response.token) {
          this.handleAuthSuccess(response);
        }
      })
    );
  }

  /**
   * Iniciar sesión
   */
  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/login`, { email, password }).pipe(
      tap(response => {
        if (response.success && response.token) {
          this.handleAuthSuccess(response);
        }
      })
    );
  }

  /**
   * Cerrar sesión
   */
  logout(): void {
    // Limpiar localStorage
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);

    // Actualizar signals
    this.currentUser.set(null);
    this.isAuthenticated.set(false);

    // Redirigir al login
    this.router.navigate(['/login']);
  }

  /**
   * Obtener perfil del usuario actual
   */
  getProfile(): Observable<AuthResponse> {
    return this.http.get<AuthResponse>(`${environment.apiUrl}/auth/me`).pipe(
      tap(response => {
        if (response.success && response.user) {
          this.currentUser.set(response.user);
          this.saveUserToStorage(response.user);
        }
      })
    );
  }

  /**
   * Actualizar perfil
   */
  updateProfile(userData: Partial<User>): Observable<AuthResponse> {
    return this.http.put<AuthResponse>(`${environment.apiUrl}/auth/updateprofile`, userData).pipe(
      tap(response => {
        if (response.success && response.user) {
          this.currentUser.set(response.user);
          this.saveUserToStorage(response.user);
        }
      })
    );
  }

  /**
   * Cambiar contraseña
   */
  changePassword(currentPassword: string, newPassword: string): Observable<AuthResponse> {
    return this.http.put<AuthResponse>(`${environment.apiUrl}/auth/changepassword`, {
      currentPassword,
      newPassword
    });
  }

  /**
   * Obtener token del localStorage
   */
  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  /**
   * Verificar si el usuario tiene un rol específico
   */
  hasRole(role: string | string[]): boolean {
    const user = this.currentUser();
    if (!user) return false;

    if (Array.isArray(role)) {
      return role.includes(user.role);
    }
    return user.role === role;
  }

  /**
   * Verificar si el usuario es admin
   */
  isAdmin(): boolean {
    return this.hasRole(['Admin Nacional', 'Admin IES']);
  }

  /**
   * Manejar autenticación exitosa
   */
  private handleAuthSuccess(response: AuthResponse): void {
    if (response.token && response.user) {
      // Guardar token
      localStorage.setItem(this.TOKEN_KEY, response.token);
      
      // Guardar usuario
      this.saveUserToStorage(response.user);
      
      // Actualizar signals
      this.currentUser.set(response.user);
      this.isAuthenticated.set(true);
    }
  }

  /**
   * Guardar usuario en localStorage
   */
  private saveUserToStorage(user: User): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  /**
   * Cargar usuario desde localStorage
   */
  private loadUserFromStorage(): void {
    const token = this.getToken();
    const userStr = localStorage.getItem(this.USER_KEY);

    if (token && userStr) {
      try {
        const user = JSON.parse(userStr) as User;
        this.currentUser.set(user);
        this.isAuthenticated.set(true);
      } catch (error) {
        console.error('Error al cargar usuario:', error);
        this.logout();
      }
    }
  }
}
