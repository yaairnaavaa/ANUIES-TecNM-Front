import { Component, signal, computed, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RoleService, MenuPermission } from '../../services/role.service';
import { Role } from '../../models/api.models';

type ViewState = 'list' | 'create' | 'edit';

@Component({
  selector: 'app-role-management',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './role-management.html',
  styleUrls: ['./role-management.css']
})
export class RoleManagementComponent implements OnInit {
  private roleService = inject(RoleService);
  private fb = inject(FormBuilder);

  currentView = signal<ViewState>('list');
  rolesList = signal<Role[]>([]);
  availablePermissions = signal<MenuPermission[]>([]);
  selectedRole = signal<Role | null>(null);
  
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);
  searchQuery = signal('');

  // Paginación
  currentPage = signal(1);
  itemsPerPage = signal(10);
  pageSizeOptions = [5, 10, 20, 50];

  roleForm!: FormGroup;
  selectedPermissions = signal<string[]>([]);

  ngOnInit(): void {
    this.initForm();
    this.loadRoles();
    this.loadPermissions();
  }

  initForm(): void {
    this.roleForm = this.fb.group({
      name: ['', Validators.required],
      displayName: ['', Validators.required],
      description: [''],
      level: [1, [Validators.required, Validators.min(1), Validators.max(10)]],
      scope: ['General', Validators.required],
      requiresIES: [false],
      active: [true]
    });
  }

  loadRoles(): void {
    this.isLoading.set(true);
    this.roleService.getAllRoles().subscribe({
      next: (response) => {
        this.rolesList.set(response.data || []);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error cargando roles:', error);
        this.errorMessage.set('Error al cargar los roles');
        this.isLoading.set(false);
      }
    });
  }

  loadPermissions(): void {
    this.roleService.getAllPermissions().subscribe({
      next: (response) => {
        this.availablePermissions.set(response.data || []);
      },
      error: (error) => {
        console.error('Error cargando permisos:', error);
      }
    });
  }

  // Computed - Filtrado y paginación
  filteredRoles = computed(() => {
    const query = this.searchQuery().toLowerCase();
    return this.rolesList().filter(role =>
      role.name?.toLowerCase().includes(query) ||
      role.displayName?.toLowerCase().includes(query) ||
      role.scope?.toLowerCase().includes(query)
    );
  });

  paginatedRoles = computed(() => {
    const start = (this.currentPage() - 1) * this.itemsPerPage();
    const end = start + this.itemsPerPage();
    return this.filteredRoles().slice(start, end);
  });

  totalPages = computed(() => {
    return Math.ceil(this.filteredRoles().length / this.itemsPerPage());
  });

  // Acciones
  openCreateModal(): void {
    this.currentView.set('create');
    this.selectedRole.set(null);
    this.roleForm.reset({
      name: '',
      displayName: '',
      description: '',
      level: 1,
      scope: 'General',
      requiresIES: false,
      active: true
    });
    this.selectedPermissions.set([]);
  }

  openEditModal(role: Role): void {
    this.currentView.set('edit');
    this.selectedRole.set(role);
    
    this.roleForm.patchValue({
      name: role.name,
      displayName: role.displayName,
      description: role.description,
      level: role.level,
      scope: role.scope,
      requiresIES: role.requiresIES,
      active: role.active
    });
    
    // Cargar permisos del rol
    const permissionIds = role.permissions.map((p: any) => 
      typeof p === 'string' ? p : p._id
    );
    this.selectedPermissions.set(permissionIds);
  }

  closeModal(): void {
    this.currentView.set('list');
    this.selectedRole.set(null);
    this.roleForm.reset();
    this.selectedPermissions.set([]);
    this.clearMessages();
  }

  togglePermission(permissionId: string): void {
    const current = this.selectedPermissions();
    if (current.includes(permissionId)) {
      this.selectedPermissions.set(current.filter(id => id !== permissionId));
    } else {
      this.selectedPermissions.set([...current, permissionId]);
    }
  }

  isPermissionSelected(permissionId: string): boolean {
    return this.selectedPermissions().includes(permissionId);
  }

  saveRole(): void {
    if (this.roleForm.invalid) {
      this.errorMessage.set('Por favor completa todos los campos requeridos');
      return;
    }

    const roleData = {
      ...this.roleForm.value,
      permissions: this.selectedPermissions()
    };

    this.isLoading.set(true);
    
    const currentRole = this.selectedRole();
    const operation = currentRole && currentRole._id
      ? this.roleService.updateRole(currentRole._id, roleData)
      : this.roleService.createRole(roleData);

    operation.subscribe({
      next: (response) => {
        this.successMessage.set(
          this.selectedRole() 
            ? 'Rol actualizado exitosamente' 
            : 'Rol creado exitosamente'
        );
        this.loadRoles();
        this.closeModal();
        setTimeout(() => this.clearMessages(), 3000);
      },
      error: (error) => {
        console.error('Error guardando rol:', error);
        this.errorMessage.set(error.error?.message || 'Error al guardar el rol');
        this.isLoading.set(false);
      }
    });
  }

  deleteRole(role: Role): void {
    if (!confirm(`¿Estás seguro de eliminar el rol "${role.displayName}"?`)) {
      return;
    }

    if (!role._id) {
      this.errorMessage.set('ID de rol no válido');
      return;
    }

    this.isLoading.set(true);
    this.roleService.deleteRole(role._id).subscribe({
      next: () => {
        this.successMessage.set('Rol eliminado exitosamente');
        this.loadRoles();
        setTimeout(() => this.clearMessages(), 3000);
      },
      error: (error) => {
        console.error('Error eliminando rol:', error);
        this.errorMessage.set(error.error?.message || 'Error al eliminar el rol');
        this.isLoading.set(false);
      }
    });
  }

  // Paginación
  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
    }
  }

  changePageSize(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.itemsPerPage.set(Number(target.value));
    this.currentPage.set(1);
  }

  // Paginación avanzada con grupos de 5 páginas
  visiblePages = computed(() => {
    const total = this.totalPages();
    if (total === 0) return [];
    
    const current = this.currentPage();
    const pages: number[] = [];
    
    if (total <= 5) {
      for (let i = 1; i <= total; i++) {
        pages.push(i);
      }
      return pages;
    }
    
    const pageGroup = Math.floor((current - 1) / 5);
    const startPage = pageGroup * 5 + 1;
    const endPage = Math.min(startPage + 4, total);
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return pages;
  });

  goToPreviousGroup(): void {
    const current = this.currentPage();
    const pageGroup = Math.floor((current - 1) / 5);
    if (pageGroup > 0) {
      const newPage = (pageGroup - 1) * 5 + 1;
      this.goToPage(newPage);
    }
  }

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

  hasPreviousGroup = computed(() => {
    const total = this.totalPages();
    if (total <= 5) return false;
    
    const current = this.currentPage();
    const pageGroup = Math.floor((current - 1) / 5);
    return pageGroup > 0;
  });

  hasNextGroup = computed(() => {
    const total = this.totalPages();
    if (total <= 5) return false;
    
    const current = this.currentPage();
    const pageGroup = Math.floor((current - 1) / 5);
    const maxGroup = Math.floor((total - 1) / 5);
    return pageGroup < maxGroup;
  });

  clearMessages(): void {
    this.errorMessage.set(null);
    this.successMessage.set(null);
  }

  // Helpers para la vista
  getScopeClass(scope: string): string {
    const classes: Record<string, string> = {
      'Nacional': 'bg-blue-100 text-blue-700',
      'IES': 'bg-emerald-100 text-emerald-700',
      'IEMS': 'bg-purple-100 text-purple-700',
      'General': 'bg-slate-100 text-slate-700'
    };
    return classes[scope] || classes['General'];
  }

  groupPermissionsByCategory = computed(() => {
    const permissions = this.availablePermissions();
    const grouped: Record<string, MenuPermission[]> = {};
    
    permissions.forEach(permission => {
      const category = permission.category || 'General';
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(permission);
    });
    
    return grouped;
  });

  // Obtener las categorías como array para el template
  getPermissionCategories = computed(() => {
    return Object.keys(this.groupPermissionsByCategory());
  });
}
