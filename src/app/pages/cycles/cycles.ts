import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CycleService } from '../../services/cycle.service';
import { Period } from '../../models/api.models';
import { tap, catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';

// Interfaz adaptada para los datos reales del API
interface CycleApiResponse {
  _id?: string;
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
  pageSize = signal(10);
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

    this.cycleService.getAllCycles()
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
        catchError(error => {
          console.error('Error al cargar ciclos:', error);
          this.errorMessage.set(`Error al cargar los ciclos: ${error.message || 'Por favor, intenta de nuevo.'}`);
          this.cyclesList.set([]);
          return of(null);
        }),
        finalize(() => {
          this.isLoading.set(false);
        })
      )
      .subscribe();
  }

  /**
   * Guardar nuevo ciclo
   */
  saveCycle() {
    if (this.cycleForm.invalid) {
      this.markFormGroupTouched(this.cycleForm);
      this.errorMessage.set('Por favor, completa todos los campos requeridos.');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

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

    this.cycleService.createCycle(cycleData)
      .pipe(
        tap(response => {
          this.successMessage.set('Ciclo creado exitosamente.');
          this.loadCycles(); // Recargar lista
          
          // Cerrar modal después de 2 segundos
          setTimeout(() => {
            this.closeModal();
          }, 2000);
        }),
        catchError(error => {
          console.error('Error al guardar ciclo:', error);
          this.errorMessage.set(
            error.error?.message || 'Error al crear el ciclo. Por favor, intenta de nuevo.'
          );
          return of(null);
        }),
        finalize(() => {
          this.isLoading.set(false);
        })
      )
      .subscribe();
  }

  /**
   * Marcar todos los campos del formulario como touched
   */
  private markFormGroupTouched(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach(key => {
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

  // Pagination Helper
  totalPages = computed(() => Math.ceil(this.filteredCycles().length / this.pageSize()));

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
    this.cycleForm.reset();
    this.errorMessage.set('');
    this.successMessage.set('');
  }

  clearSearch() {
    this.searchTerm.set('');
  }
}
