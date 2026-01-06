import { Component, signal, computed, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserOperative } from '../../models/user-operative.model';

@Component({
  selector: 'app-ies-user-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ies-user-management.html',
  styleUrl: './ies-user-management.css',
})
export class IesUserManagement {
  // Recibimos los datos del padre
  @Input() iesName: string = '';
  @Input() iesClave: string = '';

  // Evento para avisar al padre que queremos cerrar la modal
  @Output() close = new EventEmitter<void>();

  isAddingUser = signal(false);
  searchQuery = signal('');
  maxUsers = signal(10);

  users = signal<UserOperative[]>([
    {
      id: '1',
      fullName: 'Juan Pérez',
      jobTitle: 'Control Escolar',
      email: 'juan.p@tecnm.mx',
      lastAccess: '2026-01-04',
      status: 'Active',
    },
        {
      id: '1',
      fullName: 'Juan Pérez',
      jobTitle: 'Control Escolar',
      email: 'juan.p@tecnm.mx',
      lastAccess: '2026-01-04',
      status: 'Active',
    },    {
      id: '1',
      fullName: 'Juan Pérez',
      jobTitle: 'Control Escolar',
      email: 'juan.p@tecnm.mx',
      lastAccess: '2026-01-04',
      status: 'Active',
    },    {
      id: '1',
      fullName: 'Juan Pérez',
      jobTitle: 'Control Escolar',
      email: 'juan.p@tecnm.mx',
      lastAccess: '2026-01-04',
      status: 'Active',
    },    {
      id: '1',
      fullName: 'Juan Pérez',
      jobTitle: 'Control Escolar',
      email: 'juan.p@tecnm.mx',
      lastAccess: '2026-01-04',
      status: 'Active',
    },    {
      id: '1',
      fullName: 'Juan Pérez',
      jobTitle: 'Control Escolar',
      email: 'juan.p@tecnm.mx',
      lastAccess: '2026-01-04',
      status: 'Active',
    },    {
      id: '1',
      fullName: 'Juan Pérez',
      jobTitle: 'Control Escolar',
      email: 'juan.p@tecnm.mx',
      lastAccess: '2026-01-04',
      status: 'Active',
    },    {
      id: '1',
      fullName: 'Juan Pérez',
      jobTitle: 'Control Escolar',
      email: 'juan.p@tecnm.mx',
      lastAccess: '2026-01-04',
      status: 'Active',
    },    {
      id: '1',
      fullName: 'Juan Pérez',
      jobTitle: 'Control Escolar',
      email: 'juan.p@tecnm.mx',
      lastAccess: '2026-01-04',
      status: 'Active',
    },    {
      id: '1',
      fullName: 'Juan Pérez',
      jobTitle: 'Control Escolar',
      email: 'juan.p@tecnm.mx',
      lastAccess: '2026-01-04',
      status: 'Inactive',
    },
    {
      id: '2',
      fullName: 'Ana López',
      jobTitle: 'Director Académico',
      email: 'ana.l@tecnm.mx',
      lastAccess: '2025-12-20',
      status: 'Active',
    },
  ]);

  filteredUsers = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    return this.users().filter(
      (u) => u.fullName.toLowerCase().includes(query) || u.email.toLowerCase().includes(query)
    );
  });

  totalUsers = computed(() => this.users().length);

  // Propiedad computada para saber si ya no caben más usuarios
  isLimitReached = computed(() => this.users().length >= this.maxUsers());

  // Esta es la función que te marcaba el error en el HTML
  toggleAddUser(): void {
    if (this.isLimitReached() && !this.isAddingUser()) {
      alert('Se ha alcanzado el límite máximo de usuarios permitidos.');
      return;
    }
    this.isAddingUser.update((val) => !val);
  }

  // Reemplazamos el método problemático por uno que emite el evento
  backToList(): void {
    this.close.emit();
  }

  getInitials(name: string): string {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }

  deleteUser(userId: string): void {
    if (confirm('¿Desea eliminar este usuario?')) {
      this.users.update((list) => list.filter((u) => u.id !== userId));
    }
  }
}
