import { Component, inject, Output, EventEmitter, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormsModule,
  FormGroup,
  FormControl,
  Validators,
} from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { curpValidator } from '../../validators/curp.validator';

import { ProspectService } from '../../services/prospect.service';
import { IemsService } from '../../services/iems.service';
import { IesService } from '../../services/ies.service';
import { CampaignService } from '../../services/campaign.service';
import { Prospect } from '../../models/api.models';
import { IES, Campaign } from '../../models/api.models';

interface IemsBasicInfo {
  name: string;
  state: string;
}

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
  showIemsList = false;
  isSelecting = false;
  @Output() onRegistrationSuccess = new EventEmitter<void>();

  // UI state
  selectedMajors: string[] = [];
  isLoading = signal(false);
  showSuccess = signal(false);
  errorMessage = signal<string | null>(null);
  successData: any = null;
  showIesList = false;
  filteredIes = signal<any[]>([]);

  // IEMS autocomplete
  iemsData: IemsBasicInfo[] = []; // Nueva lista de objetos completa
  filteredIems: IemsBasicInfo[] = []; // Ahora filtrará objetos

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
    curp: new FormControl('', [curpValidator()]),

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
    this.filteredIes.set(this.iesList());
  }

  loadIEMS(): void {
    this.iemsService.getAllIEMS({ active: true }).subscribe({
      next: (res) => {
        const data = res.data ?? [];
        // Extraemos nombre y estado de la estructura anidada
        this.iemsData = data.map((i: any) => ({
          name: i.name,
          state: i.address?.state || 'N/A',
        }));
        this.filteredIems = this.iemsData;
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
      error: (err) => console.error('Error cargando IES:', err),
    });
  }

  listenSchoolInput(): void {
    this.registrationForm.get('previousSchool')?.valueChanges.subscribe((value) => {
      if (this.isSelecting) {
        this.isSelecting = false;
        return;
      }

      // Si el input está vacío, mostramos toda la lista original
      if (!value) {
        this.filteredIems = this.iemsData;
        return;
      }

      const search = value.toLowerCase();
      this.filteredIems = this.iemsData.filter(
        (school) =>
          school.name.toLowerCase().includes(search) || school.state.toLowerCase().includes(search),
      );

      // Abrimos la lista automáticamente al escribir
      this.showIemsList = true;
    });
  }

  selectSchool(schoolName: string): void {
    this.isSelecting = true;
    this.registrationForm.get('previousSchool')?.setValue(schoolName);
    this.showIemsList = false; // Cerramos al seleccionar
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
      this.errorMessage.set(
        'Por favor completa todos los campos requeridos y selecciona al menos una carrera.',
      );
      return;
    }

    // Validar que se haya seleccionado una IES
    if (!this.selectedIES()?._id) {
      this.errorMessage.set('Por favor selecciona un Tecnológico (IES) de interés.');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);
    const formValue = this.registrationForm.value;
    const firstCareer = this.majorsList().find((c) => c.id === this.selectedMajors[0]);

    const prospectData: any = {
      // El backend espera fullName, no firstName/lastName por separado
      fullName: formValue.fullName!,

      email: formValue.email!,
      phone: {
        mobile: formValue.phoneNumber!,
      },

      // Normalizar CURP a mayúsculas y trim
      curp: formValue.curp?.trim().toUpperCase() || undefined,

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

    this.prospectService
      .createProspect(prospectData)
      .pipe(
        finalize(() => {
          // Asegurar que isLoading siempre se restablezca, incluso si hay errores
          this.isLoading.set(false);
        }),
      )
      .subscribe({
        next: (res) => {
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
            this.showSuccess.set(true);
            this.onRegistrationSuccess.emit();
          } else {
            console.error('Registro sin éxito:', res);
            this.errorMessage.set(res.message || 'Error al registrar');
          }
        },
        error: (err) => {
          console.error('Error en el registro:', err);
          this.errorMessage.set(err.error?.message || 'Error al registrar el aspirante');
        },
      });
  }

  // 3. Función de filtrado
  filterIes(event: any) {
    const query = event.target.value.toLowerCase();
    this.showIesList = true;

    if (!query) {
      this.filteredIes.set(this.iesList());
      return;
    }

    const results = this.iesList().filter((ies) => ies.name.toLowerCase().includes(query));
    this.filteredIes.set(results);
  }

  // 4. Selección del Tecnológico
  selectIes(ies: any) {
    this.selectedIES.set(ies);
    this.showIesList = false;
    // Opcional: limpiar el input después de seleccionar o emitir evento
  }

  // 5. Cierre al perder foco
  onBlurIes() {
    setTimeout(() => {
      this.showIemsList = false;
    }, 200);
  }

  onBlur(): void {
    // Damos un margen de 200ms para que el clic en la lista funcione
    setTimeout(() => {
      this.showIemsList = false;
    }, 200);
  }
  resetForm(): void {
    this.showSuccess.set(false);
    this.registrationForm.reset({
      privacyPolicy: false,
    });
    this.selectedMajors = [];
    this.successData = null;
    this.errorMessage.set(null);
  }

  defaultMajorsList = [
    { id: 'industrial', name: 'Ingeniería Industrial', meta: 'Procesos' },
    { id: 'systems', name: 'Ingeniería en Sistemas', meta: 'Software' },
    { id: 'mechatronics', name: 'Ingeniería Mecatrónica', meta: 'Robótica' },
  ];
}
