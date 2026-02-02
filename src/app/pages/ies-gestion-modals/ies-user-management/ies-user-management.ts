import {
  Component,
  signal,
  computed,
  Input,
  Output,
  EventEmitter,
  OnInit,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../../services/user.service';
import { AuthService } from '../../../services/auth.service';
import { RoleService } from '../../../services/role.service';
import { NotificationService } from '../../../services/notification.service';
import { User, Role } from '../../../models/api.models';

interface UserDisplay {
  id: string;
  fullName: string;
  jobTitle: string;
  email: string;
  lastAccess: string;
  status: 'Active' | 'Inactive';
}

interface NewUserForm {
  firstName: string;
  lastName: string;
  secondLastName: string;
  email: string;
  password: string;
  phone: string;
  role: string;
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
  private roleService = inject(RoleService);
  private notificationService = inject(NotificationService);

  // Recibimos los datos del padre
  @Input() iesName: string = '';
  @Input() iesClave: string = '';
  @Input() iesId: string = '';

  // Evento para avisar al padre que queremos cerrar la modal
  @Output() close = new EventEmitter<void>();

  isAddingUser = signal(false);
  searchQuery = signal('');
  maxUsers = signal(50);
  isLoading = signal(false);
  isSaving = signal(false);
  errorMessage = signal<string | null>(null);

  users = signal<UserDisplay[]>([]);
  rawUsers = signal<User[]>([]);
  availableRoles = signal<Role[]>([]);

  // Signals para el combo de rol
  roleSearchQuery = signal('');
  showRoleDropdown = signal(false);
  filteredRoles = signal<Role[]>([]);

  // Formulario para nuevo usuario
  newUser = signal<NewUserForm>({
    firstName: '',
    lastName: '',
    secondLastName: '',
    email: '',
    password: '',
    phone: '',
    role: ''
  });

  ngOnInit() {
    this.loadUsers();
    this.loadRoles();
  }

  /**
   * Cargar roles disponibles
   */
  loadRoles() {
    this.roleService.getAllRoles().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          // Filtrar solo roles relacionados con IES
          const roles = response.data.filter(r =>
            r.name === 'Admin IES' || r.name === 'Operativo IES'
          );
          this.availableRoles.set(roles);
          this.filteredRoles.set(roles);
        }
      },
      error: (error) => {
        console.error('Error cargando roles:', error);
      },
    });
  }

  /**
   * Filtrar opciones de rol
   */
  filterRoles(query: string) {
    this.roleSearchQuery.set(query);
    this.showRoleDropdown.set(true);

    if (!query.trim()) {
      this.filteredRoles.set(this.availableRoles());
      return;
    }

    const filtered = this.availableRoles().filter(role =>
      role.displayName?.toLowerCase().includes(query.toLowerCase()) ||
      role.name?.toLowerCase().includes(query.toLowerCase())
    );
    this.filteredRoles.set(filtered);
  }

  /**
   * Seleccionar rol
   */
  selectRole(roleId: string) {
    this.newUser.update(user => ({ ...user, role: roleId }));
    const selectedRole = this.availableRoles().find(r => r._id === roleId);
    this.roleSearchQuery.set(selectedRole ? (selectedRole.displayName || selectedRole.name) : '');
    this.showRoleDropdown.set(false);
  }

  /**
   * Manejar focus del combo de rol
   */
  onRoleDropdownFocus() {
    this.showRoleDropdown.set(true);
    if (!this.roleSearchQuery()) {
      this.filteredRoles.set(this.availableRoles());
    }
  }

  /**
   * Manejar blur del combo de rol
   */
  onRoleDropdownBlur() {
    setTimeout(() => {
      this.showRoleDropdown.set(false);
      if (!this.newUser().role) {
        this.roleSearchQuery.set('');
      }
    }, 200);
  }

  /**
   * Obtener el valor a mostrar en el input del rol
   */
  getRoleDisplayValue(): string {
    if (this.roleSearchQuery()) return this.roleSearchQuery();
    if (this.newUser().role) {
      const role = this.availableRoles().find(r => r._id === this.newUser().role);
      return role ? (role.displayName || role.name) : '';
    }
    return '';
  }

  /**
   * Cargar usuarios de la IES
   */
  loadUsers() {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    const currentUser = this.authService.currentUser();
    const iesIdToUse = this.iesId || (currentUser?.ies as string);

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
      },
    });
  }

  /**
   * Mapear usuarios del backend al formato de visualización
   */
  private mapUsersToDisplay(users: User[]): UserDisplay[] {
    return users.map((u) => ({
      id: u._id || '',
      fullName: `${u.firstName} ${u.lastName} ${u.secondLastName || ''}`.trim(),
      jobTitle: typeof u.role === 'object' ? (u.role as Role).displayName || (u.role as Role).name : u.role as string,
      email: u.email,
      lastAccess: u.updatedAt ? new Date(u.updatedAt).toISOString().split('T')[0] : 'N/A',
      status: u.active ? 'Active' : 'Inactive',
    }));
  }

  filteredUsers = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    return this.users().filter(
      (u) => u.fullName.toLowerCase().includes(query) || u.email.toLowerCase().includes(query),
    );
  });

  totalUsers = computed(() => this.users().length);

  // Propiedad computada para saber si ya no caben más usuarios
  isLimitReached = computed(() => this.users().length >= this.maxUsers());

  // Esta es la función que te marcaba el error en el HTML
  toggleAddUser(): void {
    if (this.isLimitReached() && !this.isAddingUser()) {
      this.notificationService.warning('Se ha alcanzado el límite máximo de usuarios permitidos.');
      return;
    }
    this.isAddingUser.update((val) => !val);

    // Resetear formulario cuando se cierra
    if (!this.isAddingUser()) {
      this.resetForm();
    }
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
   * Crear nuevo usuario
   */
  saveNewUser(): void {
    const form = this.newUser();

    // Validaciones básicas
    if (!form.firstName || !form.lastName || !form.email || !form.password || !form.role) {
      this.notificationService.warning('Por favor complete todos los campos obligatorios');
      return;
    }

    this.isSaving.set(true);
    this.errorMessage.set(null);

    const currentUser = this.authService.currentUser();
    const iesIdToUse = this.iesId || (currentUser?.ies as string);

    const userData: Partial<User> = {
      firstName: form.firstName,
      lastName: form.lastName,
      secondLastName: form.secondLastName || undefined,
      email: form.email,
      password: form.password,
      phone: form.phone || undefined,
      role: form.role, // Aquí ya está el _id del rol
      ies: iesIdToUse,
      active: true
    };

    this.userService.createUser(userData).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.isAddingUser.set(false);
        this.resetForm();
        this.loadUsers();
        this.notificationService.success('Usuario creado exitosamente');
      },
      error: (error) => {
        console.error('Error creando usuario:', error);
        this.isSaving.set(false);
        this.errorMessage.set(error.error?.message || 'Error al crear el usuario');
        this.notificationService.error(this.errorMessage()!);
      },
    });
  }

  /**
   * Resetear formulario
   */
  resetForm(): void {
    this.newUser.set({
      firstName: '',
      lastName: '',
      secondLastName: '',
      email: '',
      password: '',
      phone: '',
      role: ''
    });
    this.roleSearchQuery.set('');
  }

  /**
   * Eliminar usuario
   */
  async deleteUser(userId: string): Promise<void> {
    const confirmed = await this.notificationService.confirm('¿Desea eliminar este usuario?', 'Eliminar Usuario', 'Sí, eliminar');
    if (!confirmed) {
      return;
    }

    this.userService.deleteUser(userId).subscribe({
      next: () => {
        this.loadUsers();
        this.notificationService.success('Usuario eliminado correctamente');
      },
      error: (error) => {
        console.error('Error eliminando usuario:', error);
        this.notificationService.error('Error al eliminar el usuario');
      },
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
        this.notificationService.error('Error al cambiar el estado del usuario');
      },
    });
  }
}
