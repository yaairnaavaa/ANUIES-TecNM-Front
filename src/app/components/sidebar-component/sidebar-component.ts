import { Component, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { MenuItem } from '../../models/api.models';

// Definimos la interfaz aquí mismo para que esté disponible
interface MenuSection {
  title: string;
  items: MenuItem[];
}

@Component({
  selector: 'app-sidebar-component',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar-component.html',
  styleUrl: './sidebar-component.css',
})
export class SidebarComponent {
  public authService = inject(AuthService);
  private router = inject(Router);
  isOpen = signal(false);

  /** Ruta a Mi cuenta según el layout actual (admin o ies) */
  cuentaRoute = computed(() => {
    const first = this.router.url.split('/')[1];
    const base = first === 'admin' || first === 'ies' ? first : 'admin';
    return `/${base}/profile`;
  });

  // Datos del usuario (Signals Computados)
  userInitials = computed(() => {
    const user = this.authService.currentUser();
    if (!user) return '';
    return `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase();
  });

  userName = computed(() => {
    const user = this.authService.currentUser();
    return user ? `${user.firstName} ${user.lastName}` : '';
  });

  userRole = computed(() => this.authService.currentUser()?.role?.displayName ?? '');

  // Lógica de agrupación del menú
  menuSections = computed<MenuSection[]>(() => {
    const rawMenu = this.authService.menu() as MenuItem[];
    const grouped: Record<string, MenuItem[]> = {};

    rawMenu.forEach((item) => {
      // Si la categoría viene nula o vacía, la mandamos a 'GENERAL'
      const category = item.category || 'General';
      if (!grouped[category]) grouped[category] = [];
      grouped[category].push(item);
    });

    return Object.keys(grouped).map((category) => ({
      title: category.toUpperCase(),
      items: grouped[category],
    }));
  });

  toggleSidebar() {
    this.isOpen.update((v) => !v);
  }

  logout(): void {
    this.authService.logout();
  }
}
