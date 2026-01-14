import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

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
  userName = signal('');
  userRole = signal('');
  userInitials = signal('');
  isOpen = signal(false);

  menuSections = signal<MenuSection[]>([]);

  ngOnInit(): void {
    this.loadUserFromStorage();
  }

  toggleSidebar() {
    this.isOpen.update((v) => !v);
  }

  private loadUserFromStorage(): void {
    const rawUser = localStorage.getItem('anuies_user');

    if (!rawUser) {
      console.warn('No existe anuies_user en localStorage');
      return;
    }

    const user = JSON.parse(rawUser);

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
