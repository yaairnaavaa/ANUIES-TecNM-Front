import {
  Component,
  inject,
  OnInit,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormsModule,
  FormGroup,
  FormControl,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { curpValidator } from '../../validators/curp.validator';
import { ProspectService } from '../../services/prospect.service';
import { IesService } from '../../services/ies.service';
import { IemsService } from '../../services/iems.service';
import { Prospect, IES } from '../../models/api.models';

@Component({
  selector: 'app-student-registration',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './student-registration.html',
  styleUrl: './student-registration.css',
})
export class StudentRegistrationComponent implements OnInit {
  private prospectService = inject(ProspectService);
  private iesService = inject(IesService);
  private iemsService = inject(IemsService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  // UI State
  isLoading = signal(false);
  isLoadingProspect = signal(true);
  showSuccess = signal(false);
  errorMessage = signal<string | null>(null);
  
  // Data
  prospectId = signal<string | null>(null);
  prospectData = signal<Prospect | null>(null);
  selectedIES = signal<IES | null>(null);
  
  // IEMS State
  showIemsList = false;
  isSelectingIems = false;
  iemsData: Array<{ name: string; state: string }> = [];
  filteredIems: Array<{ name: string; state: string }> = [];

  registrationForm = new FormGroup({
    // Datos personales
    firstName: new FormControl('', Validators.required),
    lastName: new FormControl('', Validators.required),
    secondLastName: new FormControl(''),
    birthDate: new FormControl('', Validators.required),
    gender: new FormControl('', Validators.required),
    curp: new FormControl('', [Validators.required, curpValidator()]),
    
    // Datos de contacto
    email: new FormControl('', [Validators.required, Validators.email]),
    mobile: new FormControl('', [Validators.required, Validators.pattern('^[0-9]{10}$')]),
    landline: new FormControl(''),
    
    // Dirección
    street: new FormControl('', Validators.required),
    number: new FormControl('', Validators.required),
    neighborhood: new FormControl(''),
    locality: new FormControl(''),
    municipality: new FormControl('', Validators.required),
    state: new FormControl('', Validators.required),
    postalCode: new FormControl('', [Validators.required, Validators.pattern('^[0-9]{5}$')]),
    
    // Información académica de procedencia
    originSchool: new FormControl('', Validators.required),
    technicalMajor: new FormControl(''),
    
    // Discapacidad
    hasDisability: new FormControl(false),
    disabilityType: new FormControl(''),
    disabilityDetails: new FormControl(''),
    
    // Lengua indígena
    speaksIndigenousLanguage: new FormControl(false),
    indigenousLanguage: new FormControl(''),
    
    // Etnia
    belongsToEthnicGroup: new FormControl(false),
    ethnicGroup: new FormControl(''),
  });

  ngOnInit(): void {
    // Cargar IEMS
    this.loadIEMS();
    this.listenSchoolInput();
    
    // Obtener el ID del prospecto de la ruta
    this.route.params.subscribe((params) => {
      const id = params['prospectId'];
      if (id) {
        this.prospectId.set(id);
        this.loadProspectData(id);
      } else {
        this.errorMessage.set('No se proporcionó un ID de prospecto válido');
        this.isLoadingProspect.set(false);
      }
    });

    // Validaciones condicionales para discapacidad
    this.registrationForm.get('hasDisability')?.valueChanges.subscribe((hasDisability) => {
      const disabilityTypeControl = this.registrationForm.get('disabilityType');
      
      if (hasDisability) {
        disabilityTypeControl?.setValidators([Validators.required]);
      } else {
        disabilityTypeControl?.clearValidators();
        disabilityTypeControl?.setValue('');
        this.registrationForm.get('disabilityDetails')?.setValue('');
      }
      disabilityTypeControl?.updateValueAndValidity();
    });

    // Validaciones condicionales para lengua indígena
    this.registrationForm.get('speaksIndigenousLanguage')?.valueChanges.subscribe((speaks) => {
      const languageControl = this.registrationForm.get('indigenousLanguage');
      
      if (speaks) {
        languageControl?.setValidators([Validators.required]);
      } else {
        languageControl?.clearValidators();
        languageControl?.setValue('');
      }
      languageControl?.updateValueAndValidity();
    });

    // Validaciones condicionales para etnia
    this.registrationForm.get('belongsToEthnicGroup')?.valueChanges.subscribe((belongs) => {
      const ethnicControl = this.registrationForm.get('ethnicGroup');
      
      if (belongs) {
        ethnicControl?.setValidators([Validators.required]);
      } else {
        ethnicControl?.clearValidators();
        ethnicControl?.setValue('');
      }
      ethnicControl?.updateValueAndValidity();
    });
  }

  /**
   * Cargar datos del prospecto desde la API
   */
  loadProspectData(id: string): void {
    this.isLoadingProspect.set(true);
    this.errorMessage.set(null);

    this.prospectService.getProspectById(id).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          const prospect = response.data;
          this.prospectData.set(prospect);
          
          // Pre-llenar el formulario con los datos existentes
          this.populateForm(prospect);
          
        } else {
          this.errorMessage.set('No se pudo cargar la información del prospecto');
        }
        this.isLoadingProspect.set(false);
      },
      error: (error) => {
        console.error('Error al cargar prospecto:', error);
        this.errorMessage.set(
          error.error?.message || 'Error al cargar la información del prospecto. Verifica que el enlace sea correcto.'
        );
        this.isLoadingProspect.set(false);
      },
    });
  }

  /**
   * Cargar información de la IES
   */
  loadIESData(iesId: string): void {
    this.iesService.getIESById(iesId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.selectedIES.set(response.data);
        }
      },
      error: (error) => {
        console.error('Error al cargar IES:', error);
      },
    });
  }

  /**
   * Pre-llenar el formulario con los datos del prospecto
   */
  populateForm(prospect: Prospect): void {
    // Separar el nombre completo si existe
    let firstName = prospect.firstName || '';
    let lastName = prospect.lastName || '';
    let secondLastName = prospect.secondLastName || '';

    // Si viene fullName en lugar de nombres separados, intentar separarlo
    if (prospect.fullName && !firstName && !lastName) {
      const nameParts = prospect.fullName.split(' ');
      if (nameParts.length >= 2) {
        firstName = nameParts[0];
        lastName = nameParts[1];
        secondLastName = nameParts.slice(2).join(' ');
      }
    }

    // Marcar que estamos seleccionando para evitar abrir el dropdown
    this.isSelectingIems = true;

    this.registrationForm.patchValue({
      firstName,
      lastName,
      secondLastName,
      birthDate: prospect.birthDate ? this.formatDateForInput(prospect.birthDate) : '',
      gender: prospect.gender || '',
      curp: prospect.curp || '',
      email: prospect.email || '',
      mobile: prospect.phone?.mobile || '',
      landline: prospect.phone?.landline || '',
      street: prospect.address?.street || '',
      number: prospect.address?.number || '',
      neighborhood: prospect.address?.neighborhood || '',
      locality: prospect.address?.locality || '',
      municipality: prospect.address?.municipality || '',
      state: prospect.address?.state || '',
      postalCode: prospect.address?.postalCode || '',
      originSchool: prospect.originIEMSName || '',
      technicalMajor: prospect.technicalMajor || '',
    });

    // Valores por defecto para campos nuevos
    this.registrationForm.patchValue({
      hasDisability: false,
      disabilityType: '',
      disabilityDetails: '',
      speaksIndigenousLanguage: false,
      indigenousLanguage: '',
      belongsToEthnicGroup: false,
      ethnicGroup: '',
    });
  }

  /**
   * Formatear fecha para el input de tipo date
   */
  formatDateForInput(date: Date | string): string {
    if (!date) return '';
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Enviar formulario de registro completado
   */
  onSubmit(): void {
    if (this.registrationForm.invalid) {
      this.errorMessage.set('Por favor completa todos los campos requeridos correctamente.');
      this.markFormGroupTouched(this.registrationForm);
      return;
    }

    if (!this.prospectId()) {
      this.errorMessage.set('No se pudo identificar el registro del prospecto.');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const formValue = this.registrationForm.value;

    // Preparar datos para actualizar
    const updateData: Partial<Prospect> = {
      firstName: formValue.firstName!,
      lastName: formValue.lastName!,
      secondLastName: formValue.secondLastName || undefined,
      birthDate: formValue.birthDate || undefined,
      gender: formValue.gender as any,
      curp: formValue.curp?.trim().toUpperCase() || undefined,
      email: formValue.email!,
      phone: {
        mobile: formValue.mobile!,
        landline: formValue.landline || undefined,
      },
      address: {
        street: formValue.street || undefined,
        number: formValue.number || undefined,
        neighborhood: formValue.neighborhood || undefined,
        locality: formValue.locality || undefined,
        municipality: formValue.municipality || undefined,
        state: formValue.state || undefined,
        postalCode: formValue.postalCode || undefined,
      },
      // Información académica
      originIEMSName: formValue.originSchool || undefined,
      technicalMajor: formValue.technicalMajor || undefined,
      // Observaciones con información adicional
      observations: this.buildObservations(formValue),
      processStatus: {
        registrationComplete: true,
        lastInteraction: new Date().toISOString(),
      },
    } as any; // Usar any temporalmente para campos adicionales

    this.prospectService
      .updateProspect(this.prospectId()!, updateData)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.showSuccess.set(true);
            // Scroll al inicio
            window.scrollTo({ top: 0, behavior: 'smooth' });
          } else {
            this.errorMessage.set(response.message || 'Error al actualizar el registro');
          }
        },
        error: (error) => {
          console.error('Error al actualizar:', error);
          this.errorMessage.set(
            error.error?.message || 'Error al completar el registro. Por favor intenta de nuevo.'
          );
        },
      });
  }

  /**
   * Marcar todos los campos del formulario como tocados para mostrar errores
   */
  private markFormGroupTouched(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach((key) => {
      const control = formGroup.get(key);
      control?.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  /**
   * Obtener el nombre completo del prospecto
   */
  getFullName(): string {
    const prospect = this.prospectData();
    if (prospect?.fullName) {
      return prospect.fullName;
    }
    
    const parts = [
      prospect?.firstName,
      prospect?.lastName,
      prospect?.secondLastName,
    ].filter(Boolean);
    
    return parts.length > 0 ? parts.join(' ') : 'Estudiante';
  }

  /**
   * Obtener el nombre de la escuela de procedencia
   */
  getOriginSchool(): string {
    return this.prospectData()?.originIEMSName || 'No especificada';
  }

  /**
   * Obtener las carreras de interés
   */
  getCareerInterests(): string {
    const interests = this.prospectData()?.careerInterests;
    if (!interests || interests.length === 0) {
      return 'No especificadas';
    }
    
    return interests
      .sort((a, b) => a.priority - b.priority)
      .map((ci, idx) => `${idx + 1}. ${ci.career}`)
      .join(', ');
  }

  /**
   * Construir observaciones con información adicional
   */
  private buildObservations(formValue: any): string {
    const observations: string[] = [];

    if (formValue.hasDisability) {
      observations.push(`Discapacidad: ${formValue.disabilityType || 'No especificado'}`);
      if (formValue.disabilityDetails) {
        observations.push(`Detalles: ${formValue.disabilityDetails}`);
      }
    }

    if (formValue.speaksIndigenousLanguage) {
      observations.push(`Lengua indígena: ${formValue.indigenousLanguage || 'No especificado'}`);
    }

    if (formValue.belongsToEthnicGroup) {
      observations.push(`Etnia: ${formValue.ethnicGroup || 'No especificado'}`);
    }

    return observations.length > 0 ? observations.join(' | ') : '';
  }

  /**
   * Cargar IEMS desde la API
   */
  loadIEMS(): void {
    this.iemsService.getAllIEMS({ active: true }).subscribe({
      next: (res: any) => {
        const data = res.data ?? [];
        this.iemsData = data.map((i: any) => ({
          name: i.name,
          state: i.address?.state || 'N/A',
        }));
        this.filteredIems = this.iemsData;
      },
      error: (error: any) => {
        console.error('Error al cargar IEMS:', error);
      },
    });
  }

  /**
   * Escuchar cambios en el input de escuela
   */
  listenSchoolInput(): void {
    this.registrationForm.get('originSchool')?.valueChanges.subscribe((value) => {
      if (this.isSelectingIems) {
        this.isSelectingIems = false;
        return;
      }

      if (!value) {
        this.filteredIems = this.iemsData;
        // No abrir el dropdown si el campo está vacío
        return;
      }

      const search = value.toLowerCase();
      this.filteredIems = this.iemsData.filter(
        (school) =>
          school.name.toLowerCase().includes(search) || school.state.toLowerCase().includes(search)
      );
      // Solo abrir el dropdown si el usuario está escribiendo activamente
      // No abrir cuando se carga un valor inicial
    });
  }

  /**
   * Seleccionar una escuela del listado
   */
  selectSchool(schoolName: string): void {
    this.isSelectingIems = true;
    this.registrationForm.get('originSchool')?.setValue(schoolName);
    this.showIemsList = false;
  }

  /**
   * Manejar focus en el campo de escuela
   */
  onFocusIems(): void {
    this.showIemsList = true;
  }

  /**
   * Manejar blur en el campo de escuela
   */
  onBlurIems(): void {
    setTimeout(() => {
      this.showIemsList = false;
    }, 150);
  }
}
