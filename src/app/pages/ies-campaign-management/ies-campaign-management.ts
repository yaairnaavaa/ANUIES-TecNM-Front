import { Component, signal, computed, OnInit, inject } from '@angular/core';
import { CommonModule, CurrencyPipe, DecimalPipe, DatePipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CampaignService } from '../../services/campaign.service';
import { AuthService } from '../../services/auth.service';
import { Campaign, IES, IEMS } from '../../models/api.models';
import { IesService } from '../../services/ies.service';
import { IemsService } from '../../services/iems.service';
import { UserService } from '../../services/user.service';

interface CampaignDisplay {
  id: string;
  name: string;
  startDate: string;
  reach: number;
  cost: number;
  impact: number;
  status: 'Active' | 'Finished' | 'Draft' | 'Cancelled' | 'Paused';
  institution: string;
  type: string;
  specificModality: string;
}

// Interfaces para datos de prueba
interface MockUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface MockCareer {
  id: string;
  name: string;
  code: string;
}

@Component({
  selector: 'app-ies-campaign-management',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, CurrencyPipe, DecimalPipe],
  templateUrl: './ies-campaign-management.html',
  styleUrl: './ies-campaign-management.css',
})
export class IesCampaignManagementComponent implements OnInit {
  private campaignService = inject(CampaignService);
  private authService = inject(AuthService);
  private iesService = inject(IesService); // Necesario para cargar carreras de la IES
  private iemsService = inject(IemsService);
  private userService = inject(UserService);
  private fb = inject(FormBuilder);

  // Data
  allCampaigns = signal<CampaignDisplay[]>([]);
  rawCampaigns = signal<Campaign[]>([]);

  // UI State
  isAdding = signal(false);
  isLoading = signal(false);
  searchQuery = signal('');
  itemsPerPage = signal(5);
  currentPage = signal(1);
  pageSizeOptions = [5, 10, 20, 50];
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  // Auth
  currentUser = this.authService.currentUser;

  // SELECCIÓN (Aquí vive la magia de las métricas)
  selectedCampaign = signal<CampaignDisplay | null>(null);

  // Modal State
  showModal = signal(false);
  campaignForm!: FormGroup;
  isEditMode = signal(false);
  editingCampaignId = signal<string | null>(null);

  // Autocomplete states para IEMS
  iemsList = signal<IEMS[]>([]);
  filteredIEMS = signal<IEMS[]>([]);
  iemsSearchQuery = signal('');
  selectedIEMS = signal<string | null>(null); // Solo una IEMS
  selectedIEMSName = signal<string>('');
  showIEMSDropdown = signal(false);

  // Autocomplete states para IES (cuando usuario no tiene IES asignada)
  iesList = signal<IES[]>([]);
  filteredIESForCampaign = signal<IES[]>([]);
  iesSearchQuery = signal('');
  selectedIESForCampaign = signal<string | null>(null);
  selectedIESName = signal<string>('');
  showIESDropdown = signal(false);

  usersList = signal<MockUser[]>([]);
  filteredUsers = signal<MockUser[]>([]);
  userSearchQuery = signal('');

  careersList = signal<MockCareer[]>([]);
  selectedCareers = signal<string[]>([]);

  // Combos dinámicos
  campaignTypes = ['Presencial', 'Digital'];
  filteredCampaignTypes = signal<string[]>(['Presencial', 'Digital']);
  campaignTypeSearch = signal('');
  showCampaignTypeDropdown = signal(false);
  
  specificModalities = signal<string[]>([]);
  filteredSpecificModalities = signal<string[]>([]);
  specificModalitySearch = signal('');
  showSpecificModalityDropdown = signal(false);
  
  reachUnits = ['Personas', 'Impresiones', 'Clics', 'Vistas', 'Asistentes'];

