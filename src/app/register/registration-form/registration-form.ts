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
import { finalize } from 'rxjs/operators';
import { curpValidator } from '../../validators/curp.validator';
import { ProspectService } from '../../services/prospect.service';
import { IemsService } from '../../services/iems.service';
import { IesService } from '../../services/ies.service';
import { CampaignService } from '../../services/campaign.service';
import { IES, Campaign, Prospect } from '../../models/api.models';

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

  @Input() campaignId: string | null = null;
  @Output() onRegistrationSuccess = new EventEmitter<void>();

  // --- UI State (IEMS / Escuelas) ---
  showIemsList = false;
  isSelectingIems = false;
  iemsData: IemsBasicInfo[] = [];
  filteredIems: IemsBasicInfo[] = [];

  // --- UI State (IES / Tecnológicos) ---
  showIesList = false;
  filteredIes = signal<IES[]>([]);
  selectedIES = signal<IES | null>(null);

  // --- Form State ---
  selectedMajors: string[] = [];
  isLoading = signal(false);
  showSuccess = signal(false);
  errorMessage = signal<string | null>(null);
  successData: any = null;

  // --- Data Lists ---
  iesList = signal<IES[]>([]);
  campaignsList = signal<Campaign[]>([]);
  currentCampaign = signal<Campaign | null>(null);

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
  // Cambia tu propiedad computada por esta:
  majorsList = computed(() => {
    const ies = this.selectedIES();

    // Si hay una IES seleccionada Y tiene carreras activas, las mostramos
    if (ies?.careers && ies.careers.filter((c) => c.active).length > 0) {
      return ies.careers
        .filter((c) => c.active)
        .map((c) => ({
          id: c.code || c.name,
          name: c.name,
          meta: `${c.modality || 'Presencial'} · ${c.duration || 9} semestres`,
        }));
    }

    // Si no hay IES o la IES no tiene carreras registradas aún,
    // mostramos la lista por defecto para que el formulario no se vea vacío
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
    
    // Cargar campaña si se proporciona un ID
    if (this.campaignId) {
      this.loadCampaign(this.campaignId);
    }
  }

  /**
   * Cargar información de la campaña específica
   */
  loadCampaign(campaignId: string): void {
    console.log('🔍 Cargando información de la campaña:', campaignId);
    
    this.campaignService.getCampaignById(campaignId).subscribe({
      next: (response: any) => {
        console.log('✅ Respuesta de la campaña:', response);
        
        // Manejar diferentes estructuras de respuesta
        const isSuccess = response.success === true || response.status === 'success';
        const campaignData = response.data;
        
        if (isSuccess && campaignData) {
          this.currentCampaign.set(campaignData);
          console.log('📋 Campaña cargada:', campaignData);
          
          // Pre-llenar el campo de campaña en el formulario
          this.registrationForm.patchValue({
            campaign: campaignData.name || campaignId
          });
        } else {
          console.warn('⚠️ No se pudo cargar la campaña');
        }
      },
      error: (error) => {
        console.error('❌ Error al cargar la campaña:', error);
        this.errorMessage.set('No se pudo cargar la información de la campaña');
      }
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
            this.successData = {
              fullName: data.fullName,
              school: prospectData.originIEMSName,
              firstChoice: firstCareer?.name || 'N/A',
              folio: (data.id || data._id).toString().substring(0, 8).toUpperCase(),
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
  }

  onBlurIems() {
    // pequeño delay para permitir el mousedown del <li>
    setTimeout(() => {
      this.showIemsList = false;
    }, 150);
  }

  defaultMajorsList = [
    { id: 'industrial', name: 'Ingeniería Industrial', meta: 'Procesos' },
    { id: 'systems', name: 'Ingeniería en Sistemas', meta: 'Software' },
    { id: 'mechatronics', name: 'Ingeniería Mecatrónica', meta: 'Robótica' },
  ];
}
