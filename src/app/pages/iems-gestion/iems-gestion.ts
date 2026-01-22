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
  public successMessage = signal<string | null>(null);
  public errorMessage = signal<string | null>(null);
  // Exponer Math para el template
  protected readonly Math = Math;

  isLoading = signal(false);
  searchQuery = signal('');
  selectedType = signal<string>('');
  selectedState = signal<string>('all');

  // Signals para búsqueda en combos de filtros
  typeSearchQuery = signal('');
  stateSearchQuery = signal('');
  showTypeDropdown = signal(false);
  showStateDropdown = signal(false);
  filteredTypeOptions = signal<{ value: string; label: string }[]>([]);
  filteredStateOptions = signal<string[]>([]);

  // Computed para mostrar el valor seleccionado en los inputs
  displayTypeValue = computed(() => {
    if (this.typeSearchQuery()) return this.typeSearchQuery();
    if (this.selectedType()) {
      const option = this.typeOptions.find(opt => opt.value === this.selectedType());
      return option ? option.label : '';
    }
    return '';
  });

  displayStateValue = computed(() => {
    if (this.stateSearchQuery()) return this.stateSearchQuery();
    if (this.selectedState() && this.selectedState() !== 'all') {
      return this.selectedState();
    }
    return '';
  });

  // Paginación
  currentPage = signal(1);
  itemsPerPage = signal(5);
  pageSizeOptions = [5, 10, 25, 50, 100];

  // Datos
  iemsList = signal<IEMS[]>([]);

  // --- ESTADO DE LOS COMBOS DEL MODAL ---
  isFormTypeComboOpen = false;
  isFormStateComboOpen = false;
  formTypeSearchTerm = signal('');
  formStateSearchTerm = signal('');

  // --- FILTROS REACTIVOS PARA EL MODAL ---
  filteredFormTypes = computed(() => {
    const term = this.formTypeSearchTerm().toLowerCase();
    const options = this.typeOptions.slice(1);
    return term ? options.filter((o) => o.label.toLowerCase().includes(term)) : options;
  });

  filteredFormStates = computed(() => {
    const term = this.formStateSearchTerm().toLowerCase();
    const options = this.stateOptions.slice(1);
    return term ? options.filter((s) => s.toLowerCase().includes(term)) : options;
  });

  // --- FUNCIONES DE SELECCIÓN PARA EL MODAL ---
  selectFormType(value: string) {
    this.updateType(value);
    this.isFormTypeComboOpen = false;
    this.formTypeSearchTerm.set(''); // Limpiamos para que la próxima vez salga la lista completa
  }

  selectFormState(state: string) {
    this.updateState(state);
    this.isFormStateComboOpen = false;
    this.formStateSearchTerm.set(''); // Limpiamos buscador
  }

  // Función para manejar cuando el usuario borra manualmente el input
  onTypeInput(value: string) {
    this.formTypeSearchTerm.set(value);
    // Si borra todo el texto manualmente, podrías resetear el valor del form si lo deseas:
    if (!value) {
      this.updateType('');
    }
  }

  // 1. Función Toggle para Tipo
  toggleFormType() {
    this.isFormTypeComboOpen = !this.isFormTypeComboOpen;
    if (this.isFormTypeComboOpen) {
      this.formTypeSearchTerm.set(''); // Limpia búsqueda al abrir para ver todo
    }
  }

  // 2. Función Toggle para Estado
  toggleFormState() {
    this.isFormStateComboOpen = !this.isFormStateComboOpen;
    if (this.isFormStateComboOpen) {
      this.formStateSearchTerm.set(''); // Limpia búsqueda al abrir
    }
  }

  // 3. Cierres con retraso (Opcional pero recomendado para evitar conflictos con clicOutside)
  closeTypeWithDelay() {
    setTimeout(() => {
      this.isFormTypeComboOpen = false;
    }, 200);
  }

  closeStateWithDelay() {
    setTimeout(() => {
      this.isFormStateComboOpen = false;
    }, 200);
  }

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

    { value: 'BACHEST', label: 'Bachillerato Estatal' },
    { value: 'COBACH', label: 'COBACH' },
    { value: 'DGB', label: 'DGB' },
    { value: 'DGB (CAED)', label: 'DGB (CAED)' },
    { value: 'UEMSTIS', label: 'UEMSTIS' },
    { value: 'UEMSTAYCM', label: 'UEMSTAYCM' },
    { value: 'AUTÓNOMA', label: 'Autónoma' },
    { value: 'LCAE CMYOTENTAÑA', label: 'LCAE CMYOTENTAÑA' },
    { value: 'LCOESCYTE', label: 'LCOESCYTE' },
    { value: 'CECYTE', label: 'CECYTE' },
    { value: 'GCAEMCYETZE', label: 'GCAEMCYETZE' },
    { value: 'RCAESC YIITE', label: 'RCAESC YIITE' },
    { value: 'EMSAD', label: 'EMSAD' },
    { value: 'CONALEP', label: 'CONALEP' },
    { value: 'PREPAABIERTA', label: 'Preparatoria Abierta' },
    { value: 'TELEBACH', label: 'Telebachillerato' },
    { value: 'TELEBACHCOMUNITARIOS', label: 'Telebachillerato Comunitario' },
    { value: 'CCAELCVYILTLEITO)', label: 'CCAELCVYILTLEITO' },
    { value: 'PREFECO', label: 'PREFECO' },
    { value: 'RCOECMYOTE', label: 'RCOECMYOTE' },
    { value: 'TCOOBACH', label: 'TCOOBACH' },
    { value: 'BTED', label: 'BTED' },
    { value: 'BACHPART', label: 'Bachillerato Particular' },
    { value: 'OCECYTE', label: 'OCECYTE' },
    { value: 'CBTis', label: 'CBTis' },
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
    // Inicializar opciones filtradas
    this.filteredTypeOptions.set(this.typeOptions.slice(1));
    this.filteredStateOptions.set(this.stateOptions.slice(1));
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
    const query = this.searchQuery().toLowerCase().trim();

    // 1. Filtro de búsqueda por texto (Nombre, Clave o Municipio)
    if (query) {
      filtered = filtered.filter(
        (iems) =>
          iems.name?.toLowerCase().includes(query) ||
          iems.code?.toLowerCase().includes(query) ||
          iems.address?.municipality?.toLowerCase().includes(query),
      );
    }

    // 2. Filtro por tipo: si es vacío o 'all', no filtrar
    const typeFilter = this.selectedType();
    if (typeFilter && typeFilter !== 'all') {
      filtered = filtered.filter((iems) => iems.type === typeFilter);
    }

    // 3. Filtro por estado (CORRECCIÓN AQUÍ)
    const stateFilter = this.selectedState();
    if (stateFilter && stateFilter !== 'all') {
      filtered = filtered.filter((iems) => iems.address?.state === stateFilter);
    }

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
   * Calcular las páginas a mostrar (grupos de 5)
   */
  visiblePages = computed(() => {
    const total = this.totalPages();
    if (total === 0) return [];
    
    const current = this.currentPage();
    const pages: number[] = [];
    
    // Si hay 5 o menos páginas, mostrar todas
    if (total <= 5) {
      for (let i = 1; i <= total; i++) {
        pages.push(i);
      }
      return pages;
    }
    
    // Calcular el rango de páginas a mostrar (grupos de 5)
    const pageGroup = Math.floor((current - 1) / 5);
    const startPage = pageGroup * 5 + 1;
    const endPage = Math.min(startPage + 4, total);
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return pages;
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

    // 1. Validación con mensaje de error en lugar de alert
    if (
      !iemsData.code ||
      !iemsData.name ||
      !iemsData.address?.municipality ||
      !iemsData.address?.state
    ) {
      this.showError('Por favor completa todos los campos requeridos');
      return;
    }

    this.isLoading.set(true);

    const observer = {
      next: () => {
        const msg = this.editingIEMS() ? 'IEMS actualizada con éxito' : 'IEMS creada con éxito';
        this.showSuccess(msg);
        this.loadIEMS();
        this.closeModal();
      },
      error: (error: any) => {
        console.error('Error:', error);
        this.showError(
          this.editingIEMS() ? 'Error al actualizar la IEMS' : 'Error al crear la IEMS',
        );
        this.isLoading.set(false);
      },
    };

    if (this.editingIEMS()) {
      this.iemsService.updateIEMS(this.editingIEMS()!._id!, iemsData).subscribe(observer);
    } else {
      this.iemsService.createIEMS(iemsData).subscribe(observer);
    }
  }

  // Métodos auxiliares para gestionar el auto-cierre de mensajes
  private showSuccess(message: string) {
    this.successMessage.set(message);
    setTimeout(() => this.successMessage.set(null), 5000);
  }

  private showError(message: string) {
    this.errorMessage.set(message);
    setTimeout(() => this.errorMessage.set(null), 7000);
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

  /**
   * Filtrar opciones de tipo
   */
  filterTypeOptions(query: string) {
    this.typeSearchQuery.set(query);
    this.showTypeDropdown.set(true);
    
    if (!query.trim()) {
      // Si el usuario borra todo, limpiamos la selección y mostramos todas las opciones
      this.selectedType.set('');
      this.filteredTypeOptions.set(this.typeOptions.slice(1));
      return;
    }
    
    const filtered = this.typeOptions.slice(1).filter(opt => 
      opt.label.toLowerCase().includes(query.toLowerCase())
    );
    this.filteredTypeOptions.set(filtered);
  }

  /**
   * Seleccionar tipo
   */
  selectType(typeValue: string) {
    this.selectedType.set(typeValue);
    const selectedOption = this.typeOptions.find(opt => opt.value === typeValue);
    this.typeSearchQuery.set(selectedOption ? selectedOption.label : '');
    this.showTypeDropdown.set(false);
    this.currentPage.set(1);
  }

  /**
   * Manejar focus del combo de tipo
   */
  onTypeDropdownFocus() {
    this.showTypeDropdown.set(true);
    // Si no hay texto de búsqueda, mostramos todas las opciones
    if (!this.typeSearchQuery()) {
      this.filteredTypeOptions.set(this.typeOptions.slice(1));
    }
  }

  /**
   * Manejar blur del combo de tipo
   */
  onTypeDropdownBlur() {
    setTimeout(() => {
      this.showTypeDropdown.set(false);
      // Si no hay selección, limpiamos el texto de búsqueda
      if (!this.selectedType()) {
        this.typeSearchQuery.set('');
      }
    }, 200);
  }

  /**
   * Filtrar opciones de estado
   */
  filterStateOptions(query: string) {
    this.stateSearchQuery.set(query);
    this.showStateDropdown.set(true);
    
    if (!query.trim()) {
      // Si el usuario borra todo, limpiamos la selección y mostramos todas las opciones
      this.selectedState.set('all');
      this.filteredStateOptions.set(this.stateOptions.slice(1));
      return;
    }
    
    const filtered = this.stateOptions.slice(1).filter(state => 
      state.toLowerCase().includes(query.toLowerCase())
    );
    this.filteredStateOptions.set(filtered);
  }

  /**
   * Seleccionar estado
   */
  selectStateFilter(state: string) {
    this.selectedState.set(state);
    this.stateSearchQuery.set(state);
    this.showStateDropdown.set(false);
    this.currentPage.set(1);
  }

  /**
   * Manejar focus del combo de estado
   */
  onStateDropdownFocus() {
    this.showStateDropdown.set(true);
    // Si no hay texto de búsqueda, mostramos todas las opciones
    if (!this.stateSearchQuery()) {
      this.filteredStateOptions.set(this.stateOptions.slice(1));
    }
  }

  /**
   * Manejar blur del combo de estado
   */
  onStateDropdownBlur() {
    setTimeout(() => {
      this.showStateDropdown.set(false);
      // Si no hay selección o es 'all', limpiamos el texto de búsqueda
      if (!this.selectedState() || this.selectedState() === 'all') {
        this.stateSearchQuery.set('');
      }
    }, 200);
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
   * Ir al grupo anterior de páginas (5 páginas atrás)
   */
  goToPreviousGroup(): void {
    const current = this.currentPage();
    const pageGroup = Math.floor((current - 1) / 5);
    if (pageGroup > 0) {
      const newPage = (pageGroup - 1) * 5 + 1;
      this.goToPage(newPage);
    }
  }

  /**
   * Ir al grupo siguiente de páginas (5 páginas adelante)
   */
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

  /**
   * Verificar si hay un grupo anterior
   */
  hasPreviousGroup = computed(() => {
    const total = this.totalPages();
    if (total <= 5) return false;
    
    const current = this.currentPage();
    const pageGroup = Math.floor((current - 1) / 5);
    return pageGroup > 0;
  });

  /**
   * Verificar si hay un grupo siguiente
   */
  hasNextGroup = computed(() => {
    const total = this.totalPages();
    if (total <= 5) return false;
    
    const current = this.currentPage();
    const pageGroup = Math.floor((current - 1) / 5);
    const maxGroup = Math.floor((total - 1) / 5);
    return pageGroup < maxGroup;
  });

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
    this.selectedType.set('');
    this.selectedState.set('all');
    this.typeSearchQuery.set('');
    this.stateSearchQuery.set('');
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

