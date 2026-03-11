import { Component, signal, inject, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProspectService } from '../../services/prospect.service';
import { ExcelReportService } from '../../services/excel-report.service';
import { NotificationService } from '../../services/notification.service';
import { Prospect } from '../../models/api.models';
import { getCareerAbbreviation } from '../../utils/career-abbreviations';

@Component({
  selector: 'app-aspirant',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './aspirant.html',
  styleUrl: './aspirant.css',
})
export class Aspirant implements OnInit {
  private prospectService = inject(ProspectService);
  private excelReport = inject(ExcelReportService);
  private notificationService = inject(NotificationService);

  aspirants = signal<Prospect[]>([]);
  selectedAspirant = signal<Prospect | null>(null);
  isLoading = signal<boolean>(false);
  showDetailsModal = signal<boolean>(false);
  viewingAspirant = signal<Prospect | null>(null);
  detailsModalTab = signal<'general' | 'complete'>('general');
  /** Sección expandida en el acordeón del Perfil completo (null = ninguna) */
  expandedSection = signal<string | null>(null);

  // Signals para Búsqueda, Filtro por Estatus y Paginación
  searchTerm = signal<string>('');
  statusFilter = signal<'all' | 'interesados' | 'prospectos'>('all');
  currentPage = signal<number>(1);
  itemsPerPage = signal<number>(5);
  pageSizeOptions = [5, 10, 20, 50];

  filteredAspirants = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const status = this.statusFilter();
    let data = this.aspirants();

    // Filtro por estatus: Interesados = perfil no completo, Prospectos = perfil completo
    if (status === 'interesados') {
      data = data.filter((a) => a.processStatus?.registrationComplete !== true);
    } else if (status === 'prospectos') {
      data = data.filter((a) => a.processStatus?.registrationComplete === true);
    }

