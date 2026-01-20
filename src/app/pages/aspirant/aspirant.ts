import { Component, signal, inject, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProspectService } from '../../services/prospect.service'; // Ajusta la ruta
import { Prospect } from '../../models/api.models'; // Ajusta la ruta
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

  // Signals de datos y estado
  aspirants = signal<Prospect[]>([]);
  selectedAspirant = signal<Prospect | null>(null);
  isLoading = signal<boolean>(false);

  // Signals para Búsqueda y Paginación
  searchTerm = signal<string>('');
  currentPage = signal<number>(1);
  itemsPerPage = 10; // Puedes cambiar este número

  // LÓGICA DE FILTRADO (Lupa)
  // Se dispara automáticamente cuando cambia 'aspirants' o 'searchTerm'
  filteredAspirants = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const data = this.aspirants();

    if (!term) return data;

    return data.filter(
      (a) =>
        // Usamos (a.propiedad || '') para asegurar que siempre sea un string
        (a.fullName || '').toLowerCase().includes(term) ||
        (a.email || '').toLowerCase().includes(term) ||
        (a.originIEMSName || a.originIEMS || '').toLowerCase().includes(term)
    );
  });

  // LÓGICA DE PAGINACIÓN
  // Se dispara cuando cambia 'filteredAspirants' o 'currentPage'
  paginatedAspirants = computed(() => {
    const startIndex = (this.currentPage() - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.filteredAspirants().slice(startIndex, endIndex);
  });

  // Cálculo del total de páginas
  totalPages = computed(() => {
    return Math.ceil(this.filteredAspirants().length / this.itemsPerPage) || 1;
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
          if (response.data.length > 0) {
            this.selectedAspirant.set(response.data[0]);
          }
        }
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error al cargar:', error);
        this.isLoading.set(false);
        if (error.status === 401) {
          alert('Tu sesión ha expirado. Por favor, inicia sesión de nuevo.');
        }
      },
    });
  }

  // Manejador de la lupa
  onSearch(event: Event): void {
    const element = event.target as HTMLInputElement;
    this.searchTerm.set(element.value);
    this.currentPage.set(1); // Reiniciar a la página 1 al buscar
  }

  // Manejadores de Paginación
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
