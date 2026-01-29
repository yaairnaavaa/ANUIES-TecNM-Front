import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { Prospect, ApiResponse } from '../models/api.models';

export interface ProspectFilters {
  ies?: string;
  campaign?: string;
  status?: string;
  interestedCareer?: string;
}

export interface PageResponse {
  page: string;
}


@Injectable({ providedIn: 'root' })
export class ProspectService {
  private http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/prospects`;

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('anuies_token');

    return new HttpHeaders({
      Authorization: token ? `Bearer ${token}` : '',
    });
  }

  /**
   * Obtener todos los prospectos
   */
  getProspects(filters?: ProspectFilters): Observable<ApiResponse<Prospect[]>> {
    let params = new HttpParams();

    if (filters) {
      if (filters.ies) params = params.set('ies', filters.ies);
      if (filters.campaign) params = params.set('campaign', filters.campaign);
      if (filters.status) params = params.set('status', filters.status);
      if (filters.interestedCareer)
        params = params.set('interestedCareer', filters.interestedCareer);
    }

    console.log(this.getAuthHeaders());

    return this.http.get<ApiResponse<Prospect[]>>(this.baseUrl, {
      params,
      headers: this.getAuthHeaders(),
    });
  }

  /**
   * Obtener prospecto por ID
   */
  getProspectById(id: string): Observable<ApiResponse<Prospect>> {
    return this.http.get<ApiResponse<Prospect>>(`${this.baseUrl}/${id}`);
  }

  /**
   * Crear nuevo prospecto
   */
  createProspect(prospect: Partial<Prospect>): Observable<ApiResponse<Prospect>> {
    return this.http.post<ApiResponse<Prospect>>(`${this.baseUrl}/register`, prospect);
  }

  /**
   * Actualizar prospecto
   */
  /**
   * Actualizar prospecto y recibir respuesta completa
   */
  updateProspect(id: string, prospect: Partial<Prospect>): Observable<ApiResponse<PageResponse>> {
    return this.http.patch<ApiResponse<PageResponse>>(`${this.baseUrl}/${id}`, prospect);
  }

  /**
   * Eliminar prospecto
   */
  deleteProspect(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/${id}`);
  }

  /**
   * Actualizar estado del prospecto
   */
  updateStatus(id: string, status: string, notes?: string): Observable<ApiResponse<Prospect>> {
    return this.http.put<ApiResponse<Prospect>>(`${this.baseUrl}/${id}/status`, { status, notes });
  }

  /**
   * Validar documentos del prospecto
   */
  validateDocuments(
    id: string,
    validated: boolean,
    validationNotes?: string,
  ): Observable<ApiResponse<Prospect>> {
    return this.http.put<ApiResponse<Prospect>>(`${this.baseUrl}/${id}/validate`, {
      validated,
      validationNotes,
    });
  }
}
