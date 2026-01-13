import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Period, ApiResponse } from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class PeriodService {
  private http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/periods`;

  /**
   * Obtener todos los periodos
   */
  getAllPeriods(): Observable<ApiResponse<Period[]>> {
    return this.http.get<ApiResponse<Period[]>>(this.baseUrl);
  }

  /**
   * Obtener periodo actual
   */
  getCurrentPeriod(): Observable<ApiResponse<Period>> {
    return this.http.get<ApiResponse<Period>>(`${this.baseUrl}/current`);
  }

  /**
   * Obtener periodo por ID
   */
  getPeriodById(id: string): Observable<ApiResponse<Period>> {
    return this.http.get<ApiResponse<Period>>(`${this.baseUrl}/${id}`);
  }

  /**
   * Crear nuevo periodo
   */
  createPeriod(period: Partial<Period>): Observable<ApiResponse<Period>> {
    return this.http.post<ApiResponse<Period>>(this.baseUrl, period);
  }

  /**
   * Actualizar periodo
   */
  updatePeriod(id: string, period: Partial<Period>): Observable<ApiResponse<Period>> {
    return this.http.put<ApiResponse<Period>>(`${this.baseUrl}/${id}`, period);
  }

  /**
   * Activar periodo
   */
  activatePeriod(id: string): Observable<ApiResponse<Period>> {
    return this.http.put<ApiResponse<Period>>(`${this.baseUrl}/${id}/activate`, {});
  }

  /**
   * Eliminar periodo
   */
  deletePeriod(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/${id}`);
  }
}
