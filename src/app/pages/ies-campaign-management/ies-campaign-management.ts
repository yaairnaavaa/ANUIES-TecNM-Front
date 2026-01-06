import { Component, signal, computed } from '@angular/core';
import { CommonModule, CurrencyPipe, DecimalPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Campaign {
  id: number;
  name: string;
  startDate: string;
  reach: number;
  cost: number;
  impact: number;
  status: 'Active' | 'Finished' | 'Draft';
  institution: string; // Nueva propiedad
}

@Component({
  selector: 'app-ies-campaign-management',
  imports: [CommonModule, FormsModule, CurrencyPipe, DecimalPipe],
  templateUrl: './ies-campaign-management.html',
  styleUrl: './ies-campaign-management.css',
})
export class IesCampaignManagementComponent {
  // Data
  allCampaigns = signal<Campaign[]>([
    {
      id: 1,
      name: 'Admisiones Primavera 2026',
      startDate: '2026-01-15',
      reach: 45000,
      cost: 12500,
      impact: 8.5,
      status: 'Active',
      institution: 'Instituto Tecnológico de Tepic',
    },
    {
      id: 2,
      name: 'Feria Educativa Regional',
      startDate: '2025-11-20',
      reach: 12000,
      cost: 5000,
      impact: 12.2,
      status: 'Finished',
      institution: 'Instituto Tecnológico de Pachuca',
    },
    {
      id: 3,
      name: 'Campaña Redes Sociales Invierno',
      startDate: '2025-12-01',
      reach: 85000,
      cost: 22000,
      impact: 15.4,
      status: 'Finished',
      institution: 'Instituto Tecnológico de Tepic',
    },
    {
      id: 4,
      name: 'Beca Talento 2026',
      startDate: '2026-02-10',
      reach: 5000,
      cost: 1200,
      impact: 4.1,
      status: 'Active',
      institution: 'Instituto Tecnológico de Tepic',
    },
    {
      id: 5,
      name: 'Postgrado Online Awareness',
      startDate: '2025-10-05',
      reach: 32000,
      cost: 8900,
      impact: 9.7,
      status: 'Finished',
      institution: 'Instituto Tecnológico de Tepic',
    },
    {
      id: 6,
      name: 'Campaña Radio Local',
      startDate: '2026-03-01',
      reach: 15000,
      cost: 3500,
      impact: 77.5,
      status: 'Draft',
      institution: 'Instituto Tecnológico de Tepic',
    },
  ]);

  // UI State
  isAdding = signal(false);
  isLoading = signal(false);
  searchQuery = signal('');
  itemsPerPage = signal(5);
  currentPage = signal(1);
  pageSizeOptions = [5, 10, 20, 50];

  // SELECCIÓN (Aquí vive la magia de las métricas)
  selectedCampaign = signal<Campaign | null>(null);

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
  selectCampaign(c: Campaign) {
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
}
