import { Component, signal } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-ies-profile-settings',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, DecimalPipe],
  templateUrl: './ies-profile-settings.html',
  styleUrl: './ies-profile-settings.css',
})
export class IesProfileSettings {
  // UI State
  // Las secciones ahora solo cubren Perfil, Carreras y Branding
  activeSection = signal<'general' | 'academic' | 'branding'>('general');
  isSaving = signal(false);

  // 5.5.3 Colors
  primaryColor = signal('#0f213e');
  secondaryColor = signal('#10b981');

  // 5.5.1 Logo preview
  logoPreview = signal<string | null>(null);

  // 5.1, 5.8, 5.9, 5.10 Data Models
  institutionData = signal({
    mission: '',
    vision: '',
    history: '',
    website: '',
    socialMedia: '',
    iemsDirectory: [], // Point 5.9
  });

  // 5.3 Academic Programs
  academicPrograms = signal<any[]>([
    { id: 1, name: 'Ingeniería en Sistemas', modality: 'Presencial', rvoe: 'ISC-2024-001' },
  ]);

  // Methods
  onFileSelected(event: Event) {
    const element = event.currentTarget as HTMLInputElement;
    let file: File | null = element.files ? element.files[0] : null;

    if (file) {
      const reader = new FileReader();
      reader.onload = () => this.logoPreview.set(reader.result as string);
      reader.readAsDataURL(file);
      // Ready for point 5.5.2 endpoint
    }
  }

  async updateSettings() {
    this.isSaving.set(true);
    try {
      // Logic for points 5.2, 5.4, 5.5.4
      console.log('Syncing with backend...');
    } finally {
      setTimeout(() => this.isSaving.set(false), 1000);
    }
  }
}
