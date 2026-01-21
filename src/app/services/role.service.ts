import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Role, ApiResponse } from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class RoleService {
  private http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/roles`;

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
}
