import { Component, signal, computed, OnInit, inject } from '@angular/core';
import { CommonModule, CurrencyPipe, DecimalPipe, DatePipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CampaignService } from '../../services/campaign.service';
import { AuthService } from '../../services/auth.service';
import { Campaign, IES, IEMS } from '../../models/api.models';
import { IesService } from '../../services/ies.service';
import { IemsService } from '../../services/iems.service';
import { UserService } from '../../services/user.service';
import { CycleService } from '../../services/cycle.service';
import { ExcelReportService } from '../../services/excel-report.service';
import { NotificationService } from '../../services/notification.service';
import { environment } from '../../../environments/environment';

interface CampaignDisplay {
  id: string;
  name: string;
  startDate: string;
  reach: number;
  cost: number;
  impact: number;
  status: 'Planificada' | 'En curso' | 'Finalizada' | 'Cancelada';
  institution: string;
  type: string;
  specificModality: string;
  cycleName: string;
  totalRegistrados?: number;
  totalCompletos?: number;
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

// Interface para IEMS en campañas
interface CampaignIEMS {
  iemsId: string;
  iemsName: string;
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
  private cycleService = inject(CycleService);
  private excelReport = inject(ExcelReportService);
  private notificationService = inject(NotificationService);
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
  
  // Verificar si el usuario es Admin Nacional
  isAdminNacional = computed(() => this.authService.hasRole('Admin Nacional'));

  // SELECCIÓN (Aquí vive la magia de las métricas)
  selectedCampaign = signal<CampaignDisplay | null>(null);

  // Modal de detalles
  showDetailsModal = signal<boolean>(false);
  viewingCampaign = signal<CampaignDisplay | null>(null);

  // Modal de QR
  showQRModal = signal<boolean>(false);
  selectedCampaignForQR = signal<CampaignDisplay | null>(null);
  linkCopied = signal<boolean>(false);
  customQRImage = signal<string>(''); // Imagen del QR personalizada con texto

  // Modal State
  showModal = signal(false);
  campaignForm!: FormGroup;
  isEditMode = signal(false);
  editingCampaignId = signal<string | null>(null);

  // Autocomplete states para IEMS - Selección múltiple
  iemsList = signal<IEMS[]>([]);
  filteredIEMS = signal<IEMS[]>([]);
  iemsSearchQuery = signal('');
  selectedIEMSList = signal<Array<{id: string, name: string}>>([]); // Lista de IEMS seleccionados
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
  /** Mensaje cuando no hay carreras (ej. IES sin carreras o usuario sin IES) */
  careersSectionMessage = signal<string | null>(null);

  // Ciclo Activo
  activeCycle = signal<any>(null);

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
  filteredReachUnits = signal<string[]>(['Personas', 'Impresiones', 'Clics', 'Vistas', 'Asistentes']);
  reachUnitSearch = signal('');
  showReachUnitDropdown = signal(false);

  // Opciones de estado de campaña
  campaignStatusOptions = ['Planificada', 'En curso', 'En pausa', 'Finalizada', 'Cancelada'];
  filteredCampaignStatuses = signal<string[]>(['Planificada', 'En curso', 'En pausa', 'Finalizada', 'Cancelada']);
  campaignStatusSearch = signal('');
  showCampaignStatusDropdown = signal(false);

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
    this.loadActiveCycle(); // Cargar ciclo activo
    this.loadMockData();
    this.loadCareersFromIES();
  }

