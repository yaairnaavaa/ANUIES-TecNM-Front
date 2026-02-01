import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './reset-password.html',
  styleUrl: './reset-password.css',
})
export class ResetPasswordComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);

  token = signal<string>('');
  form!: FormGroup;
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);
  hidePassword = signal(true);
  hideConfirm = signal(true);

  ngOnInit() {
    const t = this.route.snapshot.paramMap.get('token');
    if (!t?.trim()) {
      this.errorMessage.set('Enlace inválido. Solicita uno nuevo desde el login.');
      return;
    }
    this.token.set(t);
    this.form = this.fb.group(
      {
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

  togglePasswordVisibility() {
    this.hidePassword.update((v) => !v);
  }

  toggleConfirmVisibility() {
    this.hideConfirm.update((v) => !v);
  }

  onSubmit() {
    if (this.form.invalid || this.isLoading()) return;
    const t = this.token();
    if (!t) return;
    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);
    const newPassword = this.form.get('newPassword')?.value;
    this.authService.resetPassword(t, newPassword).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        if (res.success) {
          this.successMessage.set(res.message || 'Contraseña actualizada. Ya puedes iniciar sesión.');
          setTimeout(() => {
            this.router.navigate(['/login'], {
              queryParams: { reset: 'success' },
            });
          }, 2000);
        } else {
          this.errorMessage.set(res.message || 'No se pudo actualizar la contraseña.');
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(
          err.error?.message ||
            'El enlace no es válido o ha expirado. Solicita uno nuevo desde el login.'
        );
      },
    });
  }
}
