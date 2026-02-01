import { Component, signal, inject, computed, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { IESBrandingService } from '../../services/ies-branding.service';
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
export class SidebarComponent implements OnInit {
  public authService = inject(AuthService);
  public brandingService = inject(IESBrandingService);
  private router = inject(Router);
  isOpen = signal(false);

  branding = computed(() => this.brandingService.branding());

  /** Si la imagen del logo falla al cargar, mostramos "TN". */
  logoError = signal(false);

  constructor() {
    effect(() => {
      const user = this.authService.currentUser();
      const iesId = user?.ies
        ? (typeof user.ies === 'string' ? user.ies : (user.ies as any)?._id ?? (user.ies as any)?.id)
        : this.authService.getStoredIesId();
      if (iesId) this.brandingService.loadBranding(iesId);
    });
    effect(() => {
      this.brandingService.branding().logoUrl;
      this.logoError.set(false);
    });
  }

  ngOnInit(): void {
    this.brandingService.initFromCurrentUser();
  }

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

  /** Nombre de la institución: del usuario (sesión) o del branding (cargado por IES). */
  institutionName = computed(() => {
    const ies = this.authService.currentUser()?.ies;
    if (ies && typeof ies === 'object' && (ies as { name?: string })?.name) {
      return (ies as { name: string }).name;
    }
    return this.brandingService.branding().institutionName || null;
  });

  /** Título del header: nombre de la institución o texto por defecto. */
  headerTitle = computed(() => this.institutionName() ?? 'Articulación\nEMS');

  /** Subtítulo del header (contexto de la sesión). */
  headerSubtitle = computed(() =>
    this.institutionName() ? 'Sistema Institucional' : 'Plataforma ANUIES'
  );

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

  onLogoError(): void {
    this.logoError.set(true);
  }

  logout(): void {
    this.authService.logout();
  }
}
