import { Component, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { email } from '@angular/forms/signals';
@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  // 'login' muestra el acceso, 'forgot' muestra recuperar contraseña
  mode = signal<'login' | 'forgot'>('login');
  isLoading = signal(false);

  loginForm: FormGroup;
  forgotForm: FormGroup;

  constructor(private fb: FormBuilder) {
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
      console.log('Datos de login:', this.loginForm.value);
      // Simulación de espera de API
      setTimeout(() => this.isLoading.set(false), 2000);
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
