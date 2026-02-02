import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef, HostListener, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  FormArray,
} from '@angular/forms';
import { Subscription } from 'rxjs';

import { IesService } from '../../../services/ies.service';
import { AuthService } from '../../../services/auth.service';
import { IESBrandingService } from '../../../services/ies-branding.service';
import { NotificationService } from '../../../services/notification.service';

/**
 * Secciones editables del perfil
 */
type EditSection = 'general' | 'social' | 'visual';

@Component({
  selector: 'app-ies-profile-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './ies-profile-settings.html',
})
export class IesProfileSettings implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private iesService = inject(IesService);
  private authService = inject(AuthService);
  private brandingService = inject(IESBrandingService);
  private notificationService = inject(NotificationService);
  private cdr = inject(ChangeDetectorRef);

  private brandingSubscription?: Subscription;
  private institutionalImageSubscription?: Subscription;

  /** Si la imagen del logo falla al cargar en el preview. */
  logoPreviewError = false;

  isSaving = false;
  showCareerModal = false;
  loadingCareers = false;
  savingCareer = false;
  openCareerMenuIndex: number | null = null; // Para controlar qué menú de carrera está abierto
  menuPosition = { top: 0, left: 0 }; // Posición del menú
  editingCareerIndex: number | null = null; // Índice de la carrera que se está editando
  isEditMode = false; // Determina si el modal está en modo edición

  // Signals para toasts
  successMessage = signal<string | null>(null);
  errorMessage = signal<string | null>(null);

  editModes: Record<EditSection, boolean> = {
    general: false,
    social: false,
    visual: false,
  };

  iesForm!: FormGroup;
  newCareerForm!: FormGroup;
  currentIesId?: string;

  // ================================
  // Lifecycle
  // ================================
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    // Cerrar menú de carreras cuando se hace clic fuera
    this.closeCareerMenu();
  }

  ngOnInit(): void {
    this.buildForm();
    this.buildNewCareerForm();
    this.subscribeBrandingPreview();
    this.subscribeLogoPreview();
    this.loadData();
  }

  ngOnDestroy(): void {
    this.brandingSubscription?.unsubscribe();
    this.institutionalImageSubscription?.unsubscribe();
  }

  /** Aplica el logo al menú lateral en tiempo real al cambiar la URL. */
  private subscribeLogoPreview(): void {
    const institutionalImage = this.iesForm.get('institutionalImage');
    if (!institutionalImage) return;
    this.institutionalImageSubscription = institutionalImage.valueChanges.subscribe((img: any) => {
      this.logoPreviewError = false;
      const url = img?.logo ?? '';
      this.brandingService.setLogo(url);
    });
  }

  /** Aplica los colores al sidebar en tiempo real al cambiar la paleta. */
  private subscribeBrandingPreview(): void {
    const branding = this.iesForm.get('branding');
    if (!branding) return;
    this.brandingSubscription = branding.valueChanges.subscribe((b: any) => {
      if (b?.primaryColor != null || b?.secondaryColor != null || b?.accentColor != null) {
        this.brandingService.setBranding(
          b.primaryColor ?? '#0f213e',
          b.secondaryColor ?? '#e2e8f0',
          b.accentColor ?? '#10b981'
        );
      }
    });
  }

  // ================================
  // Form setup
  // ================================
  private buildForm(): void {
    this.iesForm = this.fb.group({
      mision: ['', Validators.required],
      vision: ['', Validators.required],

      branding: this.fb.group({
        primaryColor: ['#4f46e5', Validators.required],
        secondaryColor: ['#0f172a', Validators.required],
        accentColor: ['#10b981'],
      }),

      institutionalImage: this.fb.group({
        logo: [''], // URL del logotipo (se muestra en el menú lateral)
        banner: [''], // URL del banner
      }),

      socialMedia: this.fb.group({
        website: [''],
        facebook: [''],
        instagram: [''],
        tiktok: [''],
      }),

      careers: this.fb.array([]),
    });
  }

  private buildNewCareerForm(): void {
    this.newCareerForm = this.fb.group({
      name: ['', Validators.required],
      code: ['', Validators.required],
      modality: ['Presencial', Validators.required],
      shortName: [''],
      careerLink: [''],
      active: [true],
    });
  }

  // ================================
  // Getters
  // ================================
  get careers(): FormArray<FormGroup> {
    return this.iesForm.get('careers') as FormArray<FormGroup>;
  }

  // ================================
  // Helpers
  // ================================
  private getIesId(): string | undefined {
    const user = this.authService.currentUser();

    if (typeof user?.ies === 'string') {
      return user.ies;
    } else if (user?.ies && typeof user.ies === 'object') {
      return (user.ies as any)._id || (user.ies as any).id;
    }

    return undefined;
  }

  // ================================
  // Data loading
  // ================================
  loadData(): void {
    const user = this.authService.currentUser();
    console.log('Usuario actual:', user);

    const iesId = this.getIesId();

    if (!iesId) {
      console.error('No se pudo obtener el ID de la IES del usuario:', user);
      return;
    }

    this.currentIesId = iesId;
    console.log('IES ID extraído:', iesId);
    console.log('Cargando datos de IES:', iesId);

    this.iesService.getIESById(iesId).subscribe({
      next: (res: any) => {
        console.log('Respuesta de getIESById:', res);
        const data = res?.data;
        if (!data) {
          console.error('No hay datos en la respuesta');
          return;
        }

        // Usar setTimeout para evitar ExpressionChangedAfterItHasBeenCheckedError
        setTimeout(() => {
          this.iesForm.patchValue({
            mision: data.mision ?? '',
            vision: data.vision ?? '',
            branding: {
              primaryColor: data.branding?.primaryColor ?? '#4f46e5',
              secondaryColor: data.branding?.secondaryColor ?? '#0f172a',
              accentColor: data.branding?.accentColor ?? '#10b981',
            },
            institutionalImage: {
              logo: data.institutionalImage?.logo ?? '',
              banner: data.institutionalImage?.banner ?? '',
            },
            socialMedia: {
              website: data.contact?.socialMedia?.website ?? '',
              facebook: data.contact?.socialMedia?.facebook ?? '',
              twitter: data.contact?.socialMedia?.twitter ?? '',
              instagram: data.contact?.socialMedia?.instagram ?? '',
            },
          });

          console.log('Formulario actualizado con datos de IES');
          console.log('Valores del formulario:', this.iesForm.value);
        }, 0);

        // Cargar carreras por separado
        this.loadCareers(iesId);
      },
      error: (err: any) => {
        console.error('Error al cargar datos de IES:', err);
      }
    });
  }

  loadCareers(iesId: string): void {
    console.log('=== INICIO loadCareers ===');
    console.log('IES ID:', iesId);
    this.loadingCareers = true;

    this.iesService.getCareersIES(iesId).subscribe({
      next: (res: any) => {
        console.log('Carreras recibidas del servidor:', res);
        console.log('res.data:', res.data);
        console.log('Cantidad de carreras:', res.data?.length ?? 0);

        this.careers.clear();
        console.log('Array de carreras limpiado');

        (res.data ?? []).forEach((career: any, index: number) => {
          console.log(`Agregando carrera ${index + 1}:`, career);
          this.careers.push(
            this.fb.group({
              _id: [career._id],
              name: [career.name ?? '', Validators.required],
              code: [career.code ?? ''],
              modality: [career.modality ?? 'Presencial', Validators.required],
              shortName: [career.shortName ?? ''],
              careerLink: [career.careerLink ?? ''],
              active: [career.active ?? true],
            }),
          );
        });

        console.log('Total de carreras en el FormArray:', this.careers.length);
        console.log('Carreras en el FormArray:', this.careers.value);
        this.loadingCareers = false;
        this.cdr.detectChanges(); // Forzar detección de cambios
        console.log('loadingCareers establecido a false');
        console.log('=== FIN loadCareers ===');
      },
      error: (err: any) => {
        console.error('Error al cargar carreras:', err);
        this.loadingCareers = false;
        this.cdr.detectChanges(); // Forzar detección de cambios
      }
    });
  }

  // ================================
  // UI actions
  // ================================
  toggleEdit(section: EditSection): void {
    this.editModes[section] = !this.editModes[section];
  }

  // ================================
  // Save actions
  // ================================
  saveGeneral(): void {
    if (this.iesForm.get('mision')?.invalid || this.iesForm.get('vision')?.invalid) {
      this.notificationService.warning('Por favor completa la misión y visión');
      return;
    }

    const iesId = this.getIesId();

    if (!iesId) {
      console.error('No se pudo obtener el ID de la IES del usuario');
      this.notificationService.error('Error: No se pudo identificar tu institución');
      return;
    }

    console.log('Guardando filosofía para IES:', iesId);
    this.isSaving = true;

    this.iesService.updateFilosofia(iesId, {
      mision: this.iesForm.value.mision,
      vision: this.iesForm.value.vision,
    }).subscribe({
      next: (response: any) => {
        console.log('Filosofía actualizada:', response);
        this.editModes.general = false;
        this.isSaving = false;
        this.showToast('success', 'Filosofía institucional actualizada correctamente');
      },
      error: (err: any) => {
        console.error('Error al actualizar filosofía:', err);
        this.isSaving = false;
        this.showToast('error', 'Error al actualizar: ' + (err.error?.message || err.message || 'Error desconocido'));
      },
    });
  }

  saveBranding(): void {
    const iesId = this.getIesId();

    if (!iesId) {
      console.error('No se pudo obtener el ID de la IES');
      this.notificationService.error('Error: No se pudo identificar tu institución');
      return;
    }

    console.log('Guardando identidad visual para IES:', iesId);
    this.isSaving = true;

    this.iesService.updateIdentidadVisual(iesId, {
      branding: this.iesForm.value.branding,
      institutionalImage: { ...this.iesForm.value.institutionalImage, logo: this.iesForm.value.institutionalImage?.logo ?? '' },
    }).subscribe({
      next: (response: any) => {
        console.log('Identidad visual actualizada:', response);
        const b = this.iesForm.value.branding;
        const logoUrl = this.iesForm.value.institutionalImage?.logo ?? '';
        if (b?.primaryColor != null || b?.secondaryColor != null || b?.accentColor != null) {
          this.brandingService.setBranding(
            b.primaryColor ?? '#0f213e',
            b.secondaryColor ?? '#e2e8f0',
            b.accentColor ?? '#10b981',
            logoUrl
          );
        } else {
          this.brandingService.setLogo(logoUrl);
        }
        this.editModes.visual = false;
        this.isSaving = false;
        this.showToast('success', 'Identidad visual actualizada correctamente');
      },
      error: (err: any) => {
        console.error('Error al actualizar identidad visual:', err);
        this.isSaving = false;
        this.showToast('error', 'Error al actualizar: ' + (err.error?.message || err.message || 'Error desconocido'));
      },
    });
  }

  saveSocial(): void {
    const iesId = this.getIesId();

    if (!iesId) {
      console.error('No se pudo obtener el ID de la IES');
      this.notificationService.error('Error: No se pudo identificar tu institución');
      return;
    }

    console.log('Guardando canales digitales para IES:', iesId);
    this.isSaving = true;

    this.iesService.updateCanalesDigitales(iesId, {
      contact: {
        socialMedia: this.iesForm.value.socialMedia,
      }
    }).subscribe({
      next: (response: any) => {
        console.log('Canales digitales actualizados:', response);
        this.editModes.social = false;
        this.isSaving = false;
        this.showToast('success', 'Canales digitales actualizados correctamente');
      },
      error: (err: any) => {
        console.error('Error al actualizar canales digitales:', err);
        this.isSaving = false;
        this.showToast('error', 'Error al actualizar: ' + (err.error?.message || err.message || 'Error desconocido'));
      },
    });
  }

  // ================================
  // Image preview (no se guarda)
  // ================================
  onLogoSelected(event: any): void {
    const file = event.target?.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      this.showToast('error', 'El archivo debe ser menor a 2MB');
      return;
    }

    if (!['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'].includes(file.type)) {
      this.showToast('error', 'Solo se permiten archivos PNG, JPG o SVG');
      return;
    }

    // Mostrar preview local (no se guarda en el servidor)
    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.iesForm.patchValue({
        institutionalImage: {
          ...this.iesForm.value.institutionalImage,
          logo: e.target.result,
        }
      });
    };
    reader.readAsDataURL(file);
  }

  onBannerSelected(event: any): void {
    const file = event.target?.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      this.showToast('error', 'El archivo debe ser menor a 2MB');
      return;
    }

    if (!['image/png', 'image/jpeg', 'image/jpg'].includes(file.type)) {
      this.showToast('error', 'Solo se permiten archivos PNG o JPG');
      return;
    }

    // Mostrar preview local (no se guarda en el servidor)
    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.iesForm.patchValue({
        institutionalImage: {
          ...this.iesForm.value.institutionalImage,
          banner: e.target.result,
        }
      });
    };
    reader.readAsDataURL(file);
  }

  // ================================
  // Gestión de Carreras
  // ================================
  toggleCareerMenu(index: number, event: MouseEvent): void {
    event.stopPropagation();

    if (this.openCareerMenuIndex === index) {
      this.closeCareerMenu();
    } else {
      this.openCareerMenuIndex = index;

      // Calcular posición del menú
      const button = event.currentTarget as HTMLElement;
      const rect = button.getBoundingClientRect();

      this.menuPosition = {
        top: rect.bottom + 4, // 4px debajo del botón
        left: rect.right - 160 // Alineado a la derecha (160px = ancho del menú)
      };
    }
  }

  closeCareerMenu(): void {
    this.openCareerMenuIndex = null;
  }

  openCareerModal(): void {
    this.isEditMode = false;
    this.editingCareerIndex = null;
    this.newCareerForm.reset({
      modality: 'Presencial'
    });
    this.showCareerModal = true;
  }

  openEditCareerModal(index: number): void {
    const career = this.careers.at(index);
    if (career) {
      this.editingCareerIndex = index;
      this.isEditMode = true;
      this.newCareerForm.patchValue({
        name: career.value.name,
        code: career.value.code,
        modality: career.value.modality,
        shortName: career.value.shortName,
        careerLink: career.value.careerLink,
        active: career.value.active ?? true,
      });
      this.showCareerModal = true;
      this.closeCareerMenu();
    }
  }

  closeCareerModal(): void {
    this.showCareerModal = false;
    this.newCareerForm.reset();
  }

  addCareer(): void {
    if (this.newCareerForm.invalid) {
      this.showToast('error', 'Por favor completa todos los campos requeridos');
      return;
    }

    if (this.isEditMode && this.editingCareerIndex !== null) {
      // Modo edición
      this.saveCareerEdit();
    } else {
      // Modo creación
      if (!this.currentIesId) {
        console.error('No hay IES ID disponible');
        return;
      }

      console.log('Agregando carrera:', this.newCareerForm.value);
      this.savingCareer = true;

      this.iesService.createCareerIES(this.currentIesId, this.newCareerForm.value).subscribe({
        next: (response: any) => {
          console.log('Carrera creada exitosamente:', response);
          console.log('Respuesta completa:', JSON.stringify(response, null, 2));

          this.savingCareer = false;
          this.closeCareerModal();

          // Recargar carreras desde el servidor
          console.log('Recargando carreras para IES:', this.currentIesId);
          this.loadCareers(this.currentIesId!);

          this.showToast('success', 'Carrera agregada correctamente');
        },
        error: (err: any) => {
          console.error('Error al crear carrera:', err);
          this.savingCareer = false;
          this.showToast('error', 'Error al agregar la carrera: ' + (err.error?.message || 'Error desconocido'));
        }
      });
    }
  }

  saveCareerEdit(): void {
    if (this.editingCareerIndex === null) return;

    const career = this.careers.at(this.editingCareerIndex);
    if (!career || !career.value._id) {
      console.error('No se encontró la carrera o no tiene ID');
      return;
    }

    const careerId = career.value._id;
    console.log('Editando carrera con ID:', careerId);
    this.savingCareer = true;

    this.iesService.updateCareer(careerId, this.newCareerForm.value).subscribe({
      next: (response: any) => {
        console.log('Carrera actualizada exitosamente:', response);

        this.savingCareer = false;
        this.closeCareerModal();

        // Recargar carreras desde el servidor
        if (this.currentIesId) {
          this.loadCareers(this.currentIesId);
        }

        this.showToast('success', 'Carrera actualizada correctamente');
      },
      error: (err: any) => {
        console.error('Error al actualizar carrera:', err);
        this.savingCareer = false;
        this.showToast('error', 'Error al actualizar la carrera: ' + (err.error?.message || 'Error desconocido'));
      }
    });
  }

  toggleCareerStatus(index: number): void {
    this.closeCareerMenu();

    const career = this.careers.at(index);
    if (!career || !career.value._id) {
      console.error('No se encontró la carrera o no tiene ID');
      return;
    }

    const currentStatus = career.value.active;
    const newStatus = !currentStatus;
    const careerId = career.value._id;

    console.log(`Cambiando estatus de carrera ${careerId} de ${currentStatus} a ${newStatus}`);

    this.iesService.updateCareer(careerId, { active: newStatus }).subscribe({
      next: (response: any) => {
        console.log('Estatus de carrera actualizado:', response);
        career.patchValue({ active: newStatus });
        this.showToast('success', `Carrera ${newStatus ? 'activada' : 'desactivada'} correctamente`);
      },
      error: (err: any) => {
        console.error('Error al cambiar estatus:', err);
        this.showToast('error', 'Error al cambiar el estatus: ' + (err.error?.message || 'Error desconocido'));
      }
    });
  }

  deleteCareer(index: number): void {
    this.closeCareerMenu(); // Cerrar el menú

    const career = this.careers.at(index).value;

    if (!career._id) {
      console.log('Carrera sin ID, removiendo solo del formulario');
      this.careers.removeAt(index);
      return;
    }

    if (!confirm(`¿Estás seguro de eliminar la carrera "${career.name}"?`)) {
      return;
    }

    if (!this.currentIesId) {
      console.error('No hay IES ID disponible');
      return;
    }

    console.log('Eliminando carrera:', career._id);

    this.iesService.deleteCareerIES(this.currentIesId, career._id).subscribe({
      next: (response: any) => {
        console.log('Carrera eliminada exitosamente:', response);
        this.careers.removeAt(index);
        this.showToast('success', 'Carrera eliminada correctamente');
      },
      error: (err: any) => {
        console.error('Error al eliminar carrera:', err);
        this.showToast('error', 'Error al eliminar la carrera: ' + (err.error?.message || 'Error desconocido'));
      }
    });
  }

  // ================================
  // Deprecated - Mantener por compatibilidad
  // ================================
  private update(payload: any, section?: EditSection): void {
    const iesId = this.getIesId();

    if (!iesId) return;

    this.isSaving = true;

    this.iesService.updateIES(iesId, payload).subscribe({
      next: () => {
        if (section) {
          this.editModes[section] = false;
        }
        this.isSaving = false;
      },
      error: () => {
        this.isSaving = false;
      },
    });
  }

  // ================================
  // Toast notifications
  // ================================
  showToast(type: 'success' | 'error', message: string): void {
    if (type === 'success') {
      this.notificationService.success(message);
    } else {
      this.notificationService.error(message);
    }
  }
}
