import { Component, signal, computed, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IemsService } from '../../services/iems.service';
import { AuthService } from '../../services/auth.service';
import { IEMS } from '../../models/api.models';

@Component({
  selector: 'app-iems-gestion',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './iems-gestion.html',
  styleUrl: './iems-gestion.css',
})
export class IemsGestion implements OnInit {
  private iemsService = inject(IemsService);
  private authService = inject(AuthService);
  public isStateComboOpen: boolean = false;
  public isTypeComboOpen: boolean = false;
  // Exponer Math para el template
  protected readonly Math = Math;

  isLoading = signal(false);
  errorMessage = signal('');
  searchQuery = signal('');
  selectedType = signal<string>('');
  selectedState = signal<string>('all');

  // Paginación
  currentPage = signal(1);
  itemsPerPage = signal(10);
  pageSizeOptions = [10, 25, 50, 100];

  // Datos
  iemsList = signal<IEMS[]>([]);

  // Modal para crear/editar
  isAddingIEMS = signal(false);
  editingIEMS = signal<IEMS | null>(null);
  iemsForm = signal<Partial<IEMS>>({
    code: '',
    name: '',
    type: 'Bachillerato General',
    address: {
      municipality: '',
      state: '',
      country: 'México',
    },
    contact: {
      email: '',
      generalPhone: '',
    },
    active: true,
  });

  // Opciones
  typeOptions = [
    { value: 'all', label: 'Tipo de IEMS' },
    { value: 'CBTis', label: 'CBTis' },
    { value: 'CETis', label: 'CETis' },
    { value: 'CONALEP', label: 'CONALEP' },
    { value: 'Bachillerato General', label: 'Bachillerato General' },
    { value: 'Bachillerato Tecnológico', label: 'Bachillerato Tecnológico' },
    { value: 'Telebachillerato', label: 'Telebachillerato' },
    { value: 'Preparatoria', label: 'Preparatoria' },
    { value: 'Otro', label: 'Otro' },
    { value: 'TELEBACHCOMUNITARIOS', label: 'Telebachcomunitarios' },
    { value: 'TELEBACH', label: 'Telebach' },
  ];

  stateOptions = [
    'all',
    'Aguascalientes',
    'Baja California',
    'Baja California Sur',
    'Campeche',
    'Chiapas',
    'Chihuahua',
    'Ciudad de México',
    'Coahuila',
    'Colima',
    'Durango',
    'Guanajuato',
    'Guerrero',
    'Hidalgo',
    'Jalisco',
    'México',
    'Michoacán',
    'Morelos',
    'Nayarit',
    'Nuevo León',
    'Oaxaca',
    'Puebla',
    'Querétaro',
    'Quintana Roo',
    'San Luis Potosí',
    'Sinaloa',
    'Sonora',
    'Tabasco',
    'Tamaulipas',
    'Tlaxcala',
    'Veracruz',
    'Yucatán',
    'Zacatecas',
  ];

  ngOnInit(): void {
    this.loadIEMS();
  }

  /**
   * Cargar IEMS desde el backend
   */
  loadIEMS(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.iemsService.getAllIEMS().subscribe({
      next: (response) => {
        this.iemsList.set(response.data || []);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error cargando IEMS:', error);
        this.errorMessage.set('Error al cargar las IEMS');
        this.isLoading.set(false);
      },
    });
  }

  /**
   * IEMS filtradas
   */
  filteredIEMS = computed(() => {
    let filtered = this.iemsList();
    // ... (filtro de búsqueda igual)

    // Filtro por tipo: si es vacío o 'all', no filtrar
    const typeFilter = this.selectedType().toLowerCase();
    if (typeFilter && typeFilter !== 'all') {
      filtered = filtered.filter((iems) => iems.type?.toLowerCase() === typeFilter);
    }

    // ... (filtro de estado igual)
    return filtered;
  });

  /**
   * IEMS paginadas
   */
  pagedIEMS = computed(() => {
    const startIndex = (this.currentPage() - 1) * this.itemsPerPage();
    const endIndex = startIndex + this.itemsPerPage();
    return this.filteredIEMS().slice(startIndex, endIndex);
  });

  totalPages = computed(() => Math.ceil(this.filteredIEMS().length / this.itemsPerPage()));

  showingRange = computed(() => {
    const start = (this.currentPage() - 1) * this.itemsPerPage() + 1;
    const end = Math.min(this.currentPage() * this.itemsPerPage(), this.filteredIEMS().length);
    return this.filteredIEMS().length > 0 ? `${start} - ${end}` : '0';
  });

  /**
   * Abrir modal para crear IEMS
   */
  openAddIEMS(): void {
    this.iemsForm.set({
      code: '',
      name: '',
      type: 'Bachillerato General',
      address: {
        municipality: '',
        state: '',
        country: 'México',
      },
      contact: {
        email: '',
        generalPhone: '',
      },
      active: true,
    });
    this.editingIEMS.set(null);
    this.isAddingIEMS.set(true);
  }

  /**
   * Abrir modal para editar IEMS
   */
  openEditIEMS(iems: IEMS): void {
    this.iemsForm.set({ ...iems });
    this.editingIEMS.set(iems);
    this.isAddingIEMS.set(true);
  }

