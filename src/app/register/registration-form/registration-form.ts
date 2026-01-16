import { Component, inject, Output, EventEmitter, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';

import { ProspectService } from '../../services/prospect.service';
import { IemsService } from '../../services/iems.service';
import { IesService } from '../../services/ies.service';
import { CampaignService } from '../../services/campaign.service';
import { Prospect } from '../../models/api.models';
import { IES, Campaign } from '../../models/api.models';

@Component({
  selector: 'app-registration-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
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
      return;
    }

    this.isLoading = true;
    const formValue = this.registrationForm.value;
    const firstCareer = this.majorsList().find((c) => c.id === this.selectedMajors[0]);

    // Separar el nombre completo en partes
    const nameParts = (formValue.fullName || '').trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts[1] || '';
    const secondLastName = nameParts.length > 2 ? nameParts.slice(2).join(' ') : '';

    const prospectData: Partial<Prospect> = {
      firstName,
      lastName,
      secondLastName,

      email: formValue.email!,
      phone: {
        mobile: formValue.phoneNumber!,
      },

      // Buscar el ID de IEMS si existe
      originIEMS: undefined, // Podría buscarse por nombre si se necesita
      currentSemester: formValue.currentSemester ? parseInt(formValue.currentSemester) : undefined,
      iemsCareer: formValue.technicalMajor || undefined,

      firstChoiceIES: this.selectedIES()?._id,

      careerInterests: this.selectedMajors.map((id, index) => {
        const career = this.majorsList().find((c) => c.id === id);
        return {
          career: career?.name ?? id,
          priority: index + 1,
        };
      }),

      originCampaign: formValue.campaign || undefined,
      
      address: {
        postalCode: '', // Puedes agregar este campo al formulario si es necesario
      },
    };

    this.prospectService.createProspect(prospectData).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.success && res.data) {
          this.successData = {
            fullName: formValue.fullName,
            school: formValue.previousSchool,
            firstChoice: firstCareer?.name,
            folio: res.data._id?.substring(0, 8).toUpperCase(),
          };
          this.showSuccess = true;
          this.onRegistrationSuccess.emit();
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || 'Error al registrar el aspirante';
      },
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
