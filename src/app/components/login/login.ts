import { Component, signal, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private authService = inject(AuthService);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  // 'login' muestra el acceso, 'forgot' muestra recuperar contraseña
  mode = signal<'login' | 'forgot'>('login');
  isLoading = signal(false);
  errorMessage = signal<string>('');

  loginForm: FormGroup;
  forgotForm: FormGroup;

  constructor() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
    this.forgotForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
    });
  }

  onLogin() {
    if (this.loginForm.invalid) {
      this.errorMessage.set('Por favor completa todos los campos correctamente');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    const { email, password } = this.loginForm.value;

    this.authService.login(email, password).subscribe({
      next: (response) => {
        this.isLoading.set(false);

        if (!response.success) {
          this.errorMessage.set(response.message || 'Error de autenticación');
          return;
        }

        const user = this.authService.currentUser();

        if (!user) {
          this.errorMessage.set('No se pudo cargar la sesión');
          return;
        }

        const roleName = user.role.name;

        if (roleName === 'Admin Nacional') {
          // El Admin Nacional sí va a la gestión global
          this.router.navigate(['/admin']);
        } else if (roleName === 'Admin IES' || roleName === 'Operativo IES') {
          // Los de la universidad van a su sección específica
          this.router.navigate(['/ies']);
        } else {
          this.router.navigate(['/register']);
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(
          err.error?.message || 'Error al iniciar sesión. Verifica tus credenciales.',
        );
      },
    });
  }

  onForgot() {
    if (this.forgotForm.valid) {
      this.isLoading.set(true);
      console.log('Enviando recuperación a: ', this.forgotForm.get('email')?.value);
      setTimeout(() => this.isLoading.set(false), 2000);
    }
  }

  changeMode(newMode: 'login' | 'forgot') {
    this.mode.set(newMode);
  }
}
