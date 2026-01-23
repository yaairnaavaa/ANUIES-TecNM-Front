import { Component, signal, computed, output, inject, OnInit, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IesService } from '../../../services/ies.service';
import { Career } from '../../../models/api.models';

@Component({
  selector: 'app-careers-component',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './careers-component.html',
  styleUrl: './careers-component.css',
})
export class CareersComponent implements OnInit {
  private iesService = inject(IesService);
  iesId = input.required<string>();
  onClose = output<void>();
  onSave = output<any>();

  // Usamos tu interfaz Career
  carrerasList = signal<Career[]>([]);
  isLoading = signal(false);

  searchQuery = signal('');
  isFormOpen = signal(false);
  editingCarrera = signal<Career | null>(null);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  // Signals para el combo de modalidad
  modalitySearchQuery = signal('');
  showModalityDropdown = signal(false);
  modalityOptions: ('Presencial' | 'Virtual')[] = ['Presencial', 'Virtual'];
  filteredModalities = signal<('Presencial' | 'Virtual')[]>(['Presencial', 'Virtual']);

  // Formulario adaptado a la interfaz Career
  carreraForm = signal<Partial<Career>>({
    code: '',
    name: '',
    shortName: '',
    careerLink: '',
    modality: 'Presencial',
    active: true,
    capacityPerSemester: 0,
  });

  ngOnInit() {
    this.loadCarreras();
  }

  loadCarreras() {
    this.isLoading.set(true);

    this.iesService.getCareersIES(this.iesId()).subscribe({
      next: (response: any) => {
        // 1. Cambiamos response.data.careers por response.data
        const rawCareers = response?.data ?? [];

        const mappedCareers: Career[] = rawCareers.map((c: any) => ({
          // 2. Usamos c._id porque en el JSON no viene carreraId
          id: c._id,

          // 3. Usamos c.name porque en el JSON no existe carreraName
          name: c.name,

          shortName: c.shortName || '',
          code: c.code || 'S/C',
          careerLink: c.careerLink || '',
          modality: c.modality || 'Presencial',
          active: c.active !== undefined ? c.active : true,
          capacityPerSemester: c.capacityPerSemester || 0,

          // Usamos c.name también aquí
          _originalName: c.name,
        }));

        this.carrerasList.set(mappedCareers);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error al cargar carreras', err);
        this.carrerasList.set([]);
        this.isLoading.set(false);
      },
    });
  }

