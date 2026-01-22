import { Component, Input, Output, EventEmitter, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IES } from '../../../models/api.models';
import { IesService } from '../../../services/ies.service'; // Ajusta la ruta

@Component({
  selector: 'app-ies-edit-component',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ies-edit-component.html',
})
export class IesEditComponent {
  private iesService = inject(IesService);

  @Input() ies: IES | null = null;
  @Output() onSaved = new EventEmitter<void>(); // Notificar al padre para refrescar lista
  @Output() onClose = new EventEmitter<void>();

  // Signals para feedback visual
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);
  isSaving = signal<boolean>(false);

  saveChanges() {
    if (!this.ies || !this.ies._id) return;

    this.isSaving.set(true);
    this.errorMessage.set(null);

    this.iesService.updateIES(this.ies._id, this.ies).subscribe({
      next: () => {
        this.successMessage.set('Institución actualizada correctamente');
        this.isSaving.set(false);
        
        // Esperar un momento para que el usuario vea el éxito y cerrar
        setTimeout(() => {
          this.onSaved.emit();
          this.onClose.emit();
        }, 1500);
      },
      error: (err) => {
        this.errorMessage.set('Hubo un error al intentar actualizar los datos.');
        this.isSaving.set(false);
      }
    });
  }
}