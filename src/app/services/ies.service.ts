import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { IES, ApiResponse } from '../models/api.models';
import { Career } from '../models/api.models';
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
    return this.http.patch<ApiResponse<IES>>(`${this.baseUrl}/${id}`, ies);
  }

  /**
   * Obtener carreras de una IES
   */
  getCareersIES(id: string): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(`${this.baseUrl}/${id}/carreras`);
  }

  createCareerIES(iesId: string, career: Partial<Career>): Observable<ApiResponse<Career>> {
    return this.http.post<ApiResponse<Career>>(`${this.baseUrl}/${iesId}/carreras`, career);
  }

  updateCareer(careerId: string, career: Partial<Career>): Observable<ApiResponse<Career>> {
    return this.http.patch<ApiResponse<Career>>(`${environment.apiUrl}/careers/${careerId}`, career);
  }

  deleteCareerIES(iesId: string, carreraId: string): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.baseUrl}/${iesId}/carreras/${carreraId}`);
  }

  // Guardar el contenido del HTML de una IES
  saveIESHtml(iesId: string, htmlContent: string): Observable<ApiResponse<any>> {
    const url = `${this.baseUrl}/${iesId}/htmlPage`;
    return this.http.post<ApiResponse<any>>(url, { html: htmlContent });
  }

  /**
   * Obtener el contenido HTML guardado de una IES
   */
  getIESHtml(iesId: string): Observable<ApiResponse<{ page: string }>> {
    const url = `${this.baseUrl}/${iesId}/htmlPage`;
    return this.http.get<ApiResponse<{ page: string }>>(url);
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

  /**
   * Actualizar filosofía institucional (misión y visión)
   */
  updateFilosofia(id: string, data: { mision?: string; vision?: string }): Observable<ApiResponse<IES>> {
    return this.http.patch<ApiResponse<IES>>(`${this.baseUrl}/${id}/filosofia`, data);
  }

  /**
   * Actualizar identidad visual (branding e imágenes)
   */
  updateIdentidadVisual(id: string, data: {
    branding?: {
      primaryColor?: string;
      secondaryColor?: string;
      accentColor?: string;
      fontFamily?: string;
    };
    institutionalImage?: {
      logo?: string;
      logoPublicId?: string;
      banner?: string;
      bannerPublicId?: string;
    };
  }): Observable<ApiResponse<IES>> {
    return this.http.patch<ApiResponse<IES>>(`${this.baseUrl}/${id}/identidad-visual`, data);
  }

  /**
   * Actualizar canales digitales (redes sociales y contacto)
   */
  updateCanalesDigitales(id: string, data: {
    contact?: {
      website?: string;
      socialMedia?: {
        facebook?: string;
        instagram?: string;
        twitter?: string;
        youtube?: string;
        tiktok?: string;
      };
    };
  }): Observable<ApiResponse<IES>> {
    return this.http.patch<ApiResponse<IES>>(`${this.baseUrl}/${id}/canales-digitales`, data);
  }

  /**
   * Subir logo institucional
   * TODO: Configurar cuando Cloudinary esté listo
   */
  uploadLogo(id: string, file: File): Observable<ApiResponse<any>> {
    const formData = new FormData();
    formData.append('logo', file);
    return this.http.post<ApiResponse<any>>(`${this.baseUrl}/${id}/upload-logo`, formData);
  }

  /**
   * Subir banner institucional
   * TODO: Configurar cuando Cloudinary esté listo
   */
  uploadBanner(id: string, file: File): Observable<ApiResponse<any>> {
    const formData = new FormData();
    formData.append('banner', file);
    return this.http.post<ApiResponse<any>>(`${this.baseUrl}/${id}/upload-banner`, formData);
  }

  /**
   * Agregar imagen a galería
   * TODO: Configurar cuando Cloudinary esté listo
   */
  uploadGalleryImage(id: string, file: File, description?: string): Observable<ApiResponse<any>> {
    const formData = new FormData();
    formData.append('image', file);
    if (description) formData.append('description', description);
    return this.http.post<ApiResponse<any>>(`${this.baseUrl}/${id}/upload-gallery`, formData);
  }
}
