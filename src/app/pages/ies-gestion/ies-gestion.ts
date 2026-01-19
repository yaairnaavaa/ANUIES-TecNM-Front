import { Component, signal, computed, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IES } from '../../models/api.models';
import { IesService } from '../../services/ies.service';
import { AuthService } from '../../services/auth.service';
import { IesUserManagement } from '../ies-user-management/ies-user-management';
@Component({
  selector: 'app-ies-gestion',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, IesUserManagement],
  templateUrl: './ies-gestion.html',
})
export class IesGestion implements OnInit {
  private iesService = inject(IesService);
  private authService = inject(AuthService);
  // Estado para controlar qué vista mostrar
  // 'list' para la tabla, 'users' para la gestión de operativos
  currentView = signal<'list' | 'users'>('list');
  selectedIes = signal<IES | null>(null);

  isAdding = signal(false);
  isLoading = signal(false);
  searchQuery = signal('');

  // Paginación
  currentPage = signal(1);
  itemsPerPage = signal(5);
  pageSizeOptions = [5, 10, 20, 50];

  // Datos desde backend
  iesList = signal<IES[]>([]);
  errorMessage = signal<string>('');

  ngOnInit(): void {
    this.loadIES();
  }

  /**
   * Cargar IES desde el backend
   */
  loadIES(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.iesService.getAllIES().subscribe({
      next: (response) => {
        this.iesList.set(response.data || []);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error cargando IES:', error);
        this.errorMessage.set('Error al cargar las IES');
        this.isLoading.set(false);
      },
    });
  }

  // Métodos para cambiar de vista
  manageUsers(ies: IES) {
    this.selectedIes.set(ies);
    this.currentView.set('users');
  }

  backToList() {
    this.currentView.set('list');
    this.selectedIes.set(null);
  }

  // --- Lógica de filtrado y paginación (Mantenida igual) ---
  allFilteredResults = computed(() => {
    const query = this.searchQuery().toLowerCase();
    return this.iesList().filter(
      (ies) => ies.name?.toLowerCase().includes(query) || ies.code?.toLowerCase().includes(query),
    );
  });

  pagedIes = computed(() => {
    const startIndex = (this.currentPage() - 1) * this.itemsPerPage();
    const endIndex = startIndex + this.itemsPerPage();
    return this.allFilteredResults().slice(startIndex, endIndex);
  });

  totalPages = computed(() => Math.ceil(this.allFilteredResults().length / this.itemsPerPage()));

  showingRange = computed(() => {
    const start = (this.currentPage() - 1) * this.itemsPerPage() + 1;
    const end = Math.min(
      this.currentPage() * this.itemsPerPage(),
      this.allFilteredResults().length,
    );
    return this.allFilteredResults().length > 0 ? `${start} - ${end}` : '0';
  });

  newIes = signal<Partial<IES>>(this.resetForm());

  resetForm(): Partial<IES> {
    return {
      code: '',
      name: '',
      shortName: '',
      address: {
        municipality: '',
        state: '',
        country: 'México',
      },
      contact: {
        email: '',
        generalPhone: '',
        responsable: '',
        nombreDirector: '',
      },
      active: true,
    };
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
    }
  }

  onSearchChange(query: string) {
    this.searchQuery.set(query);
    this.currentPage.set(1);
  }

  onItemsPerPageChange(value: number) {
    this.itemsPerPage.set(value);
    this.currentPage.set(1);
  }

  toggleAdd() {
    this.isAdding.update((v) => !v);
    if (!this.isAdding()) this.newIes.set(this.resetForm());
  }

  // En tu componente .ts
  isFormValid(): boolean {
    const ies = this.newIes();
    return !!(
      ies.name &&
      ies.code &&
      ies.contact?.responsable &&
      ies.contact?.nombreDirector &&
      ies.contact?.email &&
      ies.contact?.generalPhone
    );
  }

  saveIES() {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.iesService.createIES(this.newIes()).subscribe({
      next: (response) => {
        this.loadIES(); // Recargar lista
        this.isLoading.set(false);
        this.toggleAdd();
      },
      error: (error) => {
        console.error('Error creando IES:', error);
        this.errorMessage.set('Error al crear la IES');
        this.isLoading.set(false);
      },
    });
  }

  openEdit(ies: any): void {
    console.log('Editando institución:', ies);
    // Aquí va tu lógica para abrir el modal de edición
    // Ejemplo: this.selectedIes = ies; this.showEditModal = true;
  }

  /**
   * Eliminar IES
   */
  deleteIES(iesId: string) {
    if (!confirm('¿Está seguro de eliminar esta IES?')) {
      return;
    }

    this.iesService.deleteIES(iesId).subscribe({
      next: () => {
        this.loadIES(); // Recargar lista
      },
      error: (error) => {
        console.error('Error eliminando IES:', error);
        alert('Error al eliminar la IES');
      },
    });
  }
}
