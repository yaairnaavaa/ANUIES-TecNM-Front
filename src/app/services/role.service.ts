import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Role, ApiResponse } from '../models/api.models';

export interface MenuPermission {
  _id: string;
  label: string;
  icon: string;
  routerLink: string;
  category: string;
  active: boolean;
}

@Injectable({ providedIn: 'root' })
export class RoleService {
  private http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/roles`;
  private readonly permissionsUrl = `${environment.apiUrl}/menupermissions`;

  /**
   * Obtener todos los roles
   */
  getAllRoles(): Observable<ApiResponse<Role[]>> {
    return this.http.get<ApiResponse<Role[]>>(`${this.baseUrl}`);
  }

  /**
   * Obtener rol por ID
   */
  getRoleById(id: string): Observable<ApiResponse<Role>> {
    return this.http.get<ApiResponse<Role>>(`${this.baseUrl}/${id}`);
  }

  /**
   * Crear nuevo rol
   */
  createRole(role: Partial<Role>): Observable<ApiResponse<Role>> {
    return this.http.post<ApiResponse<Role>>(`${this.baseUrl}`, role);
  }

  /**
   * Actualizar rol existente
   */
  updateRole(id: string, role: Partial<Role>): Observable<ApiResponse<Role>> {
    return this.http.put<ApiResponse<Role>>(`${this.baseUrl}/${id}`, role);
  }

  /**
   * Eliminar rol
   */
  deleteRole(id: string): Observable<ApiResponse<Role>> {
    return this.http.delete<ApiResponse<Role>>(`${this.baseUrl}/${id}`);
  }

  /**
   * Obtener todos los permisos disponibles (MenuPermissions)
   */
  getAllPermissions(): Observable<ApiResponse<MenuPermission[]>> {
    return this.http.get<ApiResponse<MenuPermission[]>>(`${this.permissionsUrl}`);
  }
}
