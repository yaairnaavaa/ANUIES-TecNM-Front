import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IES } from '../../models/ies.model';
import { IesUserManagement } from '../ies-user-management/ies-user-management';
@Component({
  selector: 'app-ies-gestion',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, IesUserManagement], // Añadido aquí  templateUrl: './ies-gestion.html',
  templateUrl: './ies-gestion.html',
})
export class IesGestion {
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

  // Datos (Se llenará con servicio después)
  iesList = signal<IES[]>([
    {
      nombre: 'Tecnológico Nacional de México',
      claveOficial: '13MSU0010Z',
      estatus: 'Activa',
      contacto: { email: 'ies@tecnm.mx', telefono: '5551234567', responsable: 'Jorge Betancourt' },
    },
    {
      nombre: 'Instituto Tecnológico de Pachuca',
      claveOficial: '13DIT0001D',
      estatus: 'Activa',
      contacto: {
        email: 'contacto@itpachuca.edu.mx',
        telefono: '7711234567',
        responsable: 'Maria Garcia',
      },
    },
    {
      nombre: 'Instituto Tecnológico de Pachuca',
      claveOficial: '13DIT0001D',
      estatus: 'Activa',
      contacto: {
        email: 'contacto@itpachuca.edu.mx',
        telefono: '7711234567',
        responsable: 'Maria Garcia',
      },
    },
    {
      nombre: 'Instituto Tecnológico de Pachuca',
      claveOficial: '13DIT0001D',
      estatus: 'Activa',
      contacto: {
        email: 'contacto@itpachuca.edu.mx',
        telefono: '7711234567',
        responsable: 'Maria Garcia',
      },
    },
    {
      nombre: 'Instituto Tecnológico de Pachuca',
      claveOficial: '13DIT0001D',
      estatus: 'Activa',
      contacto: {
        email: 'contacto@itpachuca.edu.mx',
        telefono: '7711234567',
        responsable: 'Maria Garcia',
      },
    },
    {
      nombre: 'Instituto Tecnológico de Pachuca',
      claveOficial: '13DIT0001D',
      estatus: 'Activa',
      contacto: {
        email: 'contacto@itpachuca.edu.mx',
        telefono: '7711234567',
        responsable: 'Maria Garcia',
      },
    },
    // Simula más datos para probar la paginación si lo deseas agregando objetos aquí
  ]);

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
      (ies) =>
        ies.nombre.toLowerCase().includes(query) || ies.claveOficial.toLowerCase().includes(query)
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
      this.allFilteredResults().length
    );
    return this.allFilteredResults().length > 0 ? `${start} - ${end}` : '0';
  });

  newIes = signal<IES>(this.resetForm());

  resetForm(): IES {
    return {
      nombre: '',
      claveOficial: '',
      estatus: 'Activa',
      contacto: { email: '', telefono: '', responsable: '' },
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

  saveIES() {
    this.isLoading.set(true);
    setTimeout(() => {
      this.iesList.update((list) => [...list, { ...this.newIes() }]);
      this.isLoading.set(false);
      this.toggleAdd();
    }, 1500);
  }
}
