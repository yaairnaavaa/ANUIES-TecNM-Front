import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { CycleService } from '../../services/cycle.service';
import { Period } from '../../models/api.models';
import { tap, catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';

// Interfaz adaptada para los datos reales del API
interface CycleApiResponse {
  _id: string;
  name: string;
  code: string;
  description?: string;
  period: {
    startDate: string | Date;
    endDate: string | Date;
  };
  active: boolean;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

// Interfaz adaptada para uso interno
interface Cycle extends CycleApiResponse {
  status?: string; // Calculado desde 'active'
  isCurrent?: boolean; // Calculado
}

@Component({
  selector: 'app-cycles',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './cycles.html',
})
export class Cycles implements OnInit {
  // Services
  private cycleService = inject(CycleService);
  private fb = inject(FormBuilder);

  // Data Management
  cyclesList = signal<Cycle[]>([]);

  // UI State
  searchTerm = signal('');
  isModalOpen = signal(false);
  currentPage = signal(1);
  itemsPerPage = signal(5);
  pageSizeOptions = [5, 10, 20, 50];
  isLoading = signal(false);
  errorMessage = signal('');
  successMessage = signal('');

  // Form
  cycleForm!: FormGroup;

  ngOnInit() {
    this.initializeForm();
    this.loadCycles();
  }

  /**
   * Inicializar formulario
   */
  initializeForm() {
    this.cycleForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      code: ['', Validators.required],
      description: [''],
      startDate: ['', Validators.required],
      endDate: ['', Validators.required],
      active: [false, Validators.required],
    });
  }

  /**
   * Cargar ciclos desde el API
   */
  loadCycles() {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.cycleService
      .getAllCycles()
      .pipe(
        tap((response: any) => {
          if (response.data && Array.isArray(response.data)) {
            // Adaptar los datos del API al formato interno
            const adaptedCycles: Cycle[] = response.data.map((cycle: CycleApiResponse) => ({
              ...cycle,
              status: cycle.active ? 'Activo' : 'Finalizado',
              isCurrent: cycle.active,
            }));
            this.cyclesList.set(adaptedCycles);
          } else {
            this.cyclesList.set([]);
          }
        }),
        catchError((error) => {
          console.error('Error al cargar ciclos:', error);
          this.errorMessage.set(
            `Error al cargar los ciclos: ${error.message || 'Por favor, intenta de nuevo.'}`,
          );
          this.cyclesList.set([]);
          return of(null);
        }),
        finalize(() => {
          this.isLoading.set(false);
        }),
      )
      .subscribe();
  }

  /**
   * Guardar nuevo ciclo
   */
  /**
   * Lógica unificada para Guardar (Crear o Actualizar)
   */
  saveCycle() {
    // 1. Validación inicial
    if (this.cycleForm.invalid) {
      this.markFormGroupTouched(this.cycleForm);
      this.errorMessage.set('Por favor, completa todos los campos requeridos correctamente.');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    // 2. Estructurar la data según el modelo del API
    const cycleData = {
      name: this.cycleForm.value.name,
      code: this.cycleForm.value.code,
      description: this.cycleForm.value.description || '',
      period: {
        startDate: this.cycleForm.value.startDate,
        endDate: this.cycleForm.value.endDate,
      },
      active: this.cycleForm.value.active,
    };

    // 3. Determinar si es Creación o Actualización
    const isEditMode = this.isEditing();
    const cycleId = this.selectedCycleId();

    const request$ =
      isEditMode && cycleId
        ? this.cycleService.updateCycle(cycleId, cycleData) // <-- Tu nuevo método
        : this.cycleService.createCycle(cycleData);

    // 4. Ejecutar petición
    request$
      .pipe(
        tap(() => {
          const successText = isEditMode
            ? 'Ciclo actualizado correctamente.'
            : 'Ciclo creado exitosamente.';

          this.successMessage.set(successText);
          this.loadCycles(); // Recargar la lista para ver los cambios

          // Cerrar modal tras un breve delay para que el usuario vea el mensaje de éxito
          setTimeout(() => {
            this.closeModal();
          }, 1500);
        }),
        catchError((error) => {
          console.error('Error en la operación:', error);
          this.errorMessage.set(
            error.error?.message || 'Error al procesar la solicitud. Intenta de nuevo.',
          );
          return of(null);
        }),
        finalize(() => {
          this.isLoading.set(false);
        }),
      )
      .subscribe();
  }

  /**
   * Marcar todos los campos del formulario como touched
   */
  private markFormGroupTouched(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach((key) => {
      const control = formGroup.get(key);
      control?.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  // Filtered List
  filteredCycles = computed(() => {
    const term = this.searchTerm().toLowerCase();
    const allCycles = this.cyclesList();

    // Filtrar por término de búsqueda y excluir ciclos activos
    return allCycles.filter((c) => {
      const matchesSearch = c.name.toLowerCase().includes(term);
      const isNotActive = c.status !== 'Activo' && !c.isCurrent;
      return matchesSearch && isNotActive;
    });
  });

  // Active Cycle Helper
  activeCycle = computed(() => this.cyclesList().find((c) => c.status === 'Activo' || c.isCurrent));

  // Paginated cycles
  pagedCycles = computed(() => {
    const startIndex = (this.currentPage() - 1) * this.itemsPerPage();
    const endIndex = startIndex + this.itemsPerPage();
    return this.filteredCycles().slice(startIndex, endIndex);
  });

  // Pagination Helper
  totalPages = computed(() => Math.ceil(this.filteredCycles().length / this.itemsPerPage()) || 1);

  showingRange = computed(() => {
    const start = (this.currentPage() - 1) * this.itemsPerPage() + 1;
    const end = Math.min(this.currentPage() * this.itemsPerPage(), this.filteredCycles().length);
    return this.filteredCycles().length > 0 ? `${start} - ${end}` : '0';
  });

  openModal() {
    this.cycleForm.reset({
      active: false,
    });
    this.errorMessage.set('');
    this.successMessage.set('');
    this.isModalOpen.set(true);
  }

  closeModal() {
    this.isModalOpen.set(false);
    this.isEditing.set(false);
    this.selectedCycleId.set(null);
    this.cycleForm.reset({ active: true });
  }

  clearSearch() {
    this.searchTerm.set('');
    this.currentPage.set(1);
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

  activeActionMenu = signal<string | null>(null);
  isEditing = signal<boolean>(false);
  selectedCycleId = signal<string | null>(null);

  // Abrir menú de acciones
  toggleActions(id: string) {
    this.activeActionMenu.set(this.activeActionMenu() === id ? null : id);
  }

  toggleStatus(cycle: Cycle) {
    // 1. Cerramos el menú de acciones y activamos el estado de carga
    this.activeActionMenu.set(null);
    this.isLoading.set(true);
    this.errorMessage.set('');

    // 2. Definimos el nuevo estado (el opuesto al actual)
    const newStatus = !cycle.active;

    // 3. Llamamos al servicio usando el ID del ciclo
    // Solo enviamos el campo 'active' ya que es un PATCH
    this.cycleService;
    this.cycleService
      .updateCycle(cycle._id, { active: newStatus })
      .pipe(
        tap(() => {
          // 4. Feedback visual de éxito
          const action = newStatus ? 'activado' : 'desactivado';
          this.successMessage.set(`El ciclo "${cycle.name}" ha sido ${action} con éxito.`);

          // 5. Recargamos la lista para actualizar los signals y el computed del 'activeCycle'
          this.loadCycles();

          // Limpiamos el mensaje de éxito después de 3 segundos
          setTimeout(() => this.successMessage.set(''), 3000);
        }),
        catchError((error) => {
          console.error('Error al cambiar estado:', error);
          this.errorMessage.set(
            error.error?.message || 'No se pudo cambiar el estado del ciclo. Intenta de nuevo.',
          );
          return of(null);
        }),
        finalize(() => {
          this.isLoading.set(false);
        }),
      )
      .subscribe();
  }

  /**
   * Helper para formatear fechas al formato de input date (YYYY-MM-DD)
   */
  private formatDate(date: any): string {
    if (!date) return '';
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  }

  /**
   * Preparar modal para edición
   */
  editCycle(cycle: Cycle) {
    this.isEditing.set(true);
    this.selectedCycleId.set(cycle._id); // Asegúrate de usar _id
    this.activeActionMenu.set(null);

    this.cycleForm.patchValue({
      name: cycle.name,
      code: cycle.code,
      active: cycle.active,
      description: cycle.description,
      startDate: this.formatDate(cycle.period.startDate),
      endDate: this.formatDate(cycle.period.endDate),
    });

    this.isModalOpen.set(true);
  }
}
