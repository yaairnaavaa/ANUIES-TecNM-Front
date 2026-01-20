import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IES } from '../../../models/api.models';

@Component({
  selector: 'app-ies-edit-component',
  standalone: true,
  imports: [CommonModule, FormsModule], // Importante para el [(ngModel)]
  templateUrl: './ies-edit-component.html',
})
export class IesEditComponent {
  @Input() ies: IES | null = null;

  @Output() onSave = new EventEmitter<IES>();
  @Output() onClose = new EventEmitter<void>();
}
