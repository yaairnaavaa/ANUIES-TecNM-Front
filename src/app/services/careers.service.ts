import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { IES, ApiResponse } from '../models/api.models';
import { Career } from '../models/api.models';
@Injectable({ providedIn: 'root' })
export class IesService {
  private http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/careers`;

 
  createCareerIES(iesId: string, career: Partial<Career>): Observable<ApiResponse<Career>> {
    return this.http.post<ApiResponse<Career>>(`${this.baseUrl}/${iesId}/carreras`, career);
  }

  updateCareerIES(careerId: string, career: Partial<Career>) {
    return this.http.patch(`${environment.apiUrl}/careers/${careerId}`, career);
  }

  /**
   * Obtener una carrera específica por ID
   */
  getCareerById(careerId: string): Observable<ApiResponse<Career>> {
    return this.http.get<ApiResponse<Career>>(`${environment.apiUrl}/careers/${careerId}`);
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
