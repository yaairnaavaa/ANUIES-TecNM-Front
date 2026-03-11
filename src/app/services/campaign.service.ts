import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Campaign, ApiResponse } from '../models/api.models';

export interface CampaignFilters {
  ies?: string;
  type?: 'Presencial' | 'Virtual';
  status?: 'Planificada' | 'En Curso' | 'Finalizada' | 'Cancelada' | 'Pausada';
}

export interface CreateCampaignDto {
  ies: string;
  name: string;
  description?: string;
  type: 'Presencial' | 'Virtual';
  specificModality: string;
  period: {
    startDate: string | Date;
    endDate: string | Date;
  };
  reach: {
    estimated: number;
    unit?: 'Personas' | 'Impresiones' | 'Clics' | 'Vistas' | 'Asistentes';
  };
  costs: {
    total: number;
  };
  targetedIEMS?: string[];
  targetedCareers?: string[];
  responsible?: string;
}

@Injectable({ providedIn: 'root' })
export class CampaignService {
  private http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/campaigns`;

  /**
   * Obtener todas las campañas con filtros opcionales
   */
  getCampaigns(filters?: CampaignFilters): Observable<ApiResponse<Campaign[]>> {
    let params = new HttpParams();

    if (filters) {
      if (filters.ies) params = params.set('ies', filters.ies);
      if (filters.type) params = params.set('type', filters.type);
      if (filters.status) params = params.set('status', filters.status);
    }

    return this.http.get<ApiResponse<Campaign[]>>(this.baseUrl, { params });
  }

  /**
   * Obtener una campaña por ID
   */
  getCampaignById(id: string): Observable<ApiResponse<Campaign>> {
    return this.http.get<ApiResponse<Campaign>>(`${this.baseUrl}/${id}`);
  }

  /**
   * Crear nueva campaña
   */
  createCampaign(campaign: CreateCampaignDto): Observable<ApiResponse<Campaign>> {
    return this.http.post<ApiResponse<Campaign>>(this.baseUrl, campaign);
  }

  /**
   * Actualizar campaña
   */
  updateCampaign(
    id: string,
    campaign: Partial<CreateCampaignDto>,
  ): Observable<ApiResponse<Campaign>> {
    return this.http.patch<ApiResponse<Campaign>>(`${this.baseUrl}/${id}`, campaign);
  }

  /**
   * Eliminar campaña
   */
  deleteCampaign(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/${id}`);
  }

  /**
   * Actualizar estado de la campaña
   */
  updateStatus(
    id: string,
    status: 'Planificada' | 'En Curso' | 'Finalizada' | 'Cancelada' | 'Pausada',
  ): Observable<ApiResponse<Campaign>> {
    return this.http.put<ApiResponse<Campaign>>(`${this.baseUrl}/${id}/status`, { status });
  }

  /**
   * Actualizar métricas de la campaña
   */
  updateMetrics(
    id: string,
    metrics: {
      impressions?: number;
      clicks?: number;
      conversions?: number;
    },
  ): Observable<ApiResponse<Campaign>> {
    return this.http.put<ApiResponse<Campaign>>(`${this.baseUrl}/${id}/metrics`, metrics);
  }

  /**
   * Obtener modalidades específicas por tipo de campaña
   */
  getModalitiesByType(type: 'Presencial' | 'Digital'): string[] {
    const modalities = {
      Presencial: [
        'Feria/Evento',
        'Visita a escuela',
        'Conferencias',
        'Proyectos de innovación',
        'Visitas a IEMS',
        'Volanteo',
        'Open House',
        'Ferias universitarias',
        'Conferencias tipo TED',
        'Radio',
        'TV',
        'Tríptico / Periódico',
        'Transporte (publicidad)',
        'Barda / Crucero',
        'Espectaculares (digitales y análogos)',
        'Perifoneo / Revista',
        'Barco / Avioneta',
      ],
      Digital: [
        'Podcast',
        'TikTok',
        'Facebook',
        'Instagram',
        'Telegram',
        'WhatsApp',
        'YouTube',
        'SMS',
        ' Videoblog',
        'Trends / Reels',
        'Fotos',
        'Videoconferencias',
        'Tríptico digital'
      ],
    };

    return modalities[type] || [];
  }

  /**
   * Obtener unidades de medida para el alcance
   */
  getReachUnits(): string[] {
    return ['Personas', 'Impresiones', 'Clics', 'Vistas', 'Asistentes'];
  }
}
