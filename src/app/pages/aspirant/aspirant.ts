import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-aspirant',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './aspirant.html',
  styleUrl: './aspirant.css',
})
export class Aspirant {
  // Lista completa de registros
  aspirants = signal<any[]>([
    {
      _id: { $oid: "696a6abf21651557cf918581" },
      fullName: "Jorge Ismael Betancourt Espericueta",
      gender: "Prefiero no decir",
      email: "joisbetancourtes@ittepic.edu.mx",
      phone: { mobile: "3891089322" },
      originIEMSName: "TELEBACHILLERATO MARAVILLAS",
      currentSemester: "6",
      careerInterests: [
        { career: "Ingeniería en Sistemas", priority: 1 },
        { career: "Ingeniería Industrial", priority: 2 }
      ],
      status: "active",
      processStatus: { registrationComplete: false, profileValidated: false },
      createdAt: { $date: "2026-01-16T16:43:43.267Z" }
    },
    {
      _id: { $oid: "696a6abf21651557cf918585" },
      fullName: "Ana Valeria Mendoza Rojas",
      gender: "Mujer",
      email: "valeria.mendoza@gmail.com",
      phone: { mobile: "3111234567" },
      originIEMSName: "CBTIS 100",
      currentSemester: "6",
      careerInterests: [
        { career: "Licenciatura en Administración", priority: 1 },
        { career: "Ingeniería en Gestión Empresarial", priority: 2 }
      ],
      status: "active",
      processStatus: { registrationComplete: true, profileValidated: true },
      createdAt: { $date: "2026-01-15T10:20:00.000Z" }
    },
    {
      _id: { $oid: "696a6abf21651557cf918589" },
      fullName: "Carlos Eduardo Peña Nieto",
      gender: "Hombre",
      email: "eduardo.peña@outlook.com",
      phone: { mobile: "3119876543" },
      originIEMSName: "PREPA 1 UAN",
      currentSemester: "6",
      careerInterests: [
        { career: "Ingeniería Civil", priority: 1 }
      ],
      status: "active",
      processStatus: { registrationComplete: true, profileValidated: false },
      createdAt: { $date: "2026-01-14T08:15:22.000Z" }
    },
    {
      _id: { $oid: "696a6abf21651557cf918590" },
      fullName: "Ximena Guadalupe Ortiz",
      gender: "Mujer",
      email: "ximena.ortiz@ittepic.edu.mx",
      phone: { mobile: "3221112233" },
      originIEMSName: "COBAEN Tepic",
      currentSemester: "5",
      careerInterests: [
        { career: "Arquitectura", priority: 1 },
        { career: "Ingeniería Civil", priority: 2 }
      ],
      status: "inactive",
      processStatus: { registrationComplete: false, profileValidated: false },
      createdAt: { $date: "2026-01-10T12:00:00.000Z" }
    }
  ]);

  // Aspirante seleccionado para mostrar en las cards de arriba
  selectedAspirant = signal<any>(this.aspirants()[0]);

  // Lógica simple para seleccionar un aspirante de la tabla
  selectAspirant(aspirant: any) {
    this.selectedAspirant.set(aspirant);
  }

  // Helpers para el estado en el HTML
  getStatusLabel(status: any) {
    if (status.profileValidated) return 'Validado';
    if (status.registrationComplete) return 'Completo';
    return 'Pendiente';
  }
}