import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './user-profile.html',
  styleUrl: './user-profile.css',
})
export class UserProfileComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);

  passwordForm!: FormGroup;
  isLoading = signal(false);
  successMessage = signal<string | null>(null);
  errorMessage = signal<string | null>(null);
  hideCurrent = signal(true);
  hideNew = signal(true);
  hideConfirm = signal(true);

  user = computed(() => this.authService.currentUser());

  constructor() {
    this.buildPasswordForm();
  }

  private buildPasswordForm(): void {
    this.passwordForm = this.fb.group(
      {
        currentPassword: ['', [Validators.required]],
        newPassword: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', [Validators.required]],
      },
      { validators: this.passwordMatchValidator }
    );
  }

  passwordMatchValidator(g: FormGroup): { [key: string]: boolean } | null {
    const newP = g.get('newPassword')?.value;
    const confirm = g.get('confirmPassword')?.value;
    if (confirm === '' || newP === confirm) return null;
    return { mismatch: true };
  }

  toggleCurrentVisibility(): void {
    this.hideCurrent.update((v) => !v);
  }
  toggleNewVisibility(): void {
    this.hideNew.update((v) => !v);
  }
  toggleConfirmVisibility(): void {
    this.hideConfirm.update((v) => !v);
  }

  onSubmitPassword(): void {
    if (this.passwordForm.invalid || this.isLoading()) return;
    this.isLoading.set(true);
    this.successMessage.set(null);
    this.errorMessage.set(null);

    const { currentPassword, newPassword } = this.passwordForm.value;
    this.authService.updatePassword(currentPassword, newPassword).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        if (res.success) {
          this.successMessage.set('Contraseña actualizada correctamente.');
          this.passwordForm.reset();
        } else {
          this.errorMessage.set(res.message || 'No se pudo actualizar la contraseña.');
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        const msg =
          err.error?.message ||
          (err.status === 401 ? 'Contraseña actual incorrecta.' : 'Error al actualizar. Intenta de nuevo.');
        this.errorMessage.set(msg);
      },
    });
  }

  clearMessages(): void {
    this.successMessage.set(null);
    this.errorMessage.set(null);
  }

  getIesName(): string {
    const ies = this.user()?.ies;
    if (!ies) return '—';
    if (typeof ies === 'object' && ies !== null && 'name' in ies) return (ies as { name?: string }).name ?? '—';
    return '—';
  }
}
