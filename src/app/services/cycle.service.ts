import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Period, ApiResponse } from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class CycleService {
  private http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/ciclos`;

  /**
   * Obtener todos los ciclos
   */
  getAllCycles(): Observable<ApiResponse<Period[]>> {
    return this.http.get<ApiResponse<Period[]>>(this.baseUrl);
  }

  /**
   * Obtener ciclo actual
   */
  getCurrentCycle(): Observable<ApiResponse<Period>> {
    return this.http.get<ApiResponse<Period>>(`${this.baseUrl}/current`);
  }

  /**
   * Obtener ciclo activo actual
   */
  getCurrentActiveCycle(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/currentActive`);
  }

  /**
   * Obtener ciclo por ID
   */
  getCycleById(id: string): Observable<ApiResponse<Period>> {
    return this.http.get<ApiResponse<Period>>(`${this.baseUrl}/${id}`);
  }

  /**
   * Crear nuevo ciclo
   */
  createCycle(cycle: Partial<Period>): Observable<ApiResponse<Period>> {
    return this.http.post<ApiResponse<Period>>(this.baseUrl, cycle);
  }

  /**
   * Actualizar ciclo
   */
  updateCycle(id: string, cycle: Partial<Period>): Observable<ApiResponse<Period>> {
    return this.http.put<ApiResponse<Period>>(`${this.baseUrl}/${id}`, cycle);
  }

  /**
   * Activar ciclo
   */
  activateCycle(id: string): Observable<ApiResponse<Period>> {
    return this.http.put<ApiResponse<Period>>(`${this.baseUrl}/${id}/activate`, {});
  }

  /**
   * Eliminar ciclo
   */
  deleteCycle(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/${id}`);
  }
}
