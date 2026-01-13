import { Component, signal, computed, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IesService } from '../../services/ies.service';
import { AuthService } from '../../services/auth.service';
import { IES, Career } from '../../models/api.models';

@Component({
  selector: 'app-ies-profile-settings',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './ies-profile-settings.html',
  styleUrl: './ies-profile-settings.css',
})
export class IesProfileSettings implements OnInit {
  private iesService = inject(IesService);
  private authService = inject(AuthService);

  // UI State
  // Las secciones ahora solo cubren Perfil, Carreras y Branding
  activeSection = signal<'general' | 'academic' | 'branding'>('general');
  isSaving = signal(false);
  errorMessage = signal<string>('');

  // Datos de la IES actual
  currentIES = signal<IES | null>(null);

  // 5.5.3 Colors - writable signals
  primaryColor = signal<string>('#0f213e');
  secondaryColor = signal<string>('#10b981');

  // 5.5.1 Logo preview - computed desde datos de IES
  logoPreview = computed(() => this.currentIES()?.institutionalImage?.logo || null);

  // 5.3 Academic Programs - computed desde datos de IES
  academicPrograms = computed(() => this.currentIES()?.careers || []);

  ngOnInit(): void {
    this.loadIESData();
  }

  /**
   * Cargar datos de la IES del usuario autenticado
   */
  loadIESData(): void {
    const user = this.authService.currentUser();
    if (!user || !user.ies) {
      this.errorMessage.set('No se encontró la IES del usuario');
      return;
    }

    this.isSaving.set(true);
    const iesId = typeof user.ies === 'string' ? user.ies : user.ies._id;

    if (!iesId) {
      this.errorMessage.set('ID de IES no válido');
      this.isSaving.set(false);
      return;
    }

    this.iesService.getIESById(iesId).subscribe({
      next: (response) => {
        this.currentIES.set(response.data ?? null);
        // Sincronizar los colores
        this.primaryColor.set(response.data?.branding?.primaryColor || '#0f213e');
        this.secondaryColor.set(response.data?.branding?.secondaryColor || '#10b981');
        this.isSaving.set(false);
      },
      error: (error) => {
        console.error('Error cargando IES:', error);
        this.errorMessage.set('Error al cargar los datos de la IES');
        this.isSaving.set(false);
      }
    });
  }

  // Methods
  onFileSelected(event: Event) {
    const element = event.currentTarget as HTMLInputElement;
    let file: File | null = element.files ? element.files[0] : null;

    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        // Preview local
        const ies = this.currentIES();
        if (ies) {
          this.currentIES.set({
            ...ies,
            institutionalImage: {
              ...ies.institutionalImage,
              logo: reader.result as string
            }
          });
        }
      };
      reader.readAsDataURL(file);
      
      // TODO: Implementar endpoint de subida de imagen en el backend
      // const formData = new FormData();
      // formData.append('logo', file);
      // this.iesService.uploadLogo(iesId, formData).subscribe(...);
    }
  }

  async updateSettings() {
    const ies = this.currentIES();
    if (!ies || !ies._id) {
      alert('No hay datos para guardar');
      return;
    }

    // Actualizar los colores en el objeto IES antes de guardar
    const updatedIES = {
      ...ies,
      branding: {
        ...ies.branding,
        primaryColor: this.primaryColor(),
        secondaryColor: this.secondaryColor()
      }
    };

    this.isSaving.set(true);
    this.errorMessage.set('');
    
    if (!updatedIES._id) {
      this.errorMessage.set('ID de IES no válido');
      this.isSaving.set(false);
      return;
    }
    
    this.iesService.updateIES(updatedIES._id, updatedIES).subscribe({
      next: (response) => {
        this.currentIES.set(response.data ?? null);
        this.primaryColor.set(response.data?.branding?.primaryColor || '#0f213e');
        this.secondaryColor.set(response.data?.branding?.secondaryColor || '#10b981');
        this.isSaving.set(false);
        alert('Configuración actualizada exitosamente');
      },
      error: (error) => {
        console.error('Error actualizando configuración:', error);
        this.errorMessage.set('Error al actualizar la configuración');
        this.isSaving.set(false);
      }
    });
  }
}