  // Datos MOCK para pruebas
  mockUsers: MockUser[] = [
    { id: '1', name: 'María González López', email: 'maria.gonzalez@tecnm.mx', role: 'Coordinador de Promoción' },
    { id: '2', name: 'Juan Carlos Ramírez', email: 'juan.ramirez@tecnm.mx', role: 'Director de Vinculación' },
    { id: '3', name: 'Ana Patricia Martínez', email: 'ana.martinez@tecnm.mx', role: 'Jefe de Difusión' },
    { id: '4', name: 'Roberto Sánchez Torres', email: 'roberto.sanchez@tecnm.mx', role: 'Analista de Marketing' },
    { id: '5', name: 'Laura Fernández Cruz', email: 'laura.fernandez@tecnm.mx', role: 'Coordinador Regional' }
  ];

  mockCareers: MockCareer[] = [
    { id: '1', name: 'Ingeniería Industrial', code: 'IND' },
    { id: '2', name: 'Ingeniería en Sistemas Computacionales', code: 'ISC' },
    { id: '3', name: 'Ingeniería Mecatrónica', code: 'MEC' },
    { id: '4', name: 'Ingeniería Electrónica', code: 'ELE' },
    { id: '5', name: 'Ingeniería en Gestión Empresarial', code: 'IGE' },
    { id: '6', name: 'Ingeniería Civil', code: 'CIV' },
    { id: '7', name: 'Ingeniería Química', code: 'QUI' },
    { id: '8', name: 'Arquitectura', code: 'ARQ' },
    { id: '9', name: 'Contador Público', code: 'CP' },
    { id: '10', name: 'Ingeniería en Tecnologías de la Información', code: 'ITI' }
  ];

  ngOnInit() {
    this.initializeForm();
    this.loadCampaigns();
    this.loadIEMS(); // Cargar IEMS para campañas presenciales
    this.loadIES(); // Cargar IES para selección de campaña
    this.loadMockData();
    this.loadCareersFromIES();
  }

  /**
   * Cargar IES desde backend
   */
  loadIES() {
    console.log('🏫 Cargando IES...');
    
    this.iesService.getAllIES({ active: true }).subscribe({
      next: (response) => {
        console.log('✅ Respuesta IES recibida:', response);
        
        if (response.success && response.data) {
          console.log(`📋 IES cargadas: ${response.data.length} registros`);
          this.iesList.set(response.data);
          this.filteredIESForCampaign.set(response.data);
        } else {
          console.warn('⚠️ Respuesta sin datos IES:', response);
        }
      },
      error: (error) => {
        console.error('❌ Error cargando IES:', error);
      }
    });
  }

  /**
   * Inicializar formulario reactivo
   */
  initializeForm() {
    const user = this.authService.currentUser();
    const hasIES = !!user?.ies;
    
    this.campaignForm = this.fb.group({
      // Información básica
      name: ['', [Validators.required, Validators.minLength(5)]],
      description: [''],
      
      // IES (solo si el usuario no tiene IES asignada)
      campaignIES: [hasIES ? null : '', hasIES ? [] : [Validators.required]],
      
      // Tipo y modalidad (por defecto Presencial)
      type: ['Presencial', Validators.required],
      specificModality: ['', Validators.required],
      
      // Periodo
      startDate: ['', Validators.required],
      endDate: ['', Validators.required],
      
      // Alcance
      estimatedReach: [0, [Validators.required, Validators.min(1)]],
      actualReach: [0],
      reachUnit: ['Personas', Validators.required],
      
      // Costos
      totalCost: [0, [Validators.required, Validators.min(0)]],
      costPerImpact: [0],
      
      // Objetivos
      targetedIEMSId: [''],
      targetedIEMS: [''],
      
      // Evaluación
      evaluationNotes: [''],
      
      // Responsable
      responsible: [''],
      responsibleId: [''],
      
      // Estado
      active: [true]
    });

    // Listener para cambios en el tipo de campaña
    this.campaignForm.get('type')?.valueChanges.subscribe(type => {
      if (type) {
        const modalities = this.campaignService.getModalitiesByType(type as any);
        this.specificModalities.set(modalities);
        this.filteredSpecificModalities.set(modalities);
        this.campaignForm.get('specificModality')?.setValue('');
        this.specificModalitySearch.set('');
      }
    });
    
    // Cargar modalidades por defecto (Presencial)
    const defaultModalities = this.campaignService.getModalitiesByType('Presencial');
    this.specificModalities.set(defaultModalities);
    this.filteredSpecificModalities.set(defaultModalities);
    this.campaignTypeSearch.set('Presencial');

    // Calcular costo por impacto automáticamente
    this.campaignForm.get('totalCost')?.valueChanges.subscribe(() => this.calculateCostPerImpact());
    this.campaignForm.get('actualReach')?.valueChanges.subscribe(() => this.calculateCostPerImpact());
  }

