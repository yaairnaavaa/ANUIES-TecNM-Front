import { Component, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
@Component({
  selector: 'app-sidebar-component',
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar-component.html',
  styleUrl: './sidebar-component.css',
})
export class SidebarComponent {
  //Cuando llegue el endpoint, solo inyectarás los datos aquí
  userName = signal('Jorge Betancourt');
  userRole = signal('Admin. Plantel');
  userInitials = signal('JB');
  isOpen = signal(false);

  toggleSidebar() {
    this.isOpen.update((v) => !v);
  }

  // Ejemplo de cómo vendrían los datos agrupados
  menuSections = signal([
    {
      title: 'PRINCIPAL',
      items: [
        { label: 'Dashboard', icon: 'fas fa-th-large', route: '/dashboard' },
        { label: 'Aspirantes', icon: 'fas fa-user-graduate', route: '/aspirantes', badge: 1247 },
        { label: 'IMS', icon: 'fas fa-school', route: '/iems', badge: 12 },
        { label: 'Campañas', icon: 'fas fa-bullhorn', route: '/campañas' },
        { label: 'IEMS', icon: 'fas fa-school', route: '/iems' },
      ],
    },
    {
      title: 'GESTIÓN',
      items: [
        { label: 'Admisión', icon: 'fas fa-clipboard-check', route: '/admision' },
        { label: 'Documentos', icon: 'fas fa-file-alt', route: '/documentos', badge: 12 },
        { label: 'Pagos', icon: 'fas fa-credit-card', route: '/pagos' },
      ],
    },
  ]);
}
