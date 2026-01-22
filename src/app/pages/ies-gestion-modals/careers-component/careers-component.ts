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
        // Accedemos a response.data.careers según tu JSON de ejemplo
        const rawCareers = response?.data?.careers ?? [];

        // Mapeamos los campos del backend a tu interfaz Career
        const mappedCareers: Career[] = rawCareers.map((c: any) => ({
          // Guardamos el ID aunque no esté en la interfaz (opcional, para delete/edit)
          id: c.carreraId || c._id,
          name: c.carreraName, // Mapeo de carreraName -> name
          shortName: c.shortName || '',
          code: c.code || 'S/C',
          careerLink: c.careerLink || '',
          modality: c.modality || 'Presencial',
          active: c.active !== undefined ? c.active : true,
          capacityPerSemester: c.capacityPerSemester || 0,
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
    const data = this.carreraForm();

    // Validación básica
    if (!data.name || !data.code) {
      alert('Por favor complete el nombre y código de la carrera');
      return;
    }

    this.isLoading.set(true);

    // Preparamos el objeto a enviar basándonos en lo que espera tu API
    // A veces el backend espera 'carreraName' en lugar de 'name' al crear
    const payload = {
      name: data.name,
      shortName: data.shortName || '',
      code: data.code,
      careerLink: data.careerLink || '',
      modality: data.modality,
      active: data.active,
    };

    this.iesService.createCareerIES(this.iesId(), payload).subscribe({
      next: (response) => {
        if (response.success) {
          this.isFormOpen.set(false);
          this.loadCarreras(); // Recargamos la tabla para ver la nueva carrera
          // Opcional: limpiar el formulario
          this.carreraForm.set({
            name: '',
            code: '',
            modality: 'Presencial',
            active: true,
            capacityPerSemester: 0,
          });
        }
      },
      error: (err) => {
        console.error('Error al guardar la carrera:', err);
        alert('No se pudo guardar la carrera. Intente de nuevo.');
        this.isLoading.set(false);
      },
    });
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
    // Consultar la información completa de la carrera desde el API
    const careerId = (carrera as any).id || (carrera as any)._id;
    
    if (!careerId) {
      console.error('No se encontró ID de la carrera');
      return;
    }

    this.isLoading.set(true);
    
    this.iesService.getCareerById(careerId).subscribe({
      next: (response: any) => {
        console.log('📋 Carrera obtenida:', response);
        
        // Manejar diferentes estructuras de respuesta
        const careerData = response.data || response;
        
        if (careerData) {
          // Mapear los datos de la API al formulario
          const mappedCareer: any = {
            id: careerData._id || careerData.id, // Guardamos el ID para la edición
            name: careerData.name,
            shortName: careerData.shortName || '',
            code: careerData.code || '',
            careerLink: careerData.careerLink || '',
            modality: careerData.modality || 'Presencial',
            active: careerData.active !== undefined ? careerData.active : true,
            capacityPerSemester: careerData.capacityPerSemester || 0,
          };
          
          this.editingCarrera.set(mappedCareer);
          this.carreraForm.set(mappedCareer);
          this.modalitySearchQuery.set(mappedCareer.modality || 'Presencial');
          this.isFormOpen.set(true);
        }
        
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('❌ Error al cargar la carrera:', error);
        this.isLoading.set(false);
        alert('Error al cargar la información de la carrera');
      }
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
    
    const filtered = this.modalityOptions.filter(modality => 
      modality.toLowerCase().includes(query.toLowerCase())
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
}
