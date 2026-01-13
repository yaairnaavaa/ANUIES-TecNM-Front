import { Component, signal, computed, OnInit, inject } from '@angular/core';
import { CommonModule, CurrencyPipe, DecimalPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CampaignService } from '../../services/campaign.service';
import { AuthService } from '../../services/auth.service';
import { Campaign, IES } from '../../models/api.models';

interface CampaignDisplay {
  id: string;
  name: string;
  startDate: string;
  reach: number;
  cost: number;
  impact: number;
  status: 'Active' | 'Finished' | 'Draft' | 'Cancelled' | 'Paused';
  institution: string;
  type: string;
  specificModality: string;
}

@Component({
  selector: 'app-ies-campaign-management',
  imports: [CommonModule, FormsModule, CurrencyPipe, DecimalPipe],
  templateUrl: './ies-campaign-management.html',
  styleUrl: './ies-campaign-management.css',
})
export class IesCampaignManagementComponent implements OnInit {
  private campaignService = inject(CampaignService);
  private authService = inject(AuthService);

  // Data
  allCampaigns = signal<CampaignDisplay[]>([]);
  rawCampaigns = signal<Campaign[]>([]);

  // UI State
  isAdding = signal(false);
  isLoading = signal(false);
  searchQuery = signal('');
  itemsPerPage = signal(5);
  currentPage = signal(1);
  pageSizeOptions = [5, 10, 20, 50];
  errorMessage = signal<string | null>(null);

  // Auth
  currentUser = this.authService.currentUser;

  // SELECCIÓN (Aquí vive la magia de las métricas)
  selectedCampaign = signal<CampaignDisplay | null>(null);

  ngOnInit() {
    this.loadCampaigns();
  }

  /**
   * Cargar campañas desde el backend
   */
  loadCampaigns() {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.campaignService.getCampaigns().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.rawCampaigns.set(response.data);
          this.allCampaigns.set(this.mapCampaignsToDisplay(response.data));
        }
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error cargando campañas:', error);
        this.errorMessage.set('Error al cargar las campañas. Por favor intenta de nuevo.');
        this.isLoading.set(false);
      }
    });
  }

  /**
   * Mapear campañas del backend al formato del componente
   */
  private mapCampaignsToDisplay(campaigns: Campaign[]): CampaignDisplay[] {
    return campaigns.map(c => {
      const ies = typeof c.ies === 'object' ? c.ies : null;
      const institutionName = ies ? (ies.name || 'Sin IES') : 'Sin IES';
      
      // Mapear estado
      let status: 'Active' | 'Finished' | 'Draft' | 'Cancelled' | 'Paused' = 'Draft';
      if (c.status === 'En curso') status = 'Active';
      else if (c.status === 'Finalizada') status = 'Finished';
      else if (c.status === 'Cancelada') status = 'Cancelled';
      else if (c.status === 'Pausada') status = 'Paused';
      else if (c.status === 'Planificada') status = 'Draft';

      // Calcular impacto (ROI simplificado)
      const reach = c.reach?.actual || c.reach?.estimated || 0;
      const cost = c.costs?.total || 0;
      const impact = cost > 0 ? (reach / cost) * 100 : 0;

      return {
        id: c._id || '',
        name: c.name,
        startDate: typeof c.period?.startDate === 'string' 
          ? c.period.startDate 
          : c.period?.startDate?.toString() || '',
        reach: reach,
        cost: cost,
        impact: impact,
        status: status,
        institution: institutionName,
        type: c.type,
        specificModality: c.specificModality
      };
    });
  }

  // Filtrado
  filteredCampaigns = computed(() => {
    const query = this.searchQuery().toLowerCase();
    return this.allCampaigns().filter((c) => c.name.toLowerCase().includes(query));
  });

  // Paginación
  totalPages = computed(() => Math.ceil(this.filteredCampaigns().length / this.itemsPerPage()));

  pagedCampaigns = computed(() => {
    const start = (this.currentPage() - 1) * this.itemsPerPage();
    return this.filteredCampaigns().slice(start, start + this.itemsPerPage());
  });
  
  // Mapeo de estatus para visualización
  statusMap: Record<string, string> = {
    Active: 'Activa',
    Finished: 'Finalizada',
    Draft: 'Borrador',
    Cancelled: 'Cancelada',
    Paused: 'Pausada'
  };

  // Ajustamos el label de displayMetrics para que sea en español
  displayMetrics = computed(() => {
    const selected = this.selectedCampaign();
    const data = this.filteredCampaigns();

    // Cálculo de escuelas únicas (para métricas globales)
    const uniqueInstitutions = new Set(data.map((c) => c.institution)).size;

    if (selected) {
      return {
        reach: selected.reach,
        cost: selected.cost,
        impact: selected.impact,
        label: `Enfoque: ${selected.name}`,
        institutionName: selected.institution,
        isGlobal: false,
      };
    }

    return {
      reach: data.reduce((acc, c) => acc + c.reach, 0),
      cost: data.reduce((acc, c) => acc + c.cost, 0),
      impact: data.length ? data.reduce((acc, c) => acc + c.impact, 0) / data.length : 0,
      label: 'Métricas Globales (Total Filtrado)',
      institutionCount: uniqueInstitutions,
      isGlobal: true,
    };
  });

  // Eventos
  selectCampaign(c: CampaignDisplay) {
    if (this.selectedCampaign()?.id === c.id) {
      this.selectedCampaign.set(null); // Deseleccionar
    } else {
      this.selectedCampaign.set(c);
    }
  }

  onSearchChange(val: string) {
    this.searchQuery.set(val);
    this.currentPage.set(1);
  }

  goToPage(page: number) {
    this.currentPage.set(page);
  }

  /**
   * Eliminar campaña
   */
  deleteCampaign(id: string) {
    if (!confirm('¿Estás seguro de eliminar esta campaña?')) {
      return;
    }

    this.isLoading.set(true);
    this.campaignService.deleteCampaign(id).subscribe({
      next: () => {
        this.loadCampaigns();
        if (this.selectedCampaign()?.id === id) {
          this.selectedCampaign.set(null);
        }
      },
      error: (error) => {
        console.error('Error eliminando campaña:', error);
        alert('Error al eliminar la campaña');
        this.isLoading.set(false);
      }
    });
  }

  /**
   * Actualizar estado de campaña
   */
  updateCampaignStatus(id: string, newStatus: 'Planificada' | 'En Curso' | 'Finalizada' | 'Cancelada' | 'Pausada') {
    this.campaignService.updateStatus(id, newStatus).subscribe({
      next: () => {
        this.loadCampaigns();
      },
      error: (error) => {
        console.error('Error actualizando estado:', error);
        alert('Error al actualizar el estado de la campaña');
      }
    });
  }
}
