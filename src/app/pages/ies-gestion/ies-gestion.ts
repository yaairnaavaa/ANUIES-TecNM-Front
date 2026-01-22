import { Component, signal, computed, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IES } from '../../models/api.models';
import { IesService } from '../../services/ies.service';
import { AuthService } from '../../services/auth.service';
import { IesUserManagement } from '../ies-gestion-modals/ies-user-management/ies-user-management';
import { IesEditComponent } from '../ies-gestion-modals/ies-edit-component/ies-edit-component';
import { CareersComponent } from '../ies-gestion-modals/careers-component/careers-component';
type ViewState = 'list' | 'add' | 'edit' | 'users' | 'careers';

@Component({
  selector: 'app-ies-gestion',
  standalone: true,
  imports: [IesEditComponent, CareersComponent, CommonModule, FormsModule, ReactiveFormsModule, IesUserManagement],
  templateUrl: './ies-gestion.html',
})
export class IesGestion implements OnInit {
  private iesService = inject(IesService);

  private authService = inject(AuthService);
  // Estado para controlar qué vista mostrar
  // 'list' para la tabla, 'users' para la gestión de operativos
  currentView = signal<ViewState>('list');
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
  // Agrega | null para que TypeScript permita resetearlas con null
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

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

  closeModal() {
    this.isAdding.set(false);
  }

  // Métodos para cambiar de vista
  openEdit(ies: IES) {
    this.selectedIes.set(ies);
    this.currentView.set('edit');
  }

  manageUsers(ies: IES) {
    this.selectedIes.set(ies);
    this.currentView.set('users');
  }


  manageCareers(ies: IES) {
  this.selectedIes.set(ies); // Primero establecemos la IES seleccionada
  this.currentView.set('careers'); // Luego cambiamos la vista para que el @if se active
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

  // Paginación avanzada con grupos de 5 páginas
  visiblePages = computed(() => {
    const total = this.totalPages();
    if (total === 0) return [];
    
    const current = this.currentPage();
    const pages: number[] = [];
    
    if (total <= 5) {
      for (let i = 1; i <= total; i++) {
        pages.push(i);
      }
      return pages;
    }
    
    const pageGroup = Math.floor((current - 1) / 5);
    const startPage = pageGroup * 5 + 1;
    const endPage = Math.min(startPage + 4, total);
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return pages;
  });

  goToPreviousGroup(): void {
    const current = this.currentPage();
    const pageGroup = Math.floor((current - 1) / 5);
    if (pageGroup > 0) {
      const newPage = (pageGroup - 1) * 5 + 1;
      this.goToPage(newPage);
    }
  }

  goToNextGroup(): void {
    const current = this.currentPage();
    const total = this.totalPages();
    const pageGroup = Math.floor((current - 1) / 5);
    const maxGroup = Math.floor((total - 1) / 5);
    
    if (pageGroup < maxGroup) {
      const newPage = (pageGroup + 1) * 5 + 1;
      this.goToPage(newPage);
    }
  }

  hasPreviousGroup = computed(() => {
    const total = this.totalPages();
    if (total <= 5) return false;
    
    const current = this.currentPage();
    const pageGroup = Math.floor((current - 1) / 5);
    return pageGroup > 0;
  });

  hasNextGroup = computed(() => {
    const total = this.totalPages();
    if (total <= 5) return false;
    
    const current = this.currentPage();
    const pageGroup = Math.floor((current - 1) / 5);
    const maxGroup = Math.floor((total - 1) / 5);
    return pageGroup < maxGroup;
  });

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
    this.errorMessage.set(null);
    this.successMessage.set(null);

    this.iesService.createIES(this.newIes()).subscribe({
      next: (response) => {
        // 1. Establecemos el mensaje (se verá en el toast externo)
        this.successMessage.set('Institución registrada correctamente');

        // 2. CERRAMOS EL MODAL INMEDIATAMENTE
        this.isAdding.set(false); // O llama a this.closeModal() si limpia más datos

        this.loadIES();
        this.isLoading.set(false);

        // Limpiar el toast después de unos segundos
        setTimeout(() => this.successMessage.set(null), 3500);
      },
      error: (error) => {
        console.error('Error creando IES:', error);
        this.errorMessage.set('Error al guardar: Verifique los datos');

        // 3. OPCIONAL: Cerrar también en error
        // Si quieres que el usuario corrija, no lo cierres aquí.
        // Pero si quieres que se cierre como pediste:
        this.isAdding.set(false);

        this.isLoading.set(false);
        setTimeout(() => this.errorMessage.set(null), 5000);
      },
    });
  }

  
  onSave(updatedIes: any) {
    console.log('Datos recibidos del hijo:', updatedIes);
    // Aquí iría tu lógica para llamar al servicio y actualizar en la BD
    // Al terminar, puedes cerrar la modal:
    this.backToList();
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