  /**
   * Cargar IEMS desde backend
   */
  loadIEMS() {
    console.log('🔄 Iniciando carga de IEMS...');
    this.isLoading.set(true);
    
    this.iemsService.getAllIEMS({ active: true }).subscribe({
      next: (response) => {
        console.log('✅ Respuesta IEMS recibida:', response);
        
        if (response.success && response.data) {
          console.log(`📋 IEMS cargadas: ${response.data.length} registros`);
          this.iemsList.set(response.data);
          this.filteredIEMS.set(response.data);
        } else {
          console.warn('⚠️ Respuesta sin datos:', response);
          this.errorMessage.set('No se encontraron IEMS activas');
        }
        
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('❌ Error cargando IEMS:', error);
        console.error('Detalles del error:', {
          status: error.status,
          statusText: error.statusText,
          message: error.error?.message || error.message,
          url: error.url
        });
        
        this.errorMessage.set(
          `Error al cargar IEMS: ${error.error?.message || error.message || 'Error desconocido'}`
        );
        this.isLoading.set(false);
      }
    });
  }

  /**
   * Cargar datos MOCK para pruebas
   */
  loadMockData() {
    this.usersList.set(this.mockUsers);
    this.filteredUsers.set(this.mockUsers);
    this.careersList.set(this.mockCareers);
  }

  /**
   * Cargar carreras de la IES del usuario autenticado o todas si no tiene IES
   */
  loadCareersFromIES() {
    console.log('🎓 Cargando carreras...');
    
    const user = this.authService.currentUser();
    console.log('👤 Usuario actual:', user);
    
    const userIES = user?.ies;
    console.log('🏫 IES del usuario:', userIES);
    
    if (userIES && typeof userIES === 'object') {
      // Si userIES es un objeto completo con carreras
      if (userIES.careers && userIES.careers.length > 0) {
        const careers = userIES.careers
          .filter(c => c.active)
          .map(c => ({
            id: c.code || c.name,
            name: c.name,
            code: c.code || ''
          }));
        console.log(`✅ Carreras cargadas desde objeto IES: ${careers.length}`);
        this.careersList.set(careers);
      } else {
        console.warn('⚠️ IES no tiene carreras definidas, cargando todas');
        this.loadAllCareers();
      }
    } else if (userIES && typeof userIES === 'string') {
      console.log('📝 IES es un ID, cargando datos completos');
      // Si userIES es solo un ID, cargar datos completos de la IES
      this.iesService.getIESById(userIES).subscribe({
        next: (response) => {
          if (response.success && response.data?.careers && response.data.careers.length > 0) {
            const careers = response.data.careers
              .filter(c => c.active)
              .map(c => ({
                id: c.code || c.name,
                name: c.name,
                code: c.code || ''
              }));
            console.log(`✅ Carreras cargadas desde API: ${careers.length}`);
            this.careersList.set(careers);
          } else {
            console.warn('⚠️ No se encontraron carreras en la IES, cargando todas');
            this.loadAllCareers();
          }
        },
        error: (error) => {
          console.error('❌ Error cargando carreras de la IES:', error);
          console.log('🔄 Cargando todas las carreras como fallback');
          this.loadAllCareers();
        }
      });
    } else {
      console.log('🌐 Usuario sin IES asignada, cargando todas las carreras');
      // Si no hay IES, consultar todas
      this.loadAllCareers();
    }
  }

