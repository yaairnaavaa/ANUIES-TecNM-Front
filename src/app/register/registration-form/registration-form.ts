import { Component, inject, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { RegistrationService } from '../../services/registration.service';
import { ApplicantRegistration } from '../../interfaces/register.model';

@Component({
  selector: 'app-registration-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './registration-form.html',
  styleUrl: './registration-form.css',
})
export class RegistrationForm {
  private registrationService = inject(RegistrationService);

  // Avisamos al componente padre (Register) que el registro fue exitoso
  @Output() onRegistrationSuccess = new EventEmitter<void>();

  selectedMajors: string[] = [];
  isLoading = false;
  errorMessage: string | null = null;

  registrationForm = new FormGroup({
    fullName: new FormControl('Juan Martínez López', [Validators.required]),
    email: new FormControl('', [Validators.required, Validators.email]),
    phoneNumber: new FormControl('', [Validators.required, Validators.pattern('^[0-9]{10}$')]),
    previousSchool: new FormControl('', [Validators.required]),
    currentSemester: new FormControl(''),
    technicalMajor: new FormControl(''),
    marketingChannel: new FormControl('', [Validators.required]),
    privacyPolicy: new FormControl(false, [Validators.requiredTrue]),
  });

  // Los nombres están en ESPAÑOL (vista), pero los IDs se quedan en inglés (para la base de datos)
  majorsList = [
    { id: 'industrial', name: 'Ingeniería Industrial', meta: 'Optimización de procesos · Alta demanda' },
    { id: 'systems', name: 'Ingeniería en Sistemas Computacionales', meta: 'Desarrollo de software · TI' },
    { id: 'mechatronics', name: 'Ingeniería Mecatrónica', meta: 'Robótica y automatización · Industria 4.0' },
    { id: 'electronics', name: 'Ingeniería Electrónica', meta: 'Circuitos y sistemas electrónicos' },
    { id: 'civil', name: 'Ingeniería Civil', meta: 'Construcción e infraestructura' },
    { id: 'management', name: 'Ingeniería en Gestión Empresarial', meta: 'Administración y negocios' },
  ];

  channelsList = [
    { id: 'fair', label: 'Feria / Evento', icon: 'fas fa-calendar-star' },
    { id: 'visit', label: 'Visita a mi escuela', icon: 'fas fa-school' },
    { id: 'tiktok', label: 'TikTok', icon: 'fab fa-tiktok' },
    { id: 'instagram', label: 'Instagram', icon: 'fab fa-instagram' },
    { id: 'facebook', label: 'Facebook', icon: 'fab fa-facebook' },
    { id: 'referral', label: 'Familiar/Amigo', icon: 'fas fa-user-friends' },
  ];

  toggleMajor(id: string) {
    const index = this.selectedMajors.indexOf(id);
    if (index > -1) {
      this.selectedMajors.splice(index, 1);
    } else if (this.selectedMajors.length < 3) {
      this.selectedMajors.push(id);
    }
  }

  getPriority(id: string): string {
    const index = this.selectedMajors.indexOf(id);
    return index !== -1 ? `${index + 1}ª` : '';
  }

  onSubmit() {
    if (this.registrationForm.valid && this.selectedMajors.length > 0) {
      this.isLoading = true;
      this.errorMessage = null;

      // Mapeamos los datos al formato de la interfaz
      const payload: ApplicantRegistration = {
        fullName: this.registrationForm.value.fullName!,
        email: this.registrationForm.value.email!,
        phoneNumber: this.registrationForm.value.phoneNumber!,
        previousSchool: this.registrationForm.value.previousSchool!,
        currentSemester: this.registrationForm.value.currentSemester || undefined,
        technicalMajor: this.registrationForm.value.technicalMajor || undefined,
        interestedMajors: this.selectedMajors,
        marketingChannel: this.registrationForm.value.marketingChannel!
      };

      this.registrationService.submitRegistration(payload).subscribe({
        next: (response) => {
          this.isLoading = false;
          console.log('Registro exitoso:', response);
          // Emitimos el evento para que el stepper del padre avance al paso 2
          this.onRegistrationSuccess.emit();
        },
        error: (error) => {
          this.isLoading = false;
          this.errorMessage = 'Ocurrió un error al procesar tu registro. Por favor, intenta de nuevo.';
          console.error('Registration error:', error);
        },
      });
    }
  }
}