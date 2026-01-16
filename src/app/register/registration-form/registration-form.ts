import { Component, inject, Output, EventEmitter, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormGroup, FormControl, Validators } from '@angular/forms';

import { ProspectService } from '../../services/prospect.service';
import { IemsService } from '../../services/iems.service';
import { IesService } from '../../services/ies.service';
import { CampaignService } from '../../services/campaign.service';
import { Prospect } from '../../models/api.models';
import { IES, Campaign } from '../../models/api.models';

@Component({
  selector: 'app-registration-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './registration-form.html',
  styleUrl: './registration-form.css',
})
export class RegistrationForm implements OnInit {
  private prospectService = inject(ProspectService);
  private iemsService = inject(IemsService);
  private iesService = inject(IesService);
  private campaignService = inject(CampaignService);

  @Output() onRegistrationSuccess = new EventEmitter<void>();

  // UI state
  selectedMajors: string[] = [];
  isLoading = false;
  showSuccess = false;
  errorMessage: string | null = null;
  successData: any = null;

  // IEMS autocomplete
  iemsNames: string[] = [];
  filteredIems: string[] = [];

  // Backend data
  iesList = signal<IES[]>([]);
  campaignsList = signal<Campaign[]>([]);
  selectedIES = signal<IES | null>(null);

  majorsList = computed(() => {
    const ies = this.selectedIES();
    if (ies?.careers?.length) {
      return ies.careers
        .filter((c) => c.active)
        .map((c) => ({
          id: c.code || c.name,
          name: c.name,
          meta: `${c.modality} · ${c.duration || 9} semestres`,
        }));
    }
    return this.defaultMajorsList;
  });

  registrationForm = new FormGroup({
    fullName: new FormControl('', Validators.required),
    email: new FormControl('', [Validators.required, Validators.email]),
    phoneNumber: new FormControl('', [Validators.required, Validators.pattern('^[0-9]{10}$')]),
    curp: new FormControl(''),

    previousSchool: new FormControl('', Validators.required),
    currentSemester: new FormControl(''),
    technicalMajor: new FormControl(''),

    campaign: new FormControl(''),

    privacyPolicy: new FormControl(false, Validators.requiredTrue),
  });

  ngOnInit(): void {
    this.loadIEMS();
    this.loadIES();
    this.listenSchoolInput();
  }

  loadIEMS(): void {
    this.iemsService.getAllIEMS({ active: true }).subscribe({
      next: (res) => {
        const data = res.data ?? [];
        this.iemsNames = data.map((i) => i.name);
        this.filteredIems = this.iemsNames;
      },
    });
  }

  loadIES(): void {
    this.iesService.getAllIES({ active: true }).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.iesList.set(res.data);
        }
      },
      error: (err) => console.error('Error cargando IES:', err)
    });
  }

  listenSchoolInput(): void {
    this.registrationForm.get('previousSchool')?.valueChanges.subscribe((value) => {
      if (!value) {
        this.filteredIems = this.iemsNames;
        return;
      }
      const search = value.toLowerCase();
      this.filteredIems = this.iemsNames.filter((n) => n.toLowerCase().includes(search));
    });
  }

  selectSchool(name: string): void {
    this.registrationForm.get('previousSchool')?.setValue(name);
    this.filteredIems = [];
  }

  toggleMajor(id: string): void {
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

  onSubmit(): void {
    if (this.registrationForm.invalid || this.selectedMajors.length === 0) {
      this.errorMessage = 'Por favor completa todos los campos requeridos y selecciona al menos una carrera.';
      return;
    }

    // Validar que se haya seleccionado una IES
    if (!this.selectedIES()?._id) {
      this.errorMessage = 'Por favor selecciona un Tecnológico (IES) de interés.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = null;
    const formValue = this.registrationForm.value;
    const firstCareer = this.majorsList().find((c) => c.id === this.selectedMajors[0]);

    const prospectData: any = {
      // El backend espera fullName, no firstName/lastName por separado
      fullName: formValue.fullName!,
      
      email: formValue.email!,
      phone: {
        mobile: formValue.phoneNumber!,
      },

      // El backend espera originIEMSName (string), no originIEMS (ObjectId)
      originIEMSName: formValue.previousSchool!,
      currentSemester: formValue.currentSemester || undefined,
      technicalMajor: formValue.technicalMajor || undefined,

      // firstChoiceIES es requerido en el backend
      firstChoiceIES: this.selectedIES()!._id,

      careerInterests: this.selectedMajors.map((id, index) => {
        const career = this.majorsList().find((c) => c.id === id);
        return {
          career: career?.name ?? id,
          priority: index + 1,
        };
      }),

      originCampaign: formValue.campaign || undefined,
    };

    this.prospectService.createProspect(prospectData).subscribe({
      next: (res) => {
        this.isLoading = false;
        console.log('Respuesta del registro:', res);
        
        if (res.success && res.data) {
          const data = res.data as any;
          const prospectId = data.id || data._id;
          
          this.successData = {
            fullName: data.fullName,
            school: prospectData.originIEMSName,
            firstChoice: firstCareer?.name || 'N/A',
            folio: prospectId?.toString().substring(0, 8).toUpperCase() || 'N/A',
          };
          
          console.log('Mostrando mensaje de éxito con datos:', this.successData);
          this.showSuccess = true;
          this.onRegistrationSuccess.emit();
        } else {
          console.error('Registro sin éxito:', res);
          this.errorMessage = res.message || 'Error al registrar';
        }
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Error en el registro:', err);
        this.errorMessage = err.error?.message || 'Error al registrar el aspirante';
      }
    });
  }

  resetForm(): void {
    this.showSuccess = false;
    this.registrationForm.reset({
      privacyPolicy: false,
    });
    this.selectedMajors = [];
    this.successData = null;
  }

  defaultMajorsList = [
    { id: 'industrial', name: 'Ingeniería Industrial', meta: 'Procesos' },
    { id: 'systems', name: 'Ingeniería en Sistemas', meta: 'Software' },
    { id: 'mechatronics', name: 'Ingeniería Mecatrónica', meta: 'Robótica' },
  ];
}