  /**
   * Cerrar modal
   */
  closeModal(): void {
    this.isAddingIEMS.set(false);
    this.editingIEMS.set(null);
  }

  /**
   * Guardar IEMS (crear o actualizar)
   */
  saveIEMS(): void {
    const iemsData = this.iemsForm();

    if (
      !iemsData.code ||
      !iemsData.name ||
      !iemsData.address?.municipality ||
      !iemsData.address?.state
    ) {
      alert('Por favor completa todos los campos requeridos');
      return;
    }

    this.isLoading.set(true);

    if (this.editingIEMS()) {
      // Actualizar
      this.iemsService.updateIEMS(this.editingIEMS()!._id!, iemsData).subscribe({
        next: () => {
          this.loadIEMS();
          this.closeModal();
        },
        error: (error) => {
          console.error('Error actualizando IEMS:', error);
          alert('Error al actualizar la IEMS');
          this.isLoading.set(false);
        },
      });
    } else {
      // Crear
      this.iemsService.createIEMS(iemsData).subscribe({
        next: () => {
          this.loadIEMS();
          this.closeModal();
        },
        error: (error) => {
          console.error('Error creando IEMS:', error);
          alert('Error al crear la IEMS');
          this.isLoading.set(false);
        },
      });
    }
  }

  /**
   * Eliminar IEMS
   */
  deleteIEMS(id: string): void {
    if (!confirm('¿Está seguro de eliminar esta IEMS?')) {
      return;
    }

    this.iemsService.deleteIEMS(id).subscribe({
      next: () => {
        this.loadIEMS();
      },
      error: (error) => {
        console.error('Error eliminando IEMS:', error);
        alert('Error al eliminar la IEMS');
      },
    });
  }

  // Agrega esto dentro de tu clase IemsGestion
  getTypeLabel(value: string): string {
    if (!value || value === 'all') return ''; // Retorna vacío para mostrar el placeholder
    const option = this.typeOptions.find((opt) => opt.value === value);
    return option ? option.label : '';
  }

  getLabelByType(value: string) {
    return this.typeOptions.find((o) => o.value === value)?.label;
  }

  toggleMenu() {
    this.isStateComboOpen = !this.isStateComboOpen;
  }

  toggleTypeMenu() {
    this.isTypeComboOpen = !this.isTypeComboOpen;
  }

  onTypeBlur() {
    setTimeout(() => {
      this.isTypeComboOpen = false;
    }, 250);
  }

  selectState(value: string, inputValue: string) {
    this.selectedState.set(value);
    this.isStateComboOpen = false;
  }

  onBlur() {
    setTimeout(() => {
      this.isStateComboOpen = false;
    }, 250);
  }

  toggleStatus(iems: any): void {
    const nuevoEstado = !iems.active;

    // Actualización optimista: cambiamos el valor en memoria de inmediato
    iems.active = nuevoEstado;

    // Enviamos la petición al servidor en segundo plano
    this.iemsService.updateIEMS(iems._id!, { active: nuevoEstado }).subscribe({
      next: () => {
        // No llamamos a loadIEMS() para evitar peticiones extra y parpadeos
        console.log('Estado actualizado en servidor');
      },
      error: (error) => {
        // Si falla, revertimos el cambio para que la UI sea veraz
        iems.active = !nuevoEstado;
        console.error('Error al actualizar:', error);
      },
    });
  }

  /**
   * Cambiar página
   */
  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
    }
  }

  /**
   * Cambiar items por página
   */
  onItemsPerPageChange(value: number): void {
    this.itemsPerPage.set(value);
    this.currentPage.set(1);
  }

  /**
   * Reset filtros
   */
  resetFilters(): void {
    this.searchQuery.set('');
    this.selectedType.set('all');
    this.selectedState.set('all');
    this.currentPage.set(1);
  }

  // Métodos para actualizar el formulario iemsForm
  updateCode(value: string): void {
    this.iemsForm.update((f) => ({ ...f, code: value }));
  }

  updateType(value: string): void {
    this.iemsForm.update((f) => ({ ...f, type: value as any }));
  }

  updateName(value: string): void {
    this.iemsForm.update((f) => ({ ...f, name: value }));
  }

  updateMunicipality(value: string): void {
    this.iemsForm.update((f) => ({ ...f, address: { ...f.address!, municipality: value } }));
  }

  updateState(value: string): void {
    this.iemsForm.update((f) => ({ ...f, address: { ...f.address!, state: value } }));
  }

  updatePostalCode(value: string): void {
    this.iemsForm.update((f) => ({ ...f, address: { ...f.address!, postalCode: value } }));
  }

  updateStreet(value: string): void {
    this.iemsForm.update((f) => ({ ...f, address: { ...f.address!, street: value } }));
  }

  updateNumber(value: string): void {
    this.iemsForm.update((f) => ({ ...f, address: { ...f.address!, number: value } }));
  }

  updateEmail(value: string): void {
    this.iemsForm.update((f) => ({ ...f, contact: { ...f.contact!, email: value } }));
  }

  updatePhone(value: string): void {
    this.iemsForm.update((f) => ({ ...f, contact: { ...f.contact!, generalPhone: value } }));
  }

  updateDirectorName(value: string): void {
    this.iemsForm.update((f) => ({ ...f, contact: { ...f.contact!, directorName: value } }));
  }
}
