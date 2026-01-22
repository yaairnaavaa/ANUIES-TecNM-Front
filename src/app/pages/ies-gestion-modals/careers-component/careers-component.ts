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

  // Formulario adaptado a la interfaz Career
  carreraForm = signal<Partial<Career>>({
    code: '',
    name: '',
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
          code: c.code || 'S/C',
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
      code: data.code,
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
    this.isFormOpen.set(true);
  }

  openEditCarrera(carrera: Career) {
    this.editingCarrera.set(carrera);
    this.carreraForm.set({ ...carrera });
    this.isFormOpen.set(true);
  }

  toggleActiveForm() {
    this.carreraForm.update((prev) => ({ ...prev, active: !prev.active }));
  }

  deleteCarrera(id: string) {
    if (confirm('¿Eliminar esta carrera?')) {
      // Nota: Aquí asumo que guardaste el id en el mapeo
      this.carrerasList.update((list: any[]) => list.filter((c) => c.id !== id));
    }
  }
}
