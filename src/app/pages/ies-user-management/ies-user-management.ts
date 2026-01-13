import { Component, signal, computed, Input, Output, EventEmitter, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../services/user.service';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models/api.models';

interface UserDisplay {
  id: string;
  fullName: string;
  jobTitle: string;
  email: string;
  lastAccess: string;
  status: 'Active' | 'Inactive';
}

@Component({
  selector: 'app-ies-user-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ies-user-management.html',
  styleUrl: './ies-user-management.css',
})
export class IesUserManagement implements OnInit {
  private userService = inject(UserService);
  private authService = inject(AuthService);

  // Recibimos los datos del padre
  @Input() iesName: string = '';
  @Input() iesClave: string = '';
  @Input() iesId: string = '';

  // Evento para avisar al padre que queremos cerrar la modal
  @Output() close = new EventEmitter<void>();

  isAddingUser = signal(false);
  searchQuery = signal('');
  maxUsers = signal(10);
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);

  users = signal<UserDisplay[]>([]);
  rawUsers = signal<User[]>([]);

  ngOnInit() {
    this.loadUsers();
  }

  /**
   * Cargar usuarios de la IES
   */
  loadUsers() {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    const currentUser = this.authService.currentUser();
    const iesIdToUse = this.iesId || currentUser?.ies as string;

    if (!iesIdToUse) {
      this.errorMessage.set('No se ha especificado una IES');
      this.isLoading.set(false);
      return;
    }

    this.userService.getAllUsers({ ies: iesIdToUse }).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.rawUsers.set(response.data);
          this.users.set(this.mapUsersToDisplay(response.data));
        }
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error cargando usuarios:', error);
        this.errorMessage.set('Error al cargar usuarios');
        this.isLoading.set(false);
      }
    });
  }

  /**
   * Mapear usuarios del backend al formato de visualización
   */
  private mapUsersToDisplay(users: User[]): UserDisplay[] {
    return users.map(u => ({
      id: u._id || '',
      fullName: `${u.firstName} ${u.lastName} ${u.secondLastName || ''}`.trim(),
      jobTitle: u.role,
      email: u.email,
      lastAccess: u.updatedAt ? new Date(u.updatedAt).toISOString().split('T')[0] : 'N/A',
      status: u.active ? 'Active' : 'Inactive'
    }));
  }

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

  /**
   * Eliminar usuario
   */
  deleteUser(userId: string): void {
    if (!confirm('¿Desea eliminar este usuario?')) {
      return;
    }

    this.userService.deleteUser(userId).subscribe({
      next: () => {
        this.loadUsers();
      },
      error: (error) => {
        console.error('Error eliminando usuario:', error);
        alert('Error al eliminar el usuario');
      }
    });
  }

  /**
   * Cambiar estado activo/inactivo
   */
  toggleUserStatus(userId: string, currentStatus: 'Active' | 'Inactive'): void {
    const newStatus = currentStatus === 'Active';
    
    this.userService.toggleUserStatus(userId, !newStatus).subscribe({
      next: () => {
        this.loadUsers();
      },
      error: (error) => {
        console.error('Error cambiando estado:', error);
        alert('Error al cambiar el estado del usuario');
      }
    });
  }
}
