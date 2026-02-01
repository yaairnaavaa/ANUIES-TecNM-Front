import { Injectable, inject, signal, computed } from '@angular/core';
import { IesService } from './ies.service';
import { AuthService } from './auth.service';

export interface IESBrandingColors {
  primary: string;
  secondary: string;
  accent: string;
  logoUrl: string;
  /** Nombre de la institución (para header del sidebar cuando no viene en currentUser). */
  institutionName: string;
}

const DEFAULT_BRANDING: IESBrandingColors = {
  primary: '#0f213e',
  secondary: '#e2e8f0',
  accent: '#10b981',
  logoUrl: '',
  institutionName: '',
};

/**
 * Servicio que expone los colores de identidad visual de la IES del usuario actual.
 * Se usan en el sidebar: primario = fondo del menú, secundario = color de las letras, acento = iconos (Mi cuenta, cerrar sesión).
 */
@Injectable({ providedIn: 'root' })
export class IESBrandingService {
  private iesService = inject(IesService);
  private authService = inject(AuthService);

  private readonly state = signal<IESBrandingColors>(DEFAULT_BRANDING);

  /** Colores actuales (por defecto o cargados de la IES). */
  branding = computed(() => this.state());

  /** Establece los colores (p. ej. tras guardar en Perfil Institucional). */
  setBranding(primary: string, secondary: string, accent: string, logoUrl?: string, institutionName?: string): void {
    this.state.update((prev) => ({
      ...prev,
      primary: primary || DEFAULT_BRANDING.primary,
      secondary: secondary || DEFAULT_BRANDING.secondary,
      accent: accent || DEFAULT_BRANDING.accent,
      ...(logoUrl !== undefined ? { logoUrl: logoUrl || '' } : {}),
      ...(institutionName !== undefined ? { institutionName: institutionName || '' } : {}),
    }));
  }

  /** Establece solo la URL del logotipo (se muestra en el menú lateral). */
  setLogo(url: string): void {
    this.state.update((prev) => ({ ...prev, logoUrl: url || '' }));
  }

  /** Carga la identidad visual de la IES por ID y actualiza el estado. */
  loadBranding(iesId: string): void {
    if (!iesId) return;
    this.iesService.getIESById(iesId).subscribe({
      next: (res) => {
        const d = res?.data;
        const b = d?.branding;
        const logoUrl = d?.institutionalImage?.logo ?? '';
        const institutionName = d?.name ?? '';
        this.state.set({
          primary: b?.primaryColor ?? DEFAULT_BRANDING.primary,
          secondary: b?.secondaryColor ?? DEFAULT_BRANDING.secondary,
          accent: b?.accentColor ?? DEFAULT_BRANDING.accent,
          logoUrl: logoUrl || DEFAULT_BRANDING.logoUrl,
          institutionName: institutionName || DEFAULT_BRANDING.institutionName,
        });
      },
      error: () => {},
    });
  }

  /** Inicializa branding si el usuario tiene IES (llamar desde sidebar o layout). */
  initFromCurrentUser(): void {
    const iesId = this.authService.getStoredIesId();
    if (iesId) this.loadBranding(iesId);
    else this.state.set(DEFAULT_BRANDING);
  }
}
