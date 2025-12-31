import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common'; // Importante para ngClass


@Component({
  selector: 'app-stepper',
  imports: [ CommonModule],
  templateUrl: './stepper.html',
  styleUrl: './stepper.css',
})
export class Stepper {
  // 1 = Datos, 2 = Intereses, 3 = Confirmar
  @Input() currentStep: number = 1;
}