    if (!term) return data;
    return data.filter(
      (a) =>
        (a.fullName || '').toLowerCase().includes(term) ||
        (a.email || '').toLowerCase().includes(term) ||
        (a.originIEMSName || a.originIEMS || '').toLowerCase().includes(term),
    );
  });

  // IMPORTANTE: Esta es la data que usa el @for del HTML
  paginatedAspirants = computed(() => {
    const startIndex = (this.currentPage() - 1) * this.itemsPerPage();
    const endIndex = startIndex + this.itemsPerPage();
    return this.filteredAspirants().slice(startIndex, endIndex);
  });

  totalPages = computed(() => {
    return Math.ceil(this.filteredAspirants().length / this.itemsPerPage()) || 1;
  });

  showingRange = computed(() => {
    const start = (this.currentPage() - 1) * this.itemsPerPage() + 1;
    const end = Math.min(this.currentPage() * this.itemsPerPage(), this.filteredAspirants().length);
    return this.filteredAspirants().length > 0 ? `${start} - ${end}` : '0';
  });

  // ========================================
  // ESTADÍSTICAS GENERALES DEL MÓDULO
  // ========================================

  // Total de aspirantes
  totalAspirants = computed(() => this.aspirants().length);

  // Aspirantes con registro completo
  completedAspirants = computed(() => {
    return this.aspirants().filter((a) => a.processStatus?.registrationComplete === true).length;
  });

  // Carrera más solicitada
  topCareer = computed(() => {
    const aspirants = this.aspirants();
    if (aspirants.length === 0) return 'N/A';

    // Contar todas las carreras de interés
    const careerCount: { [key: string]: number } = {};

    aspirants.forEach((a) => {
      a.careerInterests?.forEach((interest) => {
        const career = interest.career;
        careerCount[career] = (careerCount[career] || 0) + 1;
      });
    });

    // Encontrar la más solicitada
    let maxCount = 0;
    let topCareer = 'N/A';

    Object.entries(careerCount).forEach(([career, count]) => {
      if (count > maxCount) {
        maxCount = count;
        topCareer = career;
      }
    });

    return topCareer;
  });

  // Promedio general de calificaciones
  averageGrade = computed(() => {
    const aspirants = this.aspirants();
    const withGrades = aspirants.filter((a) => a.averageGrade && a.averageGrade > 0);

    if (withGrades.length === 0) return 0;

    const sum = withGrades.reduce((acc, a) => acc + (a.averageGrade || 0), 0);
    return (sum / withGrades.length).toFixed(1);
  });

  ngOnInit(): void {
    this.loadProspects();
  }

  loadProspects(): void {
    this.isLoading.set(true);
    this.prospectService.getProspects().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.aspirants.set(response.data);
          if (response.data.length > 0) this.selectedAspirant.set(response.data[0]);
        }
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
  }

  onSearch(event: Event): void {
    const element = event.target as HTMLInputElement;
    this.searchTerm.set(element.value);
    this.currentPage.set(1);
  }

  setStatusFilter(filter: 'all' | 'interesados' | 'prospectos'): void {
    this.statusFilter.set(filter);
    this.currentPage.set(1);
  }

  // Manejador para el combo de cantidad (5, 10, 20, 50)
  onItemsPerPageChange(value: number): void {
    this.itemsPerPage.set(value);
    this.currentPage.set(1);
  }

  nextPage(): void {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update((p) => p + 1);
    }
  }

  prevPage(): void {
    if (this.currentPage() > 1) {
      this.currentPage.update((p) => p - 1);
    }
  }

  selectAspirant(aspirant: Prospect): void {
    this.selectedAspirant.set(aspirant);
  }

  getStatusLabel(status: any): string {
    if (!status) return 'Pendiente';
    if (status.profileValidated) return 'Validado';
    if (status.registrationComplete) return 'Completo';
    return 'Pendiente';
  }

  // Función para obtener la abreviación de una carrera
  getCareerAbbr(careerName: string): string {
    return getCareerAbbreviation(careerName);
  }

  // Abrir modal de detalles
  openDetailsModal(aspirant: Prospect): void {
    this.viewingAspirant.set(aspirant);
    this.detailsModalTab.set('general');
    this.expandedSection.set(null);
    this.showDetailsModal.set(true);
  }

  // Cerrar modal de detalles
  closeDetailsModal(): void {
    this.showDetailsModal.set(false);
    this.viewingAspirant.set(null);
  }

  setDetailsModalTab(tab: 'general' | 'complete'): void {
    this.detailsModalTab.set(tab);
    if (tab === 'general') this.expandedSection.set(null);
  }

  toggleSection(sectionId: string): void {
    this.expandedSection.update((current) => (current === sectionId ? null : sectionId));
  }

  isSectionExpanded(sectionId: string): boolean {
    return this.expandedSection() === sectionId;
  }

  isProfileComplete(aspirant: Prospect | null): boolean {
    return aspirant?.processStatus?.registrationComplete === true;
  }

  /**
   * Exportar reporte Excel de aspirantes (tabla con formato)
   */
  exportAspirantsExcel(): void {
    const data = this.filteredAspirants();
    if (data.length === 0) {
      this.notificationService.warning('No hay aspirantes para exportar.');
      return;
    }
    const rows = data.map((a) => ({
      fullName:
        a.fullName ?? `${a.firstName ?? ''} ${a.lastName ?? ''} ${a.secondLastName ?? ''}`.trim(),
      email: a.email ?? '',
      curp: a.curp ?? '',
      phone: (a.phone as { mobile?: string })?.mobile ?? '',
      originIEMS: a.originIEMSName ?? a.originIEMS ?? '',
      originCampaign: this.getOriginCampaignDisplay(a),
      status: this.getStatusLabel(a.processStatus),
      career1: a.careerInterests?.[0]?.career ?? '',
      career2: a.careerInterests?.[1]?.career ?? '',
      career3: a.careerInterests?.[2]?.career ?? '',

      cycleName: a.cycleName ?? '',
    }));
    this.excelReport
      .downloadFormattedExcel({
        sheetName: 'Aspirantes',
        filename: `reporte-aspirantes_${new Date().toISOString().slice(0, 10)}.xlsx`,
        title: 'Reporte de Aspirantes',
        columns: [
          { key: 'fullName', label: 'Nombre completo', width: 28 },
          { key: 'email', label: 'Correo', width: 26 },
          { key: 'curp', label: 'CURP', width: 20 },
          { key: 'phone', label: 'Teléfono', width: 16 },
          { key: 'originIEMS', label: 'Origen IEMS', width: 22 },
          { key: 'originCampaign', label: 'Campaña origen', width: 24 },
          { key: 'status', label: 'Estatus', width: 14 },
          { key: 'career1', label: 'Carrera de interés 1', width: 32 },
          { key: 'career2', label: 'Carreras de interés 2', width: 32 },
          { key: 'career3', label: 'Carreras de interés 3', width: 32 },

          { key: 'cycleName', label: 'Ciclo', width: 16 },
        ],
        rows,
      })
      .catch((err) => {
        console.error('Error al exportar Excel:', err);
        this.notificationService.error('No se pudo generar el reporte. Intenta de nuevo.');
      });
  }

  /**
   * Mostrar nombre de la campaña de origen (evita mostrar [object Object] cuando viene poblada)
   */
  getOriginCampaignDisplay(aspirant: Prospect | null): string {
    if (!aspirant) return 'No especificada';
    const name = (aspirant as any).originCampaignName;
    if (name && typeof name === 'string') return name;
    const oc = (aspirant as any).originCampaign;
    if (oc && typeof oc === 'object' && oc.name) return oc.name;
    if (typeof oc === 'string') return oc;
    return 'No especificada';
  }

  /**
   * Extraer fecha de nacimiento del CURP
   * El CURP tiene el formato: AAAA + AAMMDD + ...
   * Donde AAMMDD son: Año (2 dígitos), Mes (2 dígitos), Día (2 dígitos)
   * Si el año es >= 50, pertenece al siglo 20 (1900-1999)
   * Si el año es < 50, pertenece al siglo 21 (2000-2049)
   */
  getBirthDateFromCurp(curp: string | undefined): Date | null {
    if (!curp || curp.length < 10) {
      return null;
    }

    try {
      const cleanCurp = curp.trim().toUpperCase();

      // Extraer año, mes y día (posiciones 4-9)
      const yearStr = cleanCurp.substring(4, 6);
      const monthStr = cleanCurp.substring(6, 8);
      const dayStr = cleanCurp.substring(8, 10);

      const year = parseInt(yearStr, 10);
      const month = parseInt(monthStr, 10);
      const day = parseInt(dayStr, 10);

      // Validar que sean números válidos
      if (isNaN(year) || isNaN(month) || isNaN(day)) {
        return null;
      }

      // Determinar el siglo: si el año es >= 50, es 1900, si no es 2000
      const fullYear = year >= 50 ? 1900 + year : 2000 + year;

      // Validar mes y día
      if (month < 1 || month > 12 || day < 1 || day > 31) {
        return null;
      }

      // Crear la fecha
      const date = new Date(fullYear, month - 1, day);

      // Validar que la fecha sea válida (por ejemplo, 31 de febrero no es válido)
      if (
        date.getFullYear() !== fullYear ||
        date.getMonth() !== month - 1 ||
        date.getDate() !== day
      ) {
        return null;
      }

      return date;
    } catch (error) {
      console.error('Error al extraer fecha del CURP:', error);
      return null;
    }
  }
}
