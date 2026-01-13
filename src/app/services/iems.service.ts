import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { IEMS, ApiResponse } from '../models/api.models';

export interface IEMSFilters {
  state?: string;
  municipality?: string;
  type?: string;
  active?: boolean;
}

@Injectable({ providedIn: 'root' })
export class IemsService {
  private http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/iems`;

  /**
   * Obtener todas las IEMS
   */
  getAllIEMS(filters?: IEMSFilters): Observable<ApiResponse<IEMS[]>> {
    let params = new HttpParams();
    
    if (filters?.state) params = params.set('state', filters.state);
    if (filters?.municipality) params = params.set('municipality', filters.municipality);
    if (filters?.type) params = params.set('type', filters.type);
    if (filters?.active !== undefined) params = params.set('active', filters.active.toString());

    return this.http.get<ApiResponse<IEMS[]>>(this.baseUrl, { params });
  }

  /**
   * Obtener IEMS por ID
   */
  getIEMSById(id: string): Observable<ApiResponse<IEMS>> {
    return this.http.get<ApiResponse<IEMS>>(`${this.baseUrl}/${id}`);
  }

  /**
   * Crear nueva IEMS
   */
  createIEMS(iems: Partial<IEMS>): Observable<ApiResponse<IEMS>> {
    return this.http.post<ApiResponse<IEMS>>(this.baseUrl, iems);
  }

  /**
   * Actualizar IEMS
   */
  updateIEMS(id: string, iems: Partial<IEMS>): Observable<ApiResponse<IEMS>> {
    return this.http.put<ApiResponse<IEMS>>(`${this.baseUrl}/${id}`, iems);
  }

  /**
   * Eliminar IEMS
   */
  deleteIEMS(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/${id}`);
  }

  /**
   * Buscar IEMS
   */
  searchIEMS(query: string): Observable<ApiResponse<IEMS[]>> {
    let params = new HttpParams().set('search', query);
    return this.http.get<ApiResponse<IEMS[]>>(`${this.baseUrl}/search`, { params });
  }
}