  /**
   * Cargar IES desde backend
   */
  loadIES() {
    this.iesService.getAllIES({ active: true }).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.iesList.set(response.data);
          this.filteredIESForCampaign.set(response.data);
        }
      },
      error: (error) => {
        console.error('❌ Error cargando IES:', error);
      }
    });
  }

  /**
   * Cargar ciclo activo actual
   */
  loadActiveCycle() {
    this.cycleService.getCurrentActiveCycle().subscribe({
      next: (response) => {
        if (response.data && response.data.currentActive) {
          this.activeCycle.set(response.data.currentActive);
        }
      },
      error: (error) => {
        console.error('❌ Error cargando ciclo activo:', error);
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

      // Responsable (se bloqueará después de establecer el valor)
      responsible: [''],
      responsibleId: [''],

      // Estado de la campaña (por defecto "Planificada")
      status: ['Planificada', Validators.required],

      // Estado activo
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

    // Inicializar estado de campaña con "Planificada"
    this.campaignStatusSearch.set('Planificada');
    this.filteredCampaignStatuses.set(this.campaignStatusOptions);

    // Calcular costo por impacto automáticamente
    this.campaignForm.get('totalCost')?.valueChanges.subscribe(() => this.calculateCostPerImpact());
    this.campaignForm.get('actualReach')?.valueChanges.subscribe(() => this.calculateCostPerImpact());

    // Sincronizar el input de estado con el valor del formulario
    this.campaignForm.get('status')?.valueChanges.subscribe(status => {
      if (status) {
        this.campaignStatusSearch.set(status);
      }
    });
  }

  /**
   * Cargar IEMS desde backend
   */
  loadIEMS() {
    this.isLoading.set(true);

    this.iemsService.getAllIEMS({ active: true }).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.iemsList.set(response.data);
          this.filteredIEMS.set(response.data);
        } else {
          this.errorMessage.set('No se encontraron IEMS activas');
        }

        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('❌ Error cargando IEMS:', error);

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
    // careersList se llena solo con loadCareersFromIES (carreras de la IES del usuario)
  }

  /**
   * Cargar solo las carreras de la IES a la que pertenece el usuario (endpoint /ies/:id/carreras).
   * Si el usuario no tiene IES o la IES no tiene carreras, se muestra el mensaje correspondiente.
   * Si es Admin Nacional, carga todas las carreras de todas las IES.
   */
  loadCareersFromIES() {
    const user = this.authService.currentUser();
    const userIES = user?.ies;
    const iesId =
      !userIES
        ? null
        : typeof userIES === 'string'
          ? userIES
          : (userIES as any)?._id ?? (userIES as any)?.id ?? null;

    // Si es Admin Nacional, cargar todas las carreras
    if (this.isAdminNacional()) {
      this.loadAllCareers();
      // No establecer mensaje para mostrar el grid de carreras
      this.careersSectionMessage.set(null);
      return;
    }

    if (!iesId) {
      this.careersList.set([]);
      this.careersSectionMessage.set('No tiene IES asignada. Solo se muestran carreras de su institución.');
      return;
    }

    this.careersSectionMessage.set(null);
    this.iesService.getCareersIES(iesId).subscribe({
      next: (response) => {
        if (response.success && response.data && response.data.length > 0) {
          const careers = response.data
            .filter((c: { active?: boolean }) => c.active !== false)
            .map((c: { _id?: string; id?: string; name: string; code?: string }) => ({
              id: c._id ?? c.id ?? '',
              name: c.name,
              code: c.code ?? ''
            }));
          this.careersList.set(careers);
          this.careersSectionMessage.set(null);
        } else {
          this.careersList.set([]);
          this.careersSectionMessage.set('La IES no tiene carreras registradas.');
        }
      },
      error: (error) => {
        console.error('❌ Error cargando carreras de la IES:', error);
        this.careersList.set([]);
        this.careersSectionMessage.set('La IES no tiene carreras registradas.');
      }
    });
  }

  /**
   * Cargar todas las carreras de todas las IES activas
   */
  private loadAllCareers() {
    this.iesService.getAllIES({ active: true }).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          // Crear un Map para evitar duplicados basado en el _id real
          const careersMap = new Map<string, MockCareer>();

          response.data.forEach(ies => {
            if (ies.careers && ies.careers.length > 0) {
              ies.careers
                .filter(c => c.active)
                .forEach(career => {
                  // Usar el ID real del documento (_id o id)
                  // TypeScript: career puede tener _id del backend aunque no esté en la interfaz
                  const careerId = (career as any)._id || career.id || '';
                  
                  // Solo agregar si no existe (evitar duplicados de carreras con mismo _id)
                  if (careerId && !careersMap.has(careerId)) {
                    careersMap.set(careerId, {
                      id: careerId,
                      name: career.name,
                      code: career.code || ''
                    });
                  }
                });
            }
          });

          const allCareers = Array.from(careersMap.values());

          if (allCareers.length > 0) {
            this.careersList.set(allCareers);
          } else {
            this.careersList.set(this.mockCareers);
          }
        } else {
          this.careersList.set(this.mockCareers);
        }
      },
      error: (error) => {
        console.error('❌ Error cargando todas las IES:', error);
        this.careersList.set(this.mockCareers);
      }
    });
  }

  /**
   * Cargar carreras de una IES específica (para Admin Nacional)
   */
  private loadCareersForSpecificIES(iesId: string, onComplete?: () => void) {
    this.careersSectionMessage.set(null);
    this.iesService.getCareersIES(iesId).subscribe({
      next: (response) => {
        if (response.success && response.data && response.data.length > 0) {
          const careers = response.data
            .filter((c: { active?: boolean }) => c.active !== false)
            .map((c: { _id?: string; id?: string; name: string; code?: string }) => ({
              id: c._id ?? c.id ?? '',
              name: c.name,
              code: c.code ?? ''
            }));
          this.careersList.set(careers);
          // NO establecer mensaje aquí - dejar null para mostrar el grid
          this.careersSectionMessage.set(null);
          
          // Ejecutar callback si existe (para seleccionar carreras después de cargarlas)
          if (onComplete) {
            onComplete();
          }
        } else {
          this.careersList.set([]);
          this.careersSectionMessage.set('La IES seleccionada no tiene carreras registradas.');
          if (onComplete) {
            onComplete();
          }
        }
      },
      error: (error) => {
        console.error('❌ Error cargando carreras de la IES:', error);
        this.careersList.set([]);
        this.careersSectionMessage.set('Error al cargar carreras de la IES seleccionada.');
        if (onComplete) {
          onComplete();
        }
      }
    });
  }

  /**
   * Exportar reporte Excel de campañas (tabla con formato)
   */
  exportCampaignsExcel() {
    const data = this.filteredCampaigns();
    if (data.length === 0) {
      this.notificationService.warning('No hay campañas para exportar.');
      return;
    }
    const registrados = (c: CampaignDisplay) => c.totalRegistrados ?? 0;
    const completos = (c: CampaignDisplay) => c.totalCompletos ?? 0;
    const rows = data.map((c) => {
      const interesados = Math.max(0, registrados(c) - completos(c));
      const prospectos = completos(c);
      const totalRegistros = interesados + prospectos;
      return {
        name: c.name,
        institution: c.institution,
        status: c.status,
        cycleName: c.cycleName,
        startDate: c.startDate,
        alcanceEstimado: c.reach,
        inversionTotal: c.cost,
        alcanceReal: totalRegistros,
        type: c.type,
        specificModality: c.specificModality,
        interesados,
        prospectos,
        totalRegistros
      };
    });
    this.excelReport
      .downloadFormattedExcel({
        sheetName: 'Campañas',
        filename: `reporte-campanas_${new Date().toISOString().slice(0, 10)}.xlsx`,
        title: 'Reporte de Campañas e Impacto',
        columns: [
          { key: 'name', label: 'Campaña', width: 32 },
          { key: 'institution', label: 'Institución', width: 28 },
          { key: 'status', label: 'Estado', width: 14 },
          { key: 'cycleName', label: 'Ciclo', width: 18 },
          { key: 'startDate', label: 'Fecha inicio', width: 14 },
          { key: 'alcanceEstimado', label: 'Alcance Estimado', width: 18 },
          { key: 'inversionTotal', label: 'Inversión Total', width: 18 },
          { key: 'alcanceReal', label: 'Alcance Real', width: 14 },
          { key: 'type', label: 'Tipo', width: 14 },
          { key: 'specificModality', label: 'Modalidad', width: 18 },
          { key: 'interesados', label: 'Interesados', width: 18 },
          { key: 'prospectos', label: 'Prospectos', width: 18 },
          { key: 'totalRegistros', label: 'Total registros', width: 18 }
        ],
        rows
      })
      .catch((err) => {
        console.error('Error al exportar Excel:', err);
        this.notificationService.error('No se pudo generar el reporte. Intenta de nuevo.');
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
      next: (response: any) => {
        console.log('📋 Respuesta de campañas:', response);

        // Manejar diferentes estructuras de respuesta del API
        const isSuccess = response.success === true || response.status === 'success';
        const campaignsData = response.data || [];

        if (isSuccess && campaignsData.length >= 0) {
          this.rawCampaigns.set(campaignsData);
          this.allCampaigns.set(this.mapCampaignsToDisplay(campaignsData));
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
  private mapCampaignsToDisplay(campaigns: any[]): CampaignDisplay[] {
    return campaigns.map(c => {
      // Manejar el objeto ies que puede tener diferentes estructuras
      const ies = typeof c.ies === 'object' ? c.ies : null;
      const institutionName = ies ? (ies.iesName || ies.name || 'Sin IES') : 'Sin IES';

      // Calcular impacto (ROI simplificado)
      const reach = c.reach?.actual || c.reach?.estimated || 0;
      const cost = c.costs?.total || 0;
      const impact = cost > 0 ? (reach / cost) * 100 : 0;

      // Manejar el objeto cycle
      const cycle = typeof c.cycle === 'object' ? c.cycle : null;
      const cycleName = cycle ? (cycle.cycleName || 'Sin ciclo') : 'Sin ciclo';

      return {
        id: c._id || '',
        name: c.name,
        startDate: typeof c.period?.startDate === 'string'
          ? c.period.startDate
          : c.period?.startDate?.toString() || '',
        reach: reach,
        cost: cost,
        impact: impact,
        status: c.status,
        institution: institutionName,
        type: c.type,
        specificModality: c.specificModality,
        cycleName: cycleName,
        totalRegistrados: c.totalRegistrados ?? 0,
        totalCompletos: c.totalCompletos ?? 0
      };
    });
  }

  // Filtrado
  filteredCampaigns = computed(() => {
    const query = this.searchQuery().toLowerCase();
    return this.allCampaigns().filter((c) => c.name.toLowerCase().includes(query));
  });

  // Paginación
  totalPages = computed(() => Math.ceil(this.filteredCampaigns().length / this.itemsPerPage()) || 1);

  showingRange = computed(() => {
    const start = (this.currentPage() - 1) * this.itemsPerPage() + 1;
    const end = Math.min(this.currentPage() * this.itemsPerPage(), this.filteredCampaigns().length);
    return this.filteredCampaigns().length > 0 ? `${start} - ${end}` : '0';
  });

  pagedCampaigns = computed(() => {
    const start = (this.currentPage() - 1) * this.itemsPerPage();
    return this.filteredCampaigns().slice(start, start + this.itemsPerPage());
  });

  // Métricas dinámicas basadas en las campañas filtradas de la tabla o campaña seleccionada
  displayMetrics = computed(() => {
    const selected = this.selectedCampaign();
    const data = this.filteredCampaigns();

    // Si hay una campaña seleccionada, mostrar sus métricas
    if (selected) {
      return {
        reach: selected.reach,
        cost: selected.cost,
        impact: selected.impact,
        label: `Campaña: ${selected.name}`,
        institutionName: selected.institution,
        institutionCount: 1,
        isGlobal: false,
      };
    }

    // Si no hay selección, mostrar métricas agregadas de todas las campañas filtradas
    const uniqueInstitutions = new Set(data.map((c) => c.institution)).size;
    const totalReach = data.reduce((acc, c) => acc + c.reach, 0);
    const totalCost = data.reduce((acc, c) => acc + c.cost, 0);
    const totalImpact = totalCost > 0 ? (totalReach / totalCost) * 100 : 0;

    return {
      reach: totalReach,
      cost: totalCost,
      impact: totalImpact,
      label: data.length > 0 ? `Métricas de ${data.length} Campaña${data.length > 1 ? 's' : ''}` : 'Sin Campañas',
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

  /**
   * Cambiar items por página
   */
  onItemsPerPageChange(value: number): void {
    this.itemsPerPage.set(value);
    this.currentPage.set(1);
  }

  /**
   * Obtener campaña completa desde rawCampaigns
   */
  getFullCampaign(campaignId: string): Campaign | null {
    return this.rawCampaigns().find(c => c._id === campaignId) || null;
  }

  /**
   * Abrir modal de detalles
   */
  openDetailsModal(campaign: CampaignDisplay): void {
    this.viewingCampaign.set(campaign);
    this.showDetailsModal.set(true);
  }

  /**
   * Cerrar modal de detalles
   */
  closeDetailsModal(): void {
    this.showDetailsModal.set(false);
    this.viewingCampaign.set(null);
  }

  goToPage(page: number) {
    this.currentPage.set(page);
  }

  /**
   * Eliminar campaña
   */
  async deleteCampaign(id: string) {
    const confirmed = await this.notificationService.confirm('¿Estás seguro de eliminar esta campaña?', 'Eliminar Campaña', 'Sí, eliminar');
    if (!confirmed) {
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
        this.notificationService.error('Error al eliminar la campaña');
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
        this.notificationService.error('Error al actualizar el estado de la campaña');
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
    const currentUser = this.authService.currentUser();

    this.isEditMode.set(false);
    this.editingCampaignId.set(null);

    // Construir nombre completo del usuario
    const fullName = currentUser?.firstName
      ? `${currentUser.firstName} ${currentUser.lastName || ''}`.trim()
      : '';

    this.campaignForm.reset({
      active: true,
      reachUnit: 'Personas',
      estimatedReach: 0,
      actualReach: 0,
      totalCost: 0,
      costPerImpact: 0,
      type: 'Presencial', // Por defecto Presencial
      responsibleId: currentUser?.id || '',
      status: 'Planificada' // Estado por defecto
    });

    // Establecer el nombre del usuario responsable y luego deshabilitar el campo
    this.campaignForm.patchValue({
      responsible: fullName
    });

    // Deshabilitar el campo después de establecer el valor
    this.campaignForm.get('responsible')?.disable();

    // Inicializar búsquedas de combos
    this.reachUnitSearch.set('Personas');
    this.filteredReachUnits.set(this.reachUnits);

    this.selectedCareers.set([]);
    this.selectedIEMSList.set([]);
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

    // Resetear estado de campaña
    this.campaignStatusSearch.set('Planificada');
    this.filteredCampaignStatuses.set(this.campaignStatusOptions);
    this.showCampaignStatusDropdown.set(false);

    this.showModal.set(true);
    this.isAdding.set(false);
  }

  /**
   * Abrir modal para editar campaña existente
   */
  editCampaign(campaignId: string) {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    this.campaignService.getCampaignById(campaignId).subscribe({
      next: (response: any) => {
        const campaign = response.data || response;

        if (!campaign) {
          this.errorMessage.set('No se pudo cargar la información de la campaña');
          this.isLoading.set(false);
          return;
        }

        this.isEditMode.set(true);
        this.editingCampaignId.set(campaignId);

        const currentUser = this.authService.currentUser();
        const fullName = currentUser?.firstName
          ? `${currentUser.firstName} ${currentUser.lastName || ''}`.trim()
          : '';

        // Formatear fechas para el input date (YYYY-MM-DD)
        const formatDateForInput = (date: string | Date): string => {
          if (!date) return '';
          const d = new Date(date);
          const year = d.getFullYear();
          const month = String(d.getMonth() + 1).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');
          return `${year}-${month}-${day}`;
        };

        // Cargar datos en el formulario
        this.campaignForm.patchValue({
          name: campaign.name || '',
          description: campaign.description || '',
          type: campaign.type || 'Presencial',
          specificModality: campaign.specificModality || '',
          startDate: formatDateForInput(campaign.period?.startDate),
          endDate: formatDateForInput(campaign.period?.endDate),
          estimatedReach: campaign.reach?.estimated || 0,
          actualReach: campaign.reach?.actual || 0,
          reachUnit: campaign.reach?.unit || 'Personas',
          totalCost: campaign.costs?.total || 0,
          status: campaign.status || 'Planificada',
          responsible: fullName,
          responsibleId: currentUser?.id || ''
        });

        // Habilitar campo responsable si estaba deshabilitado
        this.campaignForm.get('responsible')?.disable();

        // Configurar tipo de campaña y modalidad
        if (campaign.type) {
          this.campaignTypeSearch.set(campaign.type);
          const modalities = this.campaignService.getModalitiesByType(campaign.type as any);
          this.specificModalities.set(modalities);
          this.filteredSpecificModalities.set(modalities);
          this.specificModalitySearch.set(campaign.specificModality || '');
        }

        // Configurar estado de campaña
        this.campaignStatusSearch.set(campaign.status || 'Planificada');
        this.filteredCampaignStatuses.set(this.campaignStatusOptions);

        // Configurar unidad de alcance
        const reachUnit = campaign.reach?.unit || 'Personas';
        this.reachUnitSearch.set(reachUnit);
        this.filteredReachUnits.set(this.reachUnits);

        // Configurar IEMS si existen (múltiples)
        if (campaign.targetedIEMS && campaign.targetedIEMS.length > 0) {
          const iemsList = (campaign.targetedIEMS as CampaignIEMS[]).map((iems: CampaignIEMS) => ({
            id: iems.iemsId,
            name: iems.iemsName || ''
          }));
          this.selectedIEMSList.set(iemsList);
        } else {
          this.selectedIEMSList.set([]);
        }
        this.iemsSearchQuery.set('');
        this.showIEMSDropdown.set(false);

        // Configurar IES si el usuario no tiene una asignada
        if (!this.userHasIES()) {
          const iesId = campaign.ies?.iesId || campaign.ies?._id;
          if (iesId) {
            this.selectedIESForCampaign.set(iesId);
            this.selectedIESName.set(campaign.ies?.iesName || campaign.ies?.name || '');
            this.iesSearchQuery.set(campaign.ies?.iesName || campaign.ies?.name || '');
            
            // Actualizar el valor del formulario (necesario para que el formulario sea válido)
            this.campaignForm.patchValue({
              campaignIES: iesId
            });
            
            // Si es Admin Nacional, cargar carreras de esta IES y después seleccionar las promocionadas
            if (this.isAdminNacional()) {
              const promotedCareers = campaign.promotedCareers || [];
              const activeStatus = campaign.active !== undefined ? campaign.active : true;
              
              this.loadCareersForSpecificIES(iesId, () => {
                // Este callback se ejecuta DESPUÉS de que las carreras se hayan cargado
                if (promotedCareers.length > 0) {
                  this.selectedCareers.set([...promotedCareers]);
                } else {
                  this.selectedCareers.set([]);
                }
                
                // Estado activo
                this.campaignForm.patchValue({
                  active: activeStatus
                });
                
                // Mostrar modal DESPUÉS de cargar las carreras
                this.isLoading.set(false);
                this.showModal.set(true);
              });
              // Salir temprano ya que el modal se mostrará en el callback
              return;
            }
          }
        }

        // Configurar carreras promocionadas (solo si NO es Admin Nacional)
        if (campaign.promotedCareers && campaign.promotedCareers.length > 0) {
          this.selectedCareers.set([...campaign.promotedCareers]);
        } else {
          this.selectedCareers.set([]);
        }

        // Estado activo
        this.campaignForm.patchValue({
          active: campaign.active !== undefined ? campaign.active : true
        });

        this.isLoading.set(false);
        this.showModal.set(true);
      },
      error: (error) => {
        console.error('Error cargando campaña:', error);
        this.errorMessage.set('Error al cargar la información de la campaña');
        this.isLoading.set(false);
      }
    });
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
      // Usuario tiene IES asignada (puede ser string, objeto con _id o con id)
      iesId =
        typeof userIES === 'string'
          ? userIES
          : (userIES as any)?._id ?? (userIES as any)?.id ?? undefined;
    } else {
      // Usuario sin IES, usar la seleccionada en el formulario
      iesId = this.selectedIESForCampaign() || undefined;
    }

    if (!iesId) {
      this.errorMessage.set('Debe seleccionar una IES para la campaña');
      this.isLoading.set(false);
      return;
    }

    // Validar que haya un ciclo activo
    if (!this.activeCycle()) {
      this.errorMessage.set('No hay un ciclo activo disponible');
      this.isLoading.set(false);
      return;
    }

    // Construir el objeto de campaña con la estructura correcta del API
    const campaignData = {
      ies: {
        iesId: iesId
      },
      name: formValue.name,
      description: formValue.description || '',
      type: formValue.type,
      specificModality: formValue.specificModality,
      status: formValue.status || 'Planificada', // Estado de la campaña
      period: {
        startDate: new Date(formValue.startDate).toISOString(),
        endDate: new Date(formValue.endDate).toISOString()
      },
      reach: {
        estimated: Number(formValue.estimatedReach) || 0,
        actual: formValue.actualReach ? Number(formValue.actualReach) : 0,
        unit: formValue.reachUnit
      },
      costs: {
        total: Number(formValue.totalCost) || 0
      },
      // targetedIEMS solo si es tipo Presencial y hay IEMS seleccionadas
      ...(formValue.type === 'Presencial' && this.selectedIEMSList().length > 0 ? {
        targetedIEMS: this.selectedIEMSList().map(iems => ({
          iemsId: iems.id,
          iemsName: iems.name
        }))
      } : {}),
      // Carreras promocionadas
      promotedCareers: this.selectedCareers().length > 0 ? this.selectedCareers() : [],
      // Evidence (valores por defecto vacíos)
      evidence: {
        photos: [],
        videos: [],
        documents: [],
        digitalLinks: []
      },
      // Responsible
      responsible: {
        id: formValue.responsibleId || user?.id || '',
        name: user?.firstName
          ? `${user.firstName} ${user.lastName || ''}`.trim()
          : ''
      },
      // Ciclo activo
      cycle: {
        cycleId: this.activeCycle()._id,
        cycleName: this.activeCycle().name
      }
    };

    console.log('📤 Datos de la campaña a enviar:', JSON.stringify(campaignData, null, 2));

    if (this.isEditMode() && this.editingCampaignId()) {
      // Actualizar campaña existente
      this.campaignService.updateCampaign(this.editingCampaignId()!, campaignData as any).subscribe({
        next: (response: any) => {
          this.isLoading.set(false);
          console.log('✅ Respuesta del servidor (actualización):', response);

          // Verificar si la respuesta es exitosa (manejar diferentes estructuras de API)
          const isSuccess = response.success === true ||
            response.status === 'success' ||
            response.data !== undefined;

          if (isSuccess) {
            // Cerrar modal inmediatamente
            this.showModal.set(false);
            // Mostrar mensaje de éxito
            this.notificationService.success('✅ Campaña actualizada exitosamente');
            // Recargar lista de campañas
            this.loadCampaigns();
          } else {
            this.errorMessage.set('No se pudo actualizar la campaña');
          }
        },
        error: (error) => {
          this.isLoading.set(false);
          console.error('❌ Error al actualizar campaña:', error);
          this.errorMessage.set(error.error?.message || 'Error al actualizar la campaña');
        }
      });
    } else {
      // Crear nueva campaña
      this.campaignService.createCampaign(campaignData as any).subscribe({
        next: (response: any) => {
          this.isLoading.set(false);
          console.log('✅ Respuesta del servidor (creación):', response);

          // Verificar si la respuesta es exitosa (manejar diferentes estructuras de API)
          const isSuccess = response.success === true ||
            response.status === 'success' ||
            response.data !== undefined;

          if (isSuccess) {
            // Cerrar modal inmediatamente
            this.showModal.set(false);
            // Mostrar mensaje de éxito
            this.notificationService.success('✅ Campaña creada exitosamente');
            // Recargar lista de campañas
            this.loadCampaigns();
          } else {
            this.errorMessage.set('No se pudo crear la campaña');
          }
        },
        error: (error) => {
          this.isLoading.set(false);
          console.error('❌ Error al crear campaña:', error);
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
   * Filtrar estado de campaña
   */
  filterCampaignStatus(query: string) {
    this.campaignStatusSearch.set(query);
    this.showCampaignStatusDropdown.set(true);

    if (!query.trim()) {
      this.filteredCampaignStatuses.set(this.campaignStatusOptions);
      return;
    }

    const filtered = this.campaignStatusOptions.filter(status =>
      status.toLowerCase().includes(query.toLowerCase())
    );
    this.filteredCampaignStatuses.set(filtered);
  }

  /**
   * Seleccionar estado de campaña
   */
  selectCampaignStatus(status: string) {
    this.campaignStatusSearch.set(status);
    this.campaignForm.patchValue({ status });
    this.showCampaignStatusDropdown.set(false);
  }

  /**
   * Manejar blur del estado de campaña
   */
  onCampaignStatusBlur() {
    setTimeout(() => {
      this.showCampaignStatusDropdown.set(false);
    }, 200);
  }

  /**
   * Filtrar unidad de alcance
   */
  filterReachUnit(query: string) {
    this.reachUnitSearch.set(query);
    this.showReachUnitDropdown.set(true);

    if (!query.trim()) {
      this.filteredReachUnits.set(this.reachUnits);
      return;
    }

    const filtered = this.reachUnits.filter(unit =>
      unit.toLowerCase().includes(query.toLowerCase())
    );
    this.filteredReachUnits.set(filtered);
  }

  /**
   * Seleccionar unidad de alcance
   */
  selectReachUnit(unit: string) {
    this.reachUnitSearch.set(unit);
    this.campaignForm.patchValue({ reachUnit: unit });
    this.showReachUnitDropdown.set(false);
  }

  /**
   * Manejar blur de unidad de alcance
   */
  onReachUnitBlur() {
    setTimeout(() => {
      this.showReachUnitDropdown.set(false);
    }, 200);
  }

  /**
   * Obtener valor de display para unidad de alcance
   */
  getReachUnitDisplayValue(): string {
    const formValue = this.campaignForm.get('reachUnit')?.value;
    return formValue || this.reachUnitSearch() || 'Seleccionar unidad...';
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
   * Seleccionar/Deseleccionar IEMS (múltiple)
   */
  toggleIEMS(iemsId: string, iemsName: string) {
    const currentList = this.selectedIEMSList();
    const index = currentList.findIndex(iems => iems.id === iemsId);
    
    if (index > -1) {
      // Ya está seleccionado, removerlo
      const newList = currentList.filter(iems => iems.id !== iemsId);
      this.selectedIEMSList.set(newList);
    } else {
      // No está seleccionado, agregarlo
      this.selectedIEMSList.set([...currentList, { id: iemsId, name: iemsName }]);
    }
    
    // Limpiar campo de búsqueda
    this.iemsSearchQuery.set('');
  }

  /**
   * Verificar si IEMS está seleccionada
   */
  isIEMSSelected(iemsId: string): boolean {
    return this.selectedIEMSList().some(iems => iems.id === iemsId);
  }

  /**
   * Remover un IEMS específico de la selección
   */
  removeIEMS(iemsId: string) {
    const newList = this.selectedIEMSList().filter(iems => iems.id !== iemsId);
    this.selectedIEMSList.set(newList);
  }

  /**
   * Limpiar toda la selección de IEMS
   */
  clearAllIEMS() {
    this.selectedIEMSList.set([]);
    this.iemsSearchQuery.set('');
  }

  /**
   * Limpiar selección de IEMS
   */
  clearIEMSSelection() {
    this.clearAllIEMS();
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
  /**
   * Obtener array de carreras promocionadas de una campaña (backend puede enviar promotedCareers o targetedCareers).
   */
  getPromotedCareers(campaign: Campaign | null): string[] {
    if (!campaign) return [];
    return campaign.promotedCareers ?? campaign.targetedCareers ?? [];
  }

  /**
   * Obtener nombre de carrera por ID
   * Busca en la lista cargada, si no encuentra, devuelve el código/nombre abreviado
   */
  getCareerName(careerId: string): string {
    // Buscar en la lista cargada de carreras
    const career = this.careersList().find(c => c.id === careerId);
    if (career) {
      return career.name;
    }
    
    // Si no se encuentra, podría ser porque las carreras aún no se han cargado
    // o porque el ID es antiguo. Devolver algo más legible que el ID completo
    if (careerId.length > 20) {
      // Es un ObjectId de MongoDB, mostrar abreviado
      return `Carrera ${careerId.substring(careerId.length - 6)}`;
    }
    
    // Si es corto, probablemente sea un código de carrera
    return careerId;
  }

  /**
   * Obtener nombre de IEMS por ID
   */
  getIEMSName(iemsId: string): string {
    const iems = this.iemsList().find(i => i._id === iemsId);
    return iems ? `${iems.address.state} - ${iems.name}` : '';
  }

  /**
   * Obtener nombre del responsable
   */
  getResponsibleName(campaign: Campaign): string {
    if (!campaign.responsible) return 'No asignado';

    if (typeof campaign.responsible === 'string') {
      // Si es solo ID, intentamos buscarlo en la lista de usuarios cargada o devolvemos el ID/Placeholder
      const user = this.usersList().find(u => u.id === campaign.responsible);
      return user ? user.name : 'Usuario no encontrado';
    }

    // Check if it matches the structure { id, name } provided by user
    if ('name' in campaign.responsible && (campaign.responsible as any).name) {
      return (campaign.responsible as any).name;
    }

    // Si es objeto User estándar con firstName/lastName
    const user = campaign.responsible as any; // Cast to any to access properties safely or use User interface
    const firstName = user.firstName || '';
    const lastName = user.lastName || '';
    return `${firstName} ${lastName}`.trim() || 'Sin nombre';
  }

  /**
   * Obtener nombre del IEMS objetivo desde el array targetedIEMS
   */
  getTargetedIEMSName(targetedIEMS: any): string {
    if (!targetedIEMS || !Array.isArray(targetedIEMS) || targetedIEMS.length === 0) {
      return 'Sin nombre';
    }

    const firstItem = targetedIEMS[0];

    // Si es un objeto con iemsName
    if (typeof firstItem === 'object' && firstItem !== null && 'iemsName' in firstItem) {
      return firstItem.iemsName || 'Sin nombre';
    }

    // Si es un string (ID), buscar el nombre
    if (typeof firstItem === 'string') {
      return this.getIEMSName(firstItem);
    }

    // Si es un objeto con iemsId
    if (typeof firstItem === 'object' && firstItem !== null && 'iemsId' in firstItem) {
      return this.getIEMSName(firstItem.iemsId);
    }

    return 'Sin nombre';
  }

  /**
   * Obtener nombre de IEMS para mostrar (maneja diferentes formatos)
   */
  getIEMSDisplayName(iems: any): string {
    // Si es un objeto con iemsName
    if (typeof iems === 'object' && iems !== null && 'iemsName' in iems) {
      return iems.iemsName || 'Sin nombre';
    }

    // Si es un string (ID), buscar el nombre
    if (typeof iems === 'string') {
      return this.getIEMSName(iems);
    }

    // Si tiene iemsId
    if (typeof iems === 'object' && iems !== null && 'iemsId' in iems) {
      return this.getIEMSName(iems.iemsId);
    }

    return 'Sin nombre';
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
    
    // Si es Admin Nacional, cargar carreras de la IES seleccionada
    if (this.isAdminNacional() && ies._id) {
      // Limpiar carreras seleccionadas al cambiar de IES
      this.selectedCareers.set([]);
      this.loadCareersForSpecificIES(ies._id);
    }
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
    
    // Si es Admin Nacional, volver a cargar todas las carreras
    if (this.isAdminNacional()) {
      this.loadAllCareers();
      // No establecer mensaje para mostrar el grid de carreras
      this.careersSectionMessage.set(null);
    }
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

  // ==========================================
  // QR CODE METHODS
  // ==========================================

  /**
   * URL base para el QR de registro
   */
  private readonly baseQRUrl = `${environment.ANUIES_FRONT_URL}/register`;;

  /**
   * Generar URL del QR basada en el ID de la campaña
   */
  qrUrl = computed(() => {
    const campaign = this.selectedCampaignForQR();
    if (campaign?.id) {
      return `${this.baseQRUrl}/${campaign.id}`;
    }
    return this.baseQRUrl;
  });

  /**
   * Generar imagen del QR usando API externa
   */
  qrImageUrl = computed(() => {
    const url = encodeURIComponent(this.qrUrl());
    return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${url}`;
  });

  /**
   * Abrir modal de QR
   */
  openQRModal(campaign: CampaignDisplay): void {
    this.selectedCampaignForQR.set(campaign);
    this.showQRModal.set(true);
    this.linkCopied.set(false);

    // Generar imagen personalizada del QR con el nombre de la campaña
    this.generateCustomQRImage();
  }

  /**
   * Cerrar modal de QR
   */
  closeQRModal(): void {
    this.showQRModal.set(false);
    this.selectedCampaignForQR.set(null);
    this.linkCopied.set(false);
    this.customQRImage.set('');
  }

  /**
   * Copiar link del QR al portapapeles
   */
  copyQRLink(): void {
    navigator.clipboard.writeText(this.qrUrl()).then(() => {
      this.linkCopied.set(true);
      setTimeout(() => {
        this.linkCopied.set(false);
      }, 2000);
    }).catch(err => {
      console.error('Error al copiar el enlace:', err);
    });
  }

  /**
   * Generar nombre del archivo QR con formato: nombre_campaña.png
   */
  getQRFileName(): string {
    const campaign = this.selectedCampaignForQR();
    if (!campaign) {
      return 'registro_qr.png';
    }

    // Limpiar y formatear el nombre de la campaña
    let nombre = campaign.name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remover acentos
      .replace(/[^a-z0-9\s-]/g, '') // Remover caracteres especiales
      .replace(/\s+/g, '_') // Reemplazar espacios con guiones bajos
      .replace(/_+/g, '_') // Reemplazar múltiples guiones bajos con uno solo
      .replace(/^_|_$/g, ''); // Remover guiones bajos al inicio y final

    // Agregar ciclo si está disponible
    let periodo = '';
    if (campaign.cycleName) {
      periodo = campaign.cycleName
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '');
    }

    // Construir nombre del archivo
    if (periodo) {
      return `${nombre}_${periodo}_qr.png`;
    }
    return `${nombre}_qr.png`;
  }

  /**
   * Generar imagen personalizada del QR con el nombre de la campaña
   */
  generateCustomQRImage(): void {
    const campaign = this.selectedCampaignForQR();
    if (!campaign) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const padding = 40;
      const textHeight = 80;

      // Dimensiones del canvas: ancho del QR + padding, alto del QR + texto + padding
      canvas.width = img.width + (padding * 2);
      canvas.height = img.height + textHeight + (padding * 2);

      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Fondo blanco
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Configurar texto
        ctx.fillStyle = '#1e293b'; // Color del texto (slate-800)
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Calcular el tamaño de fuente apropiado para el nombre de la campaña
        const maxWidth = canvas.width - (padding * 2);
        let fontSize = 24;
        ctx.font = `bold ${fontSize}px Arial, sans-serif`;

        // Ajustar tamaño de fuente si el texto es muy largo
        while (ctx.measureText(campaign.name).width > maxWidth && fontSize > 12) {
          fontSize -= 2;
          ctx.font = `bold ${fontSize}px Arial, sans-serif`;
        }

        // Dividir texto en líneas si es necesario
        const words = campaign.name.split(' ');
        const lines: string[] = [];
        let currentLine = words[0];

        for (let i = 1; i < words.length; i++) {
          const testLine = currentLine + ' ' + words[i];
          const metrics = ctx.measureText(testLine);

          if (metrics.width > maxWidth) {
            lines.push(currentLine);
            currentLine = words[i];
          } else {
            currentLine = testLine;
          }
        }
        lines.push(currentLine);

        // Dibujar el nombre de la campaña (centrado en la parte superior)
        const lineHeight = fontSize + 5;
        const startY = padding + (textHeight / 2) - ((lines.length - 1) * lineHeight / 2);

        lines.forEach((line, index) => {
          ctx.fillText(line, canvas.width / 2, startY + (index * lineHeight));
        });

        // Dibujar el código QR debajo del texto
        ctx.drawImage(img, padding, textHeight + padding);

        // Convertir canvas a data URL y guardarlo
        this.customQRImage.set(canvas.toDataURL('image/png'));
      }
    };

    img.onerror = () => {
      console.error('Error al cargar la imagen del QR');
      this.customQRImage.set(this.qrImageUrl());
    };

    img.src = this.qrImageUrl();
  }

  /**
   * Descargar imagen del QR personalizada
   */
  downloadQR(): void {
    const customImage = this.customQRImage();
    if (!customImage) {
      console.error('No hay imagen del QR disponible');
      return;
    }

    const fileName = this.getQRFileName();

    // Convertir data URL a blob y descargar
    fetch(customImage)
      .then(res => res.blob())
      .then(blob => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      })
      .catch(error => {
        console.error('Error al descargar el QR:', error);
      });
  }
}
