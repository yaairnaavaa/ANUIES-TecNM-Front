import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { User, ApiResponse } from '../models/api.models';

export interface UserFilters {
  role?: string;
  ies?: string;
  active?: boolean;
}

@Injectable({ providedIn: 'root' })
export class UserService {
  private http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/auth`;

  /**
   * Obtener todos los usuarios (solo Admin Nacional)
   */
  getAllUsers(filters?: UserFilters): Observable<ApiResponse<User[]>> {
    let params = new HttpParams();
    
    if (filters) {
      if (filters.role) params = params.set('role', filters.role);
      if (filters.ies) params = params.set('ies', filters.ies);
      if (filters.active !== undefined) params = params.set('active', filters.active.toString());
    }

    return this.http.get<ApiResponse<User[]>>(`${this.baseUrl}/users`, { params });
  }

  /**
   * Obtener usuario por ID
   */
  getUserById(id: string): Observable<ApiResponse<User>> {
    return this.http.get<ApiResponse<User>>(`${this.baseUrl}/users/${id}`);
  }

  /**
   * Crear nuevo usuario
   */
  createUser(userData: Partial<User>): Observable<ApiResponse<User>> {
    return this.http.post<ApiResponse<User>>(`${this.baseUrl}/register`, userData);
  }

  /**
   * Actualizar usuario
   */
  updateUser(id: string, userData: Partial<User>): Observable<ApiResponse<User>> {
    return this.http.put<ApiResponse<User>>(`${this.baseUrl}/users/${id}`, userData);
  }

  /**
   * Eliminar usuario
   */
  deleteUser(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/users/${id}`);
  }

  /**
   * Activar/Desactivar usuario
   */
  toggleUserStatus(id: string, active: boolean): Observable<ApiResponse<User>> {
    return this.http.patch<ApiResponse<User>>(`${this.baseUrl}/users/${id}/status`, { active });
  }
}
