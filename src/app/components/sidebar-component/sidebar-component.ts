import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

interface MenuItem {
  label: string;
  icon: string;
  routerLink: string;
  category: string;
}

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
export class SidebarComponent implements OnInit {
  private authService = inject(AuthService);

  userName = signal('');
  userRole = signal('');
  userInitials = signal('');
  isOpen = signal(false);

  menuSections = signal<MenuSection[]>([]);

  ngOnInit(): void {
    this.loadUserFromService();
  }

  toggleSidebar() {
    this.isOpen.update((v) => !v);
  }

  logout(): void {
    this.authService.logout();
  }

  private loadUserFromService(): void {
    const user = this.authService.currentUser();

    if (!user) {
      console.warn('No hay usuario autenticado');
      return;
    }

    // Nombre
    const fullName = `${user.firstName} ${user.lastName}`;
    this.userName.set(fullName);

    // Rol
    this.userRole.set(user.role?.displayName ?? '');

    // Iniciales
    const initials = `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase();
    this.userInitials.set(initials);

    // Menú
    this.menuSections.set(this.buildMenuSections(user.menu));
  }

  private buildMenuSections(menu: MenuItem[]): MenuSection[] {
    const grouped: Record<string, MenuItem[]> = {};

    for (const item of menu) {
      if (!grouped[item.category]) {
        grouped[item.category] = [];
      }
      grouped[item.category].push(item);
    }

    return Object.keys(grouped).map((category) => ({
      title: category.toUpperCase(),
      items: grouped[category],
    }));
  }
}
