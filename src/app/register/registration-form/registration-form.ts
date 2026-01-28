import {
  Component,
  inject,
  Input,
  Output,
  EventEmitter,
  OnInit,
  signal,
  computed,
  HostListener,
  ElementRef,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormsModule,
  FormGroup,
  FormControl,
  Validators,
} from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { finalize } from 'rxjs/operators';
import { curpValidator } from '../../validators/curp.validator';
import { ProspectService } from '../../services/prospect.service';
import { IemsService } from '../../services/iems.service';
import { IesService } from '../../services/ies.service';
import { CampaignService } from '../../services/campaign.service';
import { IES, Campaign, Prospect } from '../../models/api.models';
import { environment } from '../../../environments/environment';

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
  private http = inject(HttpClient);

  @Input() campaignId: string | null = null;
  @Output() onRegistrationSuccess = new EventEmitter<void>();
  @Input() campaign: any = null; // Información de la campaña

  // --- UI State (IEMS / Escuelas) ---
  showIemsList = false;
  isSelectingIems = false;
  iemsData: IemsBasicInfo[] = [];
  filteredIems: IemsBasicInfo[] = [];
  isIESLocked = signal(false);


  // --- UI State (IES / Tecnológicos) ---
  showIesList = false;
  filteredIes = signal<IES[]>([]);
  selectedIES = signal<Partial<IES> | null>(null);

  // --- UI State (Género) ---
  genderOptions = ['Masculino', 'Femenino', 'Otro', 'Prefiero no decir'];
  filteredGenderOptions = signal<string[]>(['Masculino', 'Femenino', 'Otro', 'Prefiero no decir']);
  genderSearchQuery = signal('');
  showGenderDropdown = signal(false);

  // --- Form State ---
  selectedMajors: string[] = [];
  isLoading = signal(false);
  showSuccess = signal(false);
  errorMessage = signal<string | null>(null);
  successData: any = null;

  // --- Email State ---
  isSendingEmail = signal(false);
  emailSent = signal(false);

  // --- Data Lists ---
  iesList = signal<IES[]>([]);
  campaignsList = signal<Campaign[]>([]);
  currentCampaign = signal<Campaign | null>(null);
  iesLoadedCareers = signal<any[]>([]); // Carreras de la IES seleccionada
  isLoadingCareers = signal(false); // Estado de carga de carreras

  @ViewChild('iemsContainer') iemsContainer!: ElementRef;

  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent) {
    if (
      this.showIemsList &&
      this.iemsContainer &&
      !this.iemsContainer.nativeElement.contains(event.target)
    ) {
      this.showIemsList = false;
    }
  }

  // --- Computed Properties ---
  majorsList = computed(() => {
    // Si hay carreras cargadas de la IES seleccionada, mostrar esas
    const loadedCareers = this.iesLoadedCareers();
    if (loadedCareers.length > 0) {
      console.log('📚 Mostrando carreras de la IES seleccionada:', loadedCareers.length);
      return loadedCareers;
    }

    // Si no hay carreras cargadas, devolver array vacío
    // Esto permitirá ocultar la sección de carreras
    return [];
  });

  registrationForm = new FormGroup({
    fullName: new FormControl('', Validators.required),
    email: new FormControl('', [Validators.required, Validators.email]),
    phoneNumber: new FormControl('', [Validators.required, Validators.pattern('^[0-9]{10}$')]),
    curp: new FormControl('', [Validators.required, curpValidator()]),
    gender: new FormControl('', Validators.required),
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

    // Sincronizar el valor del género con el input de búsqueda
    this.registrationForm.get('gender')?.valueChanges.subscribe((value) => {
      if (value) {
        this.genderSearchQuery.set(value);
      }
    });

    // Cargar campaña si se proporciona un ID
    if (this.campaignId) {
      this.loadCampaign(this.campaignId);
    }
  }

  /**
   * Cargar información de la campaña específica
   */
  loadCampaign(campaignId: string): void {
    this.campaignService.getCampaignById(campaignId).subscribe({
      next: (response: any) => {
        const isSuccess = response.success === true || response.status === 'success';
        const campaignData = response.data;

        if (isSuccess && campaignData) {
          this.currentCampaign.set(campaignData);

          // ✅ SI LA CAMPAÑA TRAE IES, SELECCIONARLA
          if (campaignData.ies) {
            const iesFromCampaign: IES = campaignData.ies;

            console.log(iesFromCampaign);

            this.selectedIES.set({
              _id: campaignData.ies.iesId,
              name: campaignData.ies.iesName,
            });

            this.loadIESCareers(this.selectedIES()?._id!);
            this.isIESLocked.set(true);
          }

          // setear campaña en el form
          this.registrationForm.patchValue({
            campaign: campaignData._id || campaignId,
          });
        }
      },
      error: () => {
        this.errorMessage.set('No se pudo cargar la información de la campaña');
      },
    });
  }

  /**
   * Cargar carreras de la IES seleccionada
   */
  loadIESCareers(iesId: string): void {
    this.isLoadingCareers.set(true);

    this.iesService.getCareersIES(iesId).subscribe({
      next: (response: any) => {
        console.log('✅ Respuesta de carreras de la IES:', response);

        // Manejar diferentes estructuras de respuesta
        const isSuccess = response.success === true || response.status === 'success';
        const careersData = response.data?.careers || response.data || [];

        if (isSuccess && careersData.length > 0) {
          // Mapear las carreras al formato que espera el componente
          const mappedCareers = careersData.map((c: any) => ({
            id: c.carreraId || c._id || c.code || c.name,
            name: c.carreraName || c.name,
            meta: c.modality || 'Programa Académico',
          }));

          console.log('📚 Carreras cargadas:', mappedCareers.length);
          this.iesLoadedCareers.set(mappedCareers);
        } else {
          console.warn('⚠️ No se encontraron carreras para esta IES');
          this.iesLoadedCareers.set([]);
        }

        this.isLoadingCareers.set(false);
      },
      error: (error) => {
        console.error('❌ Error al cargar carreras de la IES:', error);
        this.iesLoadedCareers.set([]);
        this.isLoadingCareers.set(false);
      },
    });
  }

  /**
   * Obtener nombre de la IES de forma segura (maneja tanto iesName como name)
   */
  getIESName(): string | null {
    const campaign = this.currentCampaign();
    if (!campaign?.ies) return null;

    const ies: any = campaign.ies;
    return ies.iesName || ies.name || null;
  }

  // --- Lógica IEMS (Preparatoria) ---
  loadIEMS(): void {
    this.iemsService.getAllIEMS({ active: true }).subscribe({
      next: (res) => {
        const data = res.data ?? [];
        this.iemsData = data.map((i: any) => ({
          name: i.name,
          state: i.address?.state || 'N/A',
        }));
        this.filteredIems = this.iemsData;
      },
    });
  }

  listenSchoolInput(): void {
    this.registrationForm.get('previousSchool')?.valueChanges.subscribe((value) => {
      if (this.isSelectingIems) {
        this.isSelectingIems = false;
        return;
      }

      if (!value) {
        this.filteredIems = this.iemsData;
        return;
      }

      const search = value.toLowerCase();
      this.filteredIems = this.iemsData.filter(
        (school) =>
          school.name.toLowerCase().includes(search) || school.state.toLowerCase().includes(search),
      );
      this.showIemsList = true;
    });
  }

  selectSchool(schoolName: string): void {
    this.isSelectingIems = true;
    this.registrationForm.get('previousSchool')?.setValue(schoolName);
    this.showIemsList = false;
  }

  // --- Lógica IES (Tecnológicos) ---
  loadIES(): void {
    this.iesService.getAllIES({ active: true }).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.iesList.set(res.data);
          this.filteredIes.set(res.data); // Inicializa la lista filtrada para el primer clic
        }
      },
      error: (err) => console.error('Error cargando IES:', err),
    });
  }

  onFocusIes(): void {
    this.showIesList = true;
    // Si la lista de búsqueda está vacía, mostramos todos los Tecnológicos
    if (this.filteredIes().length === 0) {
      this.filteredIes.set(this.iesList());
    }
  }

  filterIes(event: any): void {
    const query = event.target.value.toLowerCase().trim();
    this.showIesList = true;

    if (!query) {
      this.filteredIes.set(this.iesList());
      return;
    }

    const results = this.iesList().filter((ies) => ies.name.toLowerCase().includes(query));
    this.filteredIes.set(results);
  }

  selectIes(ies: IES): void {
    this.selectedIES.set(ies);
    this.showIesList = false;
    // Reseteamos el filtro para la próxima vez que abra
    this.filteredIes.set(this.iesList());

    // Limpiar carreras previas y selección
    this.iesLoadedCareers.set([]);
    this.selectedMajors = [];

    // Cargar carreras de la IES seleccionada
    if (ies._id) {
      console.log('🎓 Cargando carreras de la IES seleccionada:', ies._id);
      this.loadIESCareers(ies._id);
    }
  }

  onBlurIes(): void {
    setTimeout(() => {
      this.showIesList = false;
    }, 0);
  }

  // --- Lógica de Carreras ---
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

  // --- Envío del Formulario ---
  onSubmit(): void {
    if (this.registrationForm.invalid || this.selectedMajors.length === 0) {
      this.errorMessage.set('Completa los campos y selecciona al menos una carrera.');
      return;
    }

    if (!this.selectedIES()?._id) {
      this.errorMessage.set('Selecciona un Tecnológico de interés.');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const formValue = this.registrationForm.value;
    const firstCareer = this.majorsList().find((c) => c.id === this.selectedMajors[0]);

    const prospectData: any = {
      fullName: formValue.fullName!,
      email: formValue.email!,
      phone: { mobile: formValue.phoneNumber! },
      curp: formValue.curp?.trim().toUpperCase() || undefined,
      gender: formValue.gender || undefined,
      originIEMSName: formValue.previousSchool!,
      currentSemester: formValue.currentSemester || undefined,
      technicalMajor: formValue.technicalMajor || undefined,
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
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (res) => {
          if (res.success && res.data) {
            const data = res.data as any;
            const prospectId = data.id || data._id;
            this.successData = {
              id: prospectId,
              _id: prospectId, // Guardar también como _id para compatibilidad
              fullName: data.fullName,
              school: prospectData.originIEMSName,
              firstChoice: firstCareer?.name || 'N/A',
              folio: prospectId.toString().substring(0, 8).toUpperCase(),
            };
            this.showSuccess.set(true);
            this.onRegistrationSuccess.emit();
          } else {
            this.errorMessage.set(res.message || 'Error al registrar');
          }
        },
        error: (err) => this.errorMessage.set(err.error?.message || 'Error en el servidor'),
      });
  }

  onFocusIems() {
    this.showIemsList = true;
  }

  filterIems(event: Event) {
    const value = (event.target as HTMLInputElement).value.toLowerCase();

    this.filteredIems = this.iemsData.filter((i) => i.name.toLowerCase().includes(value));

    this.showIemsList = true;
  }

  resetForm(): void {
    this.showSuccess.set(false);
    this.registrationForm.reset({ privacyPolicy: false });
    this.selectedMajors = [];
    this.successData = null;
    this.errorMessage.set(null);
    this.selectedIES.set(null);
    this.genderSearchQuery.set('');
    this.filteredGenderOptions.set(this.genderOptions);
    this.isSendingEmail.set(false);
    this.emailSent.set(false);
  }

  onBlurIems() {
    // pequeño delay para permitir el mousedown del <li>
    setTimeout(() => {
      this.showIemsList = false;
    }, 150);
  }

  // --- Lógica de Género ---

  /**
   * Filtrar opciones de género
   */
  filterGender(query: string): void {
    this.genderSearchQuery.set(query);
    this.showGenderDropdown.set(true);

    if (!query.trim()) {
      this.filteredGenderOptions.set(this.genderOptions);
      return;
    }

    const filtered = this.genderOptions.filter((option) =>
      option.toLowerCase().includes(query.toLowerCase()),
    );
    this.filteredGenderOptions.set(filtered);
  }

  /**
   * Seleccionar género
   */
  selectGender(gender: string): void {
    this.genderSearchQuery.set(gender);
    this.registrationForm.patchValue({ gender });
    this.showGenderDropdown.set(false);
  }

  /**
   * Manejar blur del género
   */
  onGenderBlur(): void {
    setTimeout(() => {
      this.showGenderDropdown.set(false);
    }, 200);
  }

  // --- Email Notification ---

  /**
   * Enviar notificación por correo electrónico al prospecto
   */
  sendEmailNotification(): void {
    if (!this.successData) {
      console.error('No hay datos del registro para enviar');
      return;
    }

    this.isSendingEmail.set(true);
    this.emailSent.set(false);

    // Construir el payload con la información del registro
    const emailData = {
      prospectId: this.successData._id, // Usar el _id del prospecto guardado
      fullName: this.successData.fullName,
      email: this.registrationForm.value.email,
      campaignId: this.campaignId || undefined,
      campaignName: this.currentCampaign()?.name || 'Registro ANUIES',
      iesName: this.selectedIES()?.name || 'N/A',
      firstChoice: this.successData.firstChoice || 'N/A',
      folio: this.successData.folio,
    };

    console.log('📧 Enviando correo con datos:', emailData);

    this.http
      .post(`${environment.apiUrl}/notifications/emailCampaign`, emailData)
      .pipe(finalize(() => this.isSendingEmail.set(false)))
      .subscribe({
        next: (response: any) => {
          console.log('✅ Correo enviado exitosamente:', response);
          this.emailSent.set(true);

          // Resetear el estado después de 3 segundos
          setTimeout(() => {
            this.emailSent.set(false);
          }, 3000);
        },
        error: (error) => {
          console.error('❌ Error al enviar correo:', error);
          this.errorMessage.set(
            'Error al enviar el correo electrónico. Por favor intenta de nuevo.',
          );
        },
      });
  }
}
