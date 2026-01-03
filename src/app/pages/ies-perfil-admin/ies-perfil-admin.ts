import { Component, signal, computed } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-ies-perfil-admin',
  standalone: true,
  // CommonModule es vital para @if, @for y pipes
  // FormsModule es necesario para el [(ngModel)] en los inputs
  imports: [
    CommonModule, 
    FormsModule, 
    ReactiveFormsModule,
    DecimalPipe
  ],
  templateUrl: './ies-perfil-admin.html',
  styleUrl: './ies-perfil-admin.css',
})
export class IesPerfilAdmin {
  // --- ESTADOS DE LA INTERFAZ ---
  section = signal<'info' | 'carreras' | 'branding' | 'campanas' | 'usuarios'>('info');
  isLoading = signal(false);

  // --- 5.5.3 PERSONALIZACIÓN DE COLORES ---
  colorPrimario = signal('#0f213e');
  colorSecundario = signal('#10b981');

  // --- 5.5.1 CARGA DE LOGO ---
  logoPreview = signal<string | null>(null);

  // --- MODELOS PARA PUNTOS 5.1, 5.3, 5.7 (Simulando estructura de base de datos) ---
  iesInfo = signal({
    mision: '',
    vision: '',
    historia: '',
    directorioIems: [] // Para punto 5.9
  });

  carreras = signal<any[]>([]); // Para punto 5.3 y 5.4

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
        this.logoPreview.set(reader.result as string);
      };
      reader.readAsDataURL(file);
      
      // NOTA: Cuando el backend esté listo, aquí usarás FormData 
      // para enviar el 'file' al endpoint 5.5.2
    }
  }

  /**
   * Punto 5.2 & 5.4: Guardar información en Backend
   */
  async saveChanges() {
    this.isLoading.set(true);
    
    // Simulación de llamada a API
    try {
      console.log('Enviando datos a los endpoints 5.2/5.4...');
      // await this.iesService.update(this.iesInfo());
    } finally {
      setTimeout(() => this.isLoading.set(false), 1000);
    }
  }

  /**
   * Punto 5.6: Registro de impacto y campañas
   */
  registrarImpacto(datos: any) {
    console.log('Guardando alcance y costo de campaña (5.6.1)');
  }
}