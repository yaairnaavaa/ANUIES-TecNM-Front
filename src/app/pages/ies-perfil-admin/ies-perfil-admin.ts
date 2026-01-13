import { Component, signal, computed, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IesService } from '../../services/ies.service';
import { AuthService } from '../../services/auth.service';
import { IES } from '../../models/api.models';

@Component({
  selector: 'app-ies-perfil-admin',
  standalone: true,
  // CommonModule es vital para @if, @for y pipes
  // FormsModule es necesario para el [(ngModel)] en los inputs
  imports: [
    CommonModule, 
    FormsModule, 
    ReactiveFormsModule
  ],
  templateUrl: './ies-perfil-admin.html',
  styleUrl: './ies-perfil-admin.css',
})
export class IesPerfilAdmin implements OnInit {
  private iesService = inject(IesService);
  private authService = inject(AuthService);

  // --- ESTADOS DE LA INTERFAZ ---
  section = signal<'info' | 'carreras' | 'branding' | 'campanas' | 'usuarios'>('info');
  isLoading = signal(false);
  errorMessage = signal<string>('');
  
  // Datos de la IES actual
  currentIES = signal<IES | null>(null);

  // --- 5.5.3 PERSONALIZACIÓN DE COLORES ---
  colorPrimario = signal<string>('#0f213e');
  colorSecundario = signal<string>('#10b981');

  // --- 5.5.1 CARGA DE LOGO ---
  logoPreview = computed(() => this.currentIES()?.institutionalImage?.logo || null);

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

    this.isLoading.set(true);
    const iesId = typeof user.ies === 'string' ? user.ies : user.ies._id;

    if (!iesId) {
      this.errorMessage.set('ID de IES no válido');
      this.isLoading.set(false);
      return;
    }

    this.iesService.getIESById(iesId).subscribe({
      next: (response) => {
        this.currentIES.set(response.data ?? null);
        // Sincronizar los colores
        this.colorPrimario.set(response.data?.branding?.primaryColor || '#0f213e');
        this.colorSecundario.set(response.data?.branding?.secondaryColor || '#10b981');
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error cargando IES:', error);
        this.errorMessage.set('Error al cargar los datos de la IES');
        this.isLoading.set(false);
      }
    });
  }

  // --- MÉTODOS ---

  /**
   * Punto 5.5.1 & 5.5.2: Manejo de imagen institucional
   */
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

  /**
   * Punto 5.2 & 5.4: Guardar información en Backend
   */
  async saveChanges() {
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
        primaryColor: this.colorPrimario(),
        secondaryColor: this.colorSecundario()
      }
    };

    this.isLoading.set(true);
    this.errorMessage.set('');
    
    if (!updatedIES._id) {
      this.errorMessage.set('ID de IES no válido');
      this.isLoading.set(false);
      return;
    }
    
    this.iesService.updateIES(updatedIES._id, updatedIES).subscribe({
      next: (response) => {
        this.currentIES.set(response.data ?? null);
        this.colorPrimario.set(response.data?.branding?.primaryColor || '#0f213e');
        this.colorSecundario.set(response.data?.branding?.secondaryColor || '#10b981');
        this.isLoading.set(false);
        alert('Cambios guardados exitosamente');
      },
      error: (error) => {
        console.error('Error guardando cambios:', error);
        this.errorMessage.set('Error al guardar los cambios');
        this.isLoading.set(false);
      }
    });
  }

  /**
   * Punto 5.6: Registro de impacto y campañas
   */
  registrarImpacto(datos: any) {
    console.log('Guardando alcance y costo de campaña (5.6.1)');
  }
}