import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { IES, ApiResponse } from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class IesService {
  private http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/ies`;

  /**
   * Obtener todas las IES
   */
  getAllIES(filters?: { state?: string; active?: boolean }): Observable<ApiResponse<IES[]>> {
    let params = new HttpParams();
    
    if (filters?.state) params = params.set('state', filters.state);
    if (filters?.active !== undefined) params = params.set('active', filters.active.toString());

    return this.http.get<ApiResponse<IES[]>>(this.baseUrl, { params });
  }

  /**
   * Obtener IES por ID
   */
  getIESById(id: string): Observable<ApiResponse<IES>> {
    return this.http.get<ApiResponse<IES>>(`${this.baseUrl}/${id}`);
  }

  /**
   * Crear nueva IES
   */
  createIES(ies: Partial<IES>): Observable<ApiResponse<IES>> {
    return this.http.post<ApiResponse<IES>>(this.baseUrl, ies);
  }

  /**
   * Actualizar IES
   */
  updateIES(id: string, ies: Partial<IES>): Observable<ApiResponse<IES>> {
    return this.http.put<ApiResponse<IES>>(`${this.baseUrl}/${id}`, ies);
  }

  /**
   * Eliminar IES
   */
  deleteIES(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/${id}`);
  }

  /**
   * Obtener estadísticas de una IES
   */
  getIESStatistics(id: string): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.baseUrl}/${id}/statistics`);
  }
}
