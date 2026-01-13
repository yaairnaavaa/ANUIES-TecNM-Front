import { Component, inject, Output, EventEmitter, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { ProspectService } from '../../services/prospect.service';
import { IesService } from '../../services/ies.service';
import { CampaignService } from '../../services/campaign.service';
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
  private iesService = inject(IesService);
  private campaignService = inject(CampaignService);

  // Avisamos al componente padre (Register) que el registro fue exitoso
  @Output() onRegistrationSuccess = new EventEmitter<void>();

  selectedMajors: string[] = [];
  isLoading = false;
  errorMessage: string | null = null;
  showSuccess = false;
  successData: any = null;

  // Data del backend
  iesList = signal<IES[]>([]);
  campaignsList = signal<Campaign[]>([]);
  selectedIES = signal<IES | null>(null);

  // Computed para obtener las carreras disponibles
  majorsList = computed(() => {
    const ies = this.selectedIES();
    if (ies && ies.careers && ies.careers.length > 0) {
      return ies.careers.filter(c => c.active).map(c => ({
        id: c.code || c.name,
        name: c.name,
        meta: `${c.modality} · ${c.duration || 9} semestres`
      }));
    }
    // Lista por defecto si no hay IES seleccionada
    return this.defaultMajorsList;
  });

  registrationForm = new FormGroup({
    // Información personal
    fullName: new FormControl('', [Validators.required]),
    firstName: new FormControl('', [Validators.required]),
    lastName: new FormControl('', [Validators.required]),
    secondLastName: new FormControl(''),
    email: new FormControl('', [Validators.required, Validators.email]),
    phoneNumber: new FormControl('', [Validators.required, Validators.pattern('^[0-9]{10}$')]),
    birthDate: new FormControl('', [Validators.required]),
    gender: new FormControl('', [Validators.required]),
    curp: new FormControl('', [Validators.pattern('^[A-Z]{4}[0-9]{6}[HM][A-Z]{5}[0-9A-Z][0-9]$')]),
    
    // Información académica
    previousSchool: new FormControl('', [Validators.required]),
    currentSemester: new FormControl(''),
    technicalMajor: new FormControl(''),
    averageGrade: new FormControl('', [Validators.min(0), Validators.max(10)]),
    expectedGraduationDate: new FormControl(''),
    
    // IES y campaña
    ies: new FormControl('', [Validators.required]),
    campaign: new FormControl(''),
    
    // Preferencias
    interestedShift: new FormControl('', [Validators.required]),
    marketingChannel: new FormControl(''),
    privacyPolicy: new FormControl(false, [Validators.requiredTrue]),
  });

  ngOnInit() {
    this.loadIESList();
    this.loadActiveCampaigns();
  }

  /**
   * Cargar lista de IES disponibles
   */
  loadIESList() {
    this.iesService.getAllIES({ active: true }).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.iesList.set(response.data);
        }
      },
      error: (error) => console.error('Error cargando IES:', error)
    });
  }

  /**
   * Cargar campañas activas
   */
  loadActiveCampaigns() {
    this.campaignService.getCampaigns({ status: 'En Curso' }).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.campaignsList.set(response.data);
        }
      },
      error: (error) => console.error('Error cargando campañas:', error)
    });
  }

  /**
   * Cuando selecciona una IES, cargar sus carreras
   */
  onIESChange(iesId: string) {
    const ies = this.iesList().find(i => i._id === iesId);
    this.selectedIES.set(ies || null);
    this.selectedMajors = []; // Limpiar carreras seleccionadas al cambiar de IES
  }

  // Los nombres están en ESPAÑOL (vista), pero los IDs se quedan en inglés (para la base de datos)
  defaultMajorsList = [
    {
      id: 'industrial',
      name: 'Ingeniería Industrial',
      meta: 'Optimización de procesos · Alta demanda',
    },
    {
      id: 'systems',
      name: 'Ingeniería en Sistemas Computacionales',
      meta: 'Desarrollo de software · TI',
    },
    {
      id: 'mechatronics',
      name: 'Ingeniería Mecatrónica',
      meta: 'Robótica y automatización · Industria 4.0',
    },
    {
      id: 'electronics',
      name: 'Ingeniería Electrónica',
      meta: 'Circuitos y sistemas electrónicos',
    },
    { id: 'civil', name: 'Ingeniería Civil', meta: 'Construcción e infraestructura' },
    {
      id: 'management',
      name: 'Ingeniería en Gestión Empresarial',
      meta: 'Administración y negocios',
    },
  ];

  channelsList = [
    { id: 'fair', label: 'Feria / Evento', icon: 'fas fa-calendar-star' },
    { id: 'visit', label: 'Visita a mi escuela', icon: 'fas fa-school' },
    { id: 'tiktok', label: 'TikTok', icon: 'fab fa-tiktok' },
    { id: 'instagram', label: 'Instagram', icon: 'fab fa-instagram' },
    { id: 'facebook', label: 'Facebook', icon: 'fab fa-facebook' },
    { id: 'referral', label: 'Familiar/Amigo', icon: 'fas fa-user-friends' },
  ];

  shiftOptions = [
    { value: 'Matutino', label: 'Matutino (7:00 - 13:00)' },
    { value: 'Vespertino', label: 'Vespertino (13:00 - 19:00)' },
    { value: 'Nocturno', label: 'Nocturno (19:00 - 22:00)' }
  ];

  genderOptions = [
    { value: 'Masculino', label: 'Masculino' },
    { value: 'Femenino', label: 'Femenino' },
    { value: 'Otro', label: 'Otro' },
    { value: 'Prefiero no decir', label: 'Prefiero no decir' }
  ];

  toggleMajor(id: string) {
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

  onSubmit() {
    if (this.registrationForm.valid && this.selectedMajors.length > 0) {
      this.isLoading = true;
      this.errorMessage = null;

      const formValue = this.registrationForm.value;
      const firstCareer = this.majorsList().find((c: { id: string; name: string; meta: string }) => c.id === this.selectedMajors[0]);

      // Preparar datos para el backend
      const prospectData = {
        personalInfo: {
          firstName: formValue.firstName || '',
          lastName: formValue.lastName || '',
          secondLastName: formValue.secondLastName || '',
          birthDate: formValue.birthDate || '',
          gender: formValue.gender as any || 'Prefiero no decir',
          curp: formValue.curp || ''
        },
        contact: {
          email: formValue.email || '',
          phone: formValue.phoneNumber || '',
          address: {
            municipality: '', // Puedes agregarlo al formulario si lo necesitas
            state: ''
          }
        },
        academicInfo: {
          currentSchool: formValue.previousSchool || '',
          expectedGraduationDate: formValue.expectedGraduationDate || undefined,
          averageGrade: formValue.averageGrade ? Number(formValue.averageGrade) : undefined,
          interestedCareer: firstCareer?.name || this.selectedMajors[0],
          interestedShift: formValue.interestedShift ? [formValue.interestedShift as any] : []
        },
        ies: formValue.ies || '',
        campaign: formValue.campaign || undefined,
        status: 'Nuevo' as const
      };

      // Llamar al backend
      this.prospectService.createProspect(prospectData).subscribe({
        next: (response) => {
          this.isLoading = false;
          if (response.success && response.data) {
            this.successData = {
              fullName: `${formValue.firstName} ${formValue.lastName}`,
              school: formValue.previousSchool,
              firstChoice: firstCareer?.name,
              folio: response.data._id?.substring(0, 8).toUpperCase() || 'N/A',
              ies: this.selectedIES()?.name || 'TecNM'
            };
            this.showSuccess = true;
            this.onRegistrationSuccess.emit();
          }
        },
        error: (error) => {
          this.isLoading = false;
          console.error('Error en registro:', error);
          this.errorMessage = error.error?.message || 'Error al procesar el registro. Por favor intenta de nuevo.';
        }
      });
    } else {
      this.errorMessage = 'Por favor completa todos los campos requeridos y selecciona al menos una carrera.';
    }
  }

  resetForm() {
    this.showSuccess = false;
    this.registrationForm.reset({
      firstName: '',
      lastName: '',
      email: '',
      phoneNumber: '',
      privacyPolicy: false,
    });
    this.selectedMajors = [];
    this.successData = null;
  }
}