  // El filtro ahora usa .name y .code de tu interfaz
  filteredCarreras = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    if (!query) return this.carrerasList();
    return this.carrerasList().filter(
      (c) => c.name?.toLowerCase().includes(query) || c.code?.toLowerCase().includes(query),
    );
  });

  saveCarrera() {
    const formData = this.carreraForm();
    const editingData = this.editingCarrera(); // Aquí está el nombre original

    if (!formData.name || !formData.code) {
      alert('Nombre y código son obligatorios');
      return;
    }

    this.isLoading.set(true);

    // Limpieza del payload (incluyendo el fix de la URL vacía)
    const payload: any = {
      name: formData.name, // Nombre nuevo (por si se cambió)
      shortName: formData.shortName || '',
      code: formData.code,
      modality: formData.modality,
      active: formData.active,
      capacityPerSemester: formData.capacityPerSemester || 0,
    };

    if (formData.careerLink?.trim()) {
      payload.careerLink = formData.careerLink.trim();
    }

    if (editingData) {
      const careerId = (editingData as any).id;

      if (!careerId) {
        alert('No se pudo identificar el ID de la carrera');
        this.isLoading.set(false);
        return;
      }

      this.iesService.updateCareerIES(careerId, payload).subscribe({
        next: () => {
          this.handleSuccess('Carrera actualizada');
          this.showToast('success', '¡Carrera actualizada correctamente!');
          this.isFormOpen.set(false);
        },
        error: (err) => this.handleError('Error al actualizar la carrera', err),
      });
    } else {
      // Lógica de creación...
      this.iesService.createCareerIES(this.iesId(), payload).subscribe({
        next: () => {
          this.handleSuccess('Carrera creada');
          this.showToast('success', '¡Carrera guardada correctamente!');
          this.isFormOpen.set(false);
        },
        error: (err) => {
          this.handleError('Error al crear', err);
          this.showToast('error', 'No se pudo guardar la carrera.');
        },
      });
    }
  }

  // Métodos auxiliares para no repetir código
  private handleSuccess(message: string) {
    this.isFormOpen.set(false);
    this.loadCarreras();
    this.isLoading.set(false);
    // Limpiar formulario
    this.editingCarrera.set(null);
    this.carreraForm.set({
      name: '',
      code: '',
      modality: 'Presencial',
      active: true,
      capacityPerSemester: 0,
      careerLink: '',
    });
  }

  private handleError(message: string, err: any) {
    console.error(message, err);
    alert(message);
    this.isLoading.set(false);
  }

  openAddCarrera() {
    this.editingCarrera.set(null);
    this.carreraForm.set({
      code: '',
      name: '',
      modality: 'Presencial',
      active: true,
      capacityPerSemester: 0,
    });
    this.modalitySearchQuery.set('Presencial');
    this.isFormOpen.set(true);
  }

  openEditCarrera(carrera: Career) {
    this.isLoading.set(true);

    this.iesService.getCareerById((carrera as any).id).subscribe({
      next: (response: any) => {
        const careerData = response.data || response;

        if (careerData) {
          const mappedCareer: Career = {
            id: careerData._id || careerData.id,
            name: careerData.name,
            shortName: careerData.shortName || '',
            code: careerData.code || '',
            careerLink: careerData.careerLink || '',
            modality: careerData.modality || 'Presencial',
            active: careerData.active ?? true,
            capacityPerSemester: careerData.capacityPerSemester || 0,

            // 🔑 ESTE es el nombre intocable
            _originalName: careerData.name,
          } as any;

          this.editingCarrera.set({ ...mappedCareer });
          this.carreraForm.set({ ...mappedCareer });

          // 🔑 sincroniza el input visual
          this.modalitySearchQuery.set(mappedCareer.modality || 'Presencial');

          this.isFormOpen.set(true);
        }

        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        alert('Error al cargar la información de la carrera');
      },
    });
  }

  toggleActiveForm() {
    this.carreraForm.update((prev) => ({ ...prev, active: !prev.active }));
  }

  /**
   * Filtrar opciones de modalidad
   */
  filterModalities(query: string) {
    this.modalitySearchQuery.set(query);
    this.showModalityDropdown.set(true);

    if (!query.trim()) {
      this.filteredModalities.set(this.modalityOptions);
      return;
    }

    const filtered = this.modalityOptions.filter((modality) =>
      modality.toLowerCase().includes(query.toLowerCase()),
    );
    this.filteredModalities.set(filtered);
  }

  /**
   * Seleccionar modalidad
   */
  selectModality(modality: 'Presencial' | 'Virtual') {
    this.carreraForm.update((prev) => ({ ...prev, modality }));
    this.modalitySearchQuery.set(modality);
    this.showModalityDropdown.set(false);
  }

  /**
   * Manejar focus del combo de modalidad
   */
  onModalityDropdownFocus() {
    this.showModalityDropdown.set(true);
    if (!this.modalitySearchQuery()) {
      this.filteredModalities.set(this.modalityOptions);
    }
  }

  /**
   * Manejar blur del combo de modalidad
   */
  onModalityDropdownBlur() {
    setTimeout(() => {
      this.showModalityDropdown.set(false);
      if (!this.carreraForm().modality) {
        this.modalitySearchQuery.set('');
      }
    }, 200);
  }

  /**
   * Obtener el valor a mostrar en el input de modalidad
   */
  getModalityDisplayValue(): string {
    if (this.modalitySearchQuery()) return this.modalitySearchQuery();
    if (this.carreraForm().modality) {
      return this.carreraForm().modality || '';
    }
    return '';
  }

  deleteCarrera(id: string) {
    if (confirm('¿Eliminar esta carrera?')) {
      // Nota: Aquí asumo que guardaste el id en el mapeo
      this.carrerasList.update((list: any[]) => list.filter((c) => c.id !== id));
    }
  }

  // Función auxiliar para mostrar mensajes con auto-cierre
  showToast(type: 'success' | 'error', message: string) {
    if (type === 'success') {
      this.successMessage.set(message);
      setTimeout(() => this.successMessage.set(null), 4000);
    } else {
      this.errorMessage.set(message);
      setTimeout(() => this.errorMessage.set(null), 5000);
    }
  }
}
