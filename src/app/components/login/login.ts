import { Component, signal, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);

  // 'login' muestra el acceso, 'forgot' muestra recuperar contraseña
  mode = signal<'login' | 'forgot'>('login');
  isLoading = signal(false);
  errorMessage = signal<string>('');
  successMessage = signal<string>('');
  hidePassword = signal(true);

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

  ngOnInit() {
    const reset = this.route.snapshot.queryParamMap.get('reset');
    if (reset === 'success') {
      this.successMessage.set('Contraseña actualizada correctamente. Ya puedes iniciar sesión.');
      this.router.navigate([], { queryParams: {}, queryParamsHandling: '' });
      setTimeout(() => this.successMessage.set(''), 6000);
    }
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
    if (this.forgotForm.invalid) return;
    this.isLoading.set(true);
    this.errorMessage.set('');
    const email = this.forgotForm.get('email')?.value?.trim() ?? '';
    this.authService.requestPasswordReset(email).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        if (res.success) {
          this.errorMessage.set('');
          alert(res.message || 'Si el correo está registrado, recibirás un enlace para restablecer tu contraseña. Revisa tu bandeja de entrada y spam.');
          this.changeMode('login');
        } else {
          this.errorMessage.set(res.message || 'No se pudo enviar el correo.');
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(
          err.error?.message || 'No se pudo enviar el correo. Intenta de nuevo más tarde.'
        );
      },
    });
  }

  changeMode(newMode: 'login' | 'forgot') {
    this.mode.set(newMode);
  }

  togglePasswordVisibility() {
  this.hidePassword.update(v => !v);
}
}
