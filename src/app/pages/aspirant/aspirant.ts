import { Component, signal, inject, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProspectService } from '../../services/prospect.service';
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

  aspirants = signal<Prospect[]>([]);
  selectedAspirant = signal<Prospect | null>(null);
  isLoading = signal<boolean>(false);

  // Signals para Búsqueda y Paginación
  searchTerm = signal<string>('');
  currentPage = signal<number>(1);
  itemsPerPage = signal<number>(5); // Ahora es un signal

  filteredAspirants = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const data = this.aspirants();
    if (!term) return data;
    return data.filter(
      (a) =>
        (a.fullName || '').toLowerCase().includes(term) ||
        (a.email || '').toLowerCase().includes(term) ||
        (a.originIEMSName || a.originIEMS || '').toLowerCase().includes(term)
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

  // ========================================
  // ESTADÍSTICAS GENERALES DEL MÓDULO
  // ========================================
  
  // Total de aspirantes
  totalAspirants = computed(() => this.aspirants().length);

  // Aspirantes con registro completo
  completedAspirants = computed(() => {
    return this.aspirants().filter(a => 
      a.processStatus?.registrationComplete === true
    ).length;
  });

  // Carrera más solicitada
  topCareer = computed(() => {
    const aspirants = this.aspirants();
    if (aspirants.length === 0) return 'N/A';

    // Contar todas las carreras de interés
    const careerCount: { [key: string]: number } = {};
    
    aspirants.forEach(a => {
      a.careerInterests?.forEach(interest => {
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
    const withGrades = aspirants.filter(a => a.averageGrade && a.averageGrade > 0);
    
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

  // Manejador para el combo de cantidad (5, 10, 25...)
  onItemsPerPageChange(event: Event): void {
    const element = event.target as HTMLSelectElement;
    this.itemsPerPage.set(Number(element.value));
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
}