  /**
   * Cargar todas las carreras de todas las IES activas
   */
  private loadAllCareers() {
    console.log('🔄 Consultando todas las IES para obtener carreras...');
    
    this.iesService.getAllIES({ active: true }).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          console.log(`📚 IES recibidas: ${response.data.length}`);
          
          // Crear un Set para evitar duplicados
          const careersMap = new Map<string, MockCareer>();
          
          response.data.forEach(ies => {
            if (ies.careers && ies.careers.length > 0) {
              ies.careers
                .filter(c => c.active)
                .forEach(career => {
                  const careerKey = career.code || career.name;
                  // Solo agregar si no existe o si queremos mantener la primera ocurrencia
                  if (!careersMap.has(careerKey)) {
                    careersMap.set(careerKey, {
                      id: careerKey,
                      name: career.name,
                      code: career.code || ''
                    });
                  }
                });
            }
          });
          
          const allCareers = Array.from(careersMap.values());
          
          if (allCareers.length > 0) {
            console.log(`✅ Total de carreras únicas cargadas: ${allCareers.length}`);
            this.careersList.set(allCareers);
          } else {
            console.warn('⚠️ No se encontraron carreras en ninguna IES, usando mock');
            this.careersList.set(this.mockCareers);
          }
        } else {
          console.warn('⚠️ No se recibieron IES, usando carreras mock');
          this.careersList.set(this.mockCareers);
        }
      },
      error: (error) => {
        console.error('❌ Error cargando todas las IES:', error);
        console.warn('🔧 Usando carreras mock como último recurso');
        this.careersList.set(this.mockCareers);
      }
    });
  }

  /**
   * Calcular costo por impacto
   */
  calculateCostPerImpact() {
    const totalCost = this.campaignForm.get('totalCost')?.value || 0;
    const actualReach = this.campaignForm.get('actualReach')?.value || 0;
    
    if (actualReach > 0 && totalCost > 0) {
      const costPerImpact = totalCost / actualReach;
      this.campaignForm.get('costPerImpact')?.setValue(costPerImpact, { emitEvent: false });
    }
  }

  /**
   * Cargar campañas desde el backend
   */
  loadCampaigns() {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.campaignService.getCampaigns().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.rawCampaigns.set(response.data);
          this.allCampaigns.set(this.mapCampaignsToDisplay(response.data));
        }
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error cargando campañas:', error);
        this.errorMessage.set('Error al cargar las campañas. Por favor intenta de nuevo.');
        this.isLoading.set(false);
      }
    });
  }

  /**
   * Mapear campañas del backend al formato del componente
   */
  private mapCampaignsToDisplay(campaigns: Campaign[]): CampaignDisplay[] {
    return campaigns.map(c => {
      const ies = typeof c.ies === 'object' ? c.ies : null;
      const institutionName = ies ? (ies.name || 'Sin IES') : 'Sin IES';
      
      // Mapear estado
      let status: 'Active' | 'Finished' | 'Draft' | 'Cancelled' | 'Paused' = 'Draft';
      if (c.status === 'En curso') status = 'Active';
      else if (c.status === 'Finalizada') status = 'Finished';
      else if (c.status === 'Cancelada') status = 'Cancelled';
      else if (c.status === 'Pausada') status = 'Paused';
      else if (c.status === 'Planificada') status = 'Draft';

      // Calcular impacto (ROI simplificado)
      const reach = c.reach?.actual || c.reach?.estimated || 0;
      const cost = c.costs?.total || 0;
      const impact = cost > 0 ? (reach / cost) * 100 : 0;

      return {
        id: c._id || '',
        name: c.name,
        startDate: typeof c.period?.startDate === 'string' 
          ? c.period.startDate 
          : c.period?.startDate?.toString() || '',
        reach: reach,
        cost: cost,
        impact: impact,
        status: status,
        institution: institutionName,
        type: c.type,
        specificModality: c.specificModality
      };
    });
  }

  // Filtrado
  filteredCampaigns = computed(() => {
    const query = this.searchQuery().toLowerCase();
    return this.allCampaigns().filter((c) => c.name.toLowerCase().includes(query));
  });

  // Paginación
  totalPages = computed(() => Math.ceil(this.filteredCampaigns().length / this.itemsPerPage()));

  pagedCampaigns = computed(() => {
    const start = (this.currentPage() - 1) * this.itemsPerPage();
    return this.filteredCampaigns().slice(start, start + this.itemsPerPage());
  });
  
  // Mapeo de estatus para visualización
  statusMap: Record<string, string> = {
    Active: 'Activa',
    Finished: 'Finalizada',
    Draft: 'Borrador',
    Cancelled: 'Cancelada',
    Paused: 'Pausada'
  };

  // Ajustamos el label de displayMetrics para que sea en español
  displayMetrics = computed(() => {
    const selected = this.selectedCampaign();
    const data = this.filteredCampaigns();

    // Cálculo de escuelas únicas (para métricas globales)
    const uniqueInstitutions = new Set(data.map((c) => c.institution)).size;

    if (selected) {
      return {
        reach: selected.reach,
        cost: selected.cost,
        impact: selected.impact,
        label: `Enfoque: ${selected.name}`,
        institutionName: selected.institution,
        isGlobal: false,
      };
    }

    return {
      reach: data.reduce((acc, c) => acc + c.reach, 0),
      cost: data.reduce((acc, c) => acc + c.cost, 0),
      impact: data.length ? data.reduce((acc, c) => acc + c.impact, 0) / data.length : 0,
      label: 'Métricas Globales (Total Filtrado)',
      institutionCount: uniqueInstitutions,
      isGlobal: true,
    };
  });

  // Eventos
  selectCampaign(c: CampaignDisplay) {
    if (this.selectedCampaign()?.id === c.id) {
      this.selectedCampaign.set(null); // Deseleccionar
    } else {
      this.selectedCampaign.set(c);
    }
  }

  onSearchChange(val: string) {
    this.searchQuery.set(val);
    this.currentPage.set(1);
  }

  goToPage(page: number) {
    this.currentPage.set(page);
  }

  /**
   * Eliminar campaña
   */
  deleteCampaign(id: string) {
    if (!confirm('¿Estás seguro de eliminar esta campaña?')) {
      return;
    }

    this.isLoading.set(true);
    this.campaignService.deleteCampaign(id).subscribe({
      next: () => {
        this.loadCampaigns();
        if (this.selectedCampaign()?.id === id) {
          this.selectedCampaign.set(null);
        }
      },
      error: (error) => {
        console.error('Error eliminando campaña:', error);
        alert('Error al eliminar la campaña');
        this.isLoading.set(false);
      }
    });
  }

  /**
   * Actualizar estado de campaña
   */
  updateCampaignStatus(id: string, newStatus: 'Planificada' | 'En Curso' | 'Finalizada' | 'Cancelada' | 'Pausada') {
    this.campaignService.updateStatus(id, newStatus).subscribe({
      next: () => {
        this.loadCampaigns();
      },
      error: (error) => {
        console.error('Error actualizando estado:', error);
        alert('Error al actualizar el estado de la campaña');
      }
    });
  }

  // ==========================================
  // MODAL METHODS
  // ==========================================

  /**
   * Abrir modal para nueva campaña
   */
  openModal() {
    this.isEditMode.set(false);
    this.editingCampaignId.set(null);
    this.campaignForm.reset({
      active: true,
      reachUnit: 'Personas',
      estimatedReach: 0,
      actualReach: 0,
      totalCost: 0,
      costPerImpact: 0,
      type: 'Presencial' // Por defecto Presencial
    });
    this.selectedCareers.set([]);
    this.selectedIEMS.set(null);
    this.selectedIEMSName.set('');
    this.iemsSearchQuery.set('');
    this.showIEMSDropdown.set(false);
    this.filteredIEMS.set(this.iemsList());
    
    // Resetear selección de IES (para usuarios sin IES asignada)
    this.selectedIESForCampaign.set(null);
    this.selectedIESName.set('');
    this.iesSearchQuery.set('');
    this.showIESDropdown.set(false);
    this.filteredIESForCampaign.set(this.iesList());
    
    // Resetear tipo y modalidad
    this.campaignTypeSearch.set('Presencial');
    this.specificModalitySearch.set('');
    this.showCampaignTypeDropdown.set(false);
    this.showSpecificModalityDropdown.set(false);
    const defaultModalities = this.campaignService.getModalitiesByType('Presencial');
    this.specificModalities.set(defaultModalities);
    this.filteredSpecificModalities.set(defaultModalities);
    
    this.showModal.set(true);
    this.isAdding.set(false);
  }

  /**
   * Cerrar modal
   */
  closeModal() {
    this.showModal.set(false);
    this.errorMessage.set(null);
    this.successMessage.set(null);
  }

  /**
   * Guardar campaña (crear o actualizar)
   */
  saveCampaign() {
    if (this.campaignForm.invalid) {
      this.errorMessage.set('Por favor completa todos los campos obligatorios');
      this.markFormGroupTouched(this.campaignForm);
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const formValue = this.campaignForm.value;
    
    // Obtener IES del usuario autenticado o la seleccionada en el formulario
    const user = this.authService.currentUser();
    const userIES = user?.ies;
    let iesId: string | undefined;
    
    if (userIES) {
      // Usuario tiene IES asignada
      iesId = typeof userIES === 'string' ? userIES : userIES._id;
    } else {
      // Usuario sin IES, usar la seleccionada en el formulario
      iesId = this.selectedIESForCampaign() || undefined;
    }
    
    if (!iesId) {
      this.errorMessage.set('Debe seleccionar una IES para la campaña');
      return;
    }
    
    const campaignData = {
      ies: iesId, // IES del usuario o seleccionada
      name: formValue.name,
      description: formValue.description,
      type: formValue.type,
      specificModality: formValue.specificModality,
      period: {
        startDate: formValue.startDate,
        endDate: formValue.endDate
      },
      reach: {
        estimated: formValue.estimatedReach,
        actual: formValue.actualReach || undefined,
        unit: formValue.reachUnit
      },
      costs: {
        total: formValue.totalCost,
        costPerImpact: formValue.costPerImpact || undefined
      },
      targetedIEMS: this.selectedIEMS() ? [this.selectedIEMS()!] : undefined,
      targetedCareers: this.selectedCareers().length > 0 ? this.selectedCareers() : undefined,
      responsible: formValue.responsibleId || undefined,
      active: formValue.active,
      // Notas de evaluación (los resultados numéricos se calcularán automáticamente)
      evaluationNotes: formValue.evaluationNotes || undefined
    };

    if (this.isEditMode() && this.editingCampaignId()) {
      // Actualizar campaña existente
      this.campaignService.updateCampaign(this.editingCampaignId()!, campaignData as any).subscribe({
        next: (response) => {
          this.isLoading.set(false);
          if (response.success) {
            this.successMessage.set('Campaña actualizada exitosamente');
            this.loadCampaigns();
            setTimeout(() => this.closeModal(), 1500);
          }
        },
        error: (error) => {
          this.isLoading.set(false);
          this.errorMessage.set(error.error?.message || 'Error al actualizar la campaña');
        }
      });
    } else {
      // Crear nueva campaña
      this.campaignService.createCampaign(campaignData as any).subscribe({
        next: (response) => {
          this.isLoading.set(false);
          if (response.success) {
            this.successMessage.set('Campaña creada exitosamente');
            this.loadCampaigns();
            setTimeout(() => this.closeModal(), 1500);
          }
        },
        error: (error) => {
          this.isLoading.set(false);
          this.errorMessage.set(error.error?.message || 'Error al crear la campaña');
        }
      });
    }
  }

  /**
   * Marcar todos los campos como tocados para mostrar errores
   */
  private markFormGroupTouched(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  // ==========================================
  // AUTOCOMPLETE METHODS
  // ==========================================


  /**
   * Filtrar tipo de campaña
   */
  filterCampaignType(query: string) {
    this.campaignTypeSearch.set(query);
    this.showCampaignTypeDropdown.set(true);
    
    if (!query.trim()) {
      this.filteredCampaignTypes.set(this.campaignTypes);
      return;
    }
    
    const filtered = this.campaignTypes.filter(type => 
      type.toLowerCase().includes(query.toLowerCase())
    );
    this.filteredCampaignTypes.set(filtered);
  }

  /**
   * Seleccionar tipo de campaña
   */
  selectCampaignType(type: string) {
    this.campaignTypeSearch.set(type);
    this.campaignForm.patchValue({ type });
    this.showCampaignTypeDropdown.set(false);
    
    // Cargar modalidades del tipo seleccionado
    const modalities = this.campaignService.getModalitiesByType(type as any);
    this.specificModalities.set(modalities);
    this.filteredSpecificModalities.set(modalities);
    this.specificModalitySearch.set('');
  }

  /**
   * Manejar blur del tipo de campaña
   */
  onCampaignTypeBlur() {
    setTimeout(() => {
      this.showCampaignTypeDropdown.set(false);
    }, 200);
  }

  /**
   * Filtrar modalidad específica
   */
  filterSpecificModality(query: string) {
    this.specificModalitySearch.set(query);
    this.showSpecificModalityDropdown.set(true);
    
    if (!query.trim()) {
      this.filteredSpecificModalities.set(this.specificModalities());
      return;
    }
    
    const filtered = this.specificModalities().filter(modality => 
      modality.toLowerCase().includes(query.toLowerCase())
    );
    this.filteredSpecificModalities.set(filtered);
  }

  /**
   * Seleccionar modalidad específica
   */
  selectSpecificModality(modality: string) {
    this.specificModalitySearch.set(modality);
    this.campaignForm.patchValue({ specificModality: modality });
    this.showSpecificModalityDropdown.set(false);
  }

  /**
   * Manejar blur de modalidad específica
   */
  onSpecificModalityBlur() {
    setTimeout(() => {
      this.showSpecificModalityDropdown.set(false);
    }, 200);
  }

  /**
   * Filtrar IEMS
   */
  filterIEMS(query: string) {
    this.iemsSearchQuery.set(query);
    this.showIEMSDropdown.set(true);
    
    if (!query.trim()) {
      // Si no hay query, mostrar todas las IEMS
      this.filteredIEMS.set(this.iemsList());
      return;
    }
    
    const filtered = this.iemsList().filter(iems => {
      // Crear el texto completo "Estado - Nombre"
      const fullText = `${iems.address.state} - ${iems.name}`;
      
      return fullText.toLowerCase().includes(query.toLowerCase()) ||
        iems.name.toLowerCase().includes(query.toLowerCase()) ||
        iems.code.toLowerCase().includes(query.toLowerCase()) ||
        iems.type?.toLowerCase().includes(query.toLowerCase()) ||
        iems.address.state?.toLowerCase().includes(query.toLowerCase()) ||
        iems.address.municipality?.toLowerCase().includes(query.toLowerCase());
    });
    this.filteredIEMS.set(filtered);
  }

  /**
   * Manejar blur del input de IEMS
   */
  onIEMSBlur() {
    // Delay para permitir que el click en el item se ejecute
    setTimeout(() => {
      this.showIEMSDropdown.set(false);
    }, 200);
  }

  /**
   * Seleccionar IEMS (solo una)
   */
  selectIEMS(iemsId: string, iemsName: string) {
    this.selectedIEMS.set(iemsId);
    this.selectedIEMSName.set(iemsName);
    this.iemsSearchQuery.set(iemsName);
    
    this.campaignForm.patchValue({
      targetedIEMSId: iemsId,
      targetedIEMS: iemsName
    });
    
    // Cerrar dropdown después de seleccionar
    this.showIEMSDropdown.set(false);
  }

  /**
   * Verificar si IEMS está seleccionada
   */
  isIEMSSelected(iemsId: string): boolean {
    return this.selectedIEMS() === iemsId;
  }

  /**
   * Limpiar selección de IEMS
   */
  clearIEMSSelection() {
    this.selectedIEMS.set(null);
    this.selectedIEMSName.set('');
    this.iemsSearchQuery.set('');
    this.campaignForm.patchValue({
      targetedIEMSId: '',
      targetedIEMS: ''
    });
    this.filteredIEMS.set(this.iemsList());
  }

  /**
   * Filtrar usuarios
   */
  filterUsers(query: string) {
    this.userSearchQuery.set(query);
    if (!query.trim()) {
      this.filteredUsers.set(this.usersList());
      return;
    }
    const filtered = this.usersList().filter(user => 
      user.name.toLowerCase().includes(query.toLowerCase()) ||
      user.email.toLowerCase().includes(query.toLowerCase())
    );
    this.filteredUsers.set(filtered);
  }

  /**
   * Seleccionar usuario responsable
   */
  selectUser(user: MockUser) {
    this.campaignForm.patchValue({
      responsible: user.name,
      responsibleId: user.id
    });
    this.userSearchQuery.set('');
    this.filteredUsers.set([]);
  }

  /**
   * Toggle carrera
   */
  toggleCareer(careerId: string) {
    const current = this.selectedCareers();
    const index = current.indexOf(careerId);
    
    if (index > -1) {
      current.splice(index, 1);
    } else {
      current.push(careerId);
    }
    
    this.selectedCareers.set([...current]);
  }

  /**
   * Verificar si carrera está seleccionada
   */
  isCareerSelected(careerId: string): boolean {
    return this.selectedCareers().includes(careerId);
  }

  /**
   * Obtener nombre de carrera por ID
   */
  getCareerName(careerId: string): string {
    return this.careersList().find(c => c.id === careerId)?.name || careerId;
  }

  /**
   * Obtener nombre de IEMS por ID
   */
  getIEMSName(iemsId: string): string {
    const iems = this.iemsList().find(i => i._id === iemsId);
    return iems ? `${iems.address.state} - ${iems.name}` : '';
  }

  // ==========================================
  // IES SELECTION METHODS (para usuarios sin IES asignada)
  // ==========================================

  /**
   * Filtrar IES para campaña
   */
  filterIESForCampaign(query: string) {
    this.iesSearchQuery.set(query);
    this.showIESDropdown.set(true);
    
    if (!query.trim()) {
      this.filteredIESForCampaign.set(this.iesList());
      return;
    }
    
    const filtered = this.iesList().filter(ies => 
      ies.name.toLowerCase().includes(query.toLowerCase()) ||
      ies.code.toLowerCase().includes(query.toLowerCase())
    );
    this.filteredIESForCampaign.set(filtered);
  }

  /**
   * Seleccionar IES para la campaña
   */
  selectIESForCampaign(ies: IES) {
    this.selectedIESForCampaign.set(ies._id!);
    this.selectedIESName.set(ies.name);
    this.iesSearchQuery.set(ies.name);
    this.campaignForm.patchValue({
      campaignIES: ies._id
    });
    this.showIESDropdown.set(false);
  }

  /**
   * Limpiar selección de IES
   */
  clearIESSelection() {
    this.selectedIESForCampaign.set(null);
    this.selectedIESName.set('');
    this.iesSearchQuery.set('');
    this.campaignForm.patchValue({
      campaignIES: ''
    });
    this.filteredIESForCampaign.set(this.iesList());
  }

  /**
   * Manejar blur del input de IES
   */
  onIESBlur() {
    setTimeout(() => {
      this.showIESDropdown.set(false);
    }, 200);
  }

  /**
   * Verificar si el usuario tiene IES asignada
   */
  userHasIES(): boolean {
    const user = this.authService.currentUser();
    return !!user?.ies;
  }
}
