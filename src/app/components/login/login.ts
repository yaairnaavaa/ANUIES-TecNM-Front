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
    if (this.loginForm.valid) {
      this.isLoading.set(true);
      this.errorMessage.set('');
      
      const { email, password } = this.loginForm.value;
      
      console.log('Intentando login con:', email); // Debug
      
      this.authService.login(email, password).subscribe({
        next: (response) => {
          console.log('Respuesta del login:', response); // Debug
          this.isLoading.set(false);
          if (response.success) {
            // Redirigir según el rol del usuario
            const user = this.authService.currentUser();
            console.log('Usuario autenticado:', user); // Debug
            if (user && ['Admin Nacional', 'Admin IES', 'Operativo IES'].includes(user.role)) {
              console.log('Redirigiendo a /admin'); // Debug
              this.router.navigate(['/admin']);
            } else {
              console.log('Redirigiendo a /register'); // Debug
              this.router.navigate(['/register']);
            }
          } else {
            this.errorMessage.set('Error de autenticación');
          }
        },
        error: (error) => {
          this.isLoading.set(false);
          console.error('Error completo en login:', error); // Debug detallado
          this.errorMessage.set(error.error?.message || 'Error al iniciar sesión. Verifica tus credenciales.');
        }
      });
    } else {
      this.errorMessage.set('Por favor completa todos los campos correctamente');
    }
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
