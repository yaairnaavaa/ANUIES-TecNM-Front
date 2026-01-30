export interface User {
  _id?: string;
  firstName: string;
  lastName: string;
  secondLastName?: string;
  email: string;
  password?: string;
  role: string | Role | 'Admin Nacional' | 'Admin IES' | 'Operativo IES' | 'Interesado';
  phone?: string;
  ies?: string | IES | IESAuth;
  iems?: string;
  active?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IESAuth {
  id: string;
  name: string;
  code: string;
}


export interface IES {
  _id?: string;
  code: string;
  name: string;
  shortName?: string;
  mision?: string;
  vision?: string;
  address: {
    street?: string;
    number?: string;
    neighborhood?: string;
    municipality: string;
    state: string;
    postalCode?: string;
    country?: string;
  };
  contact: {
    generalPhone?: string;
    email?: string;
    website?: string;
    responsable?: string;
    nombreDirector?: string;
    socialMedia?: {
      facebook?: string;
      instagram?: string;
      twitter?: string;
      youtube?: string;
      tiktok?: string;
    };
  };
  careers?: Career[];
  institutionalImage?: {
    logo?: string;
    logoPublicId?: string;
    banner?: string;
    bannerPublicId?: string;
    gallery?: Array<{
      url: string;
      publicId?: string;
      description?: string;
    }>;
  };
  branding?: {
    primaryColor?: string;
    secondaryColor?: string;
    accentColor?: string;
    fontFamily?: string;
  };
  ofertaEducativa?: {
    descripcion?: string;
    totalCarreras?: number;
  };
  socialMedia?: {
    facebook?: string;
    instagram?: string;
    tiktok?: string;
    website?: string;
  };
  active?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Career {
  id: string;
  name: string;
  shortName?: string;
  code?: string;
  careerLink?: string;
  modality: 'Presencial' | 'Mixta' | 'Virtual';
  duration?: number;
  shift?: Array<'Matutino' | 'Vespertino' | 'Nocturno' | 'Mixto'>;
  capacityPerSemester: number;
  active?: boolean;
}

export interface Campaign {
  _id?: string;
  ies: string | IES;
  name: string;
  description?: string;
  type: 'Presencial' | 'Tradicional' | 'Digital';
  specificModality: string;
  period: {
    startDate: Date | string;
    endDate: Date | string;
  };
  reach: {
    estimated: number;
    actual?: number;
    unit?: 'Personas' | 'Impresiones' | 'Clics' | 'Vistas' | 'Asistentes';
  };
  costs: {
    total: number;
    costPerImpact?: number;
  };
  targetedIEMS?: string[];
  targetedCareers?: string[];
  responsible?: string | User;
  status?: 'Planificada' | 'En curso' | 'Finalizada' | 'Cancelada' | 'Pausada';
  metrics?: {
    impressions?: number;
    clicks?: number;
    conversions?: number;
    engagementRate?: number;
    roi?: number;
  };
  active?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Prospect {
  _id?: string;

  // Datos personales
  fullName?: string;
  firstName: string;
  lastName: string;
  secondLastName?: string;
  birthDate?: Date | string;
  gender?: 'Masculino' | 'Femenino' | 'Otro' | 'Prefiero no decir';
  curp?: string;

  // Datos de contacto
  email: string;
  phone: {
    landline?: string;
    mobile: string;
  };

  // Dirección
  address: {
    street?: string;
    number?: string;
    neighborhood?: string;
    locality?: string;
    municipality?: string;
    state?: string;
    postalCode?: string;
  };

  // Procedencia académica
  originIEMS?: string;
  originIEMSName?: string;
  technicalMajor?: string;

  // Discapacidad, lengua indígena y etnia
  hasDisability?: boolean;
  disabilityType?: string;
  disabilityDetails?: string;
  speaksIndigenousLanguage?: boolean;
  indigenousLanguage?: string;
  belongsToEthnicGroup?: boolean;
  ethnicGroup?: string;
  iemsCareer?: string;
  iemsAverage?: number;
  averageGrade?: number;
  currentSemester?: number | string;
  estimatedGraduationDate?: Date | string;

  // Interés en TecNM
  firstChoiceIES?: string;
  careerInterests?: Array<{
    career: string;
    priority: number;
  }>;

  // Ciclo escolar
  cycleId?: string;
  cycleName?: string;

  // Canal de captación
  contactChannel?:
    | 'Conferencia'
    | 'Visita a IEMS'
    | 'Facebook'
    | 'Instagram'
    | 'TikTok'
    | 'WhatsApp'
    | 'Feria universitaria'
    | 'Familiar o amigo'
    | 'Docente de IEMS'
    | 'Sitio web'
    | 'YouTube'
    | 'Open House'
    | 'Otro';
  originCampaign?: string;

  // Clasificación del interés
  classification?: 'Curioso' | 'Prospecto' | 'Aspirante Activo';

  // Redes sociales e intereses
  socialMedia?: {
    facebook?: string;
    instagram?: string;
    tiktok?: string;
    twitter?: string;
  };
  personalInterests?: string[];

  // Estado del proceso
  processStatus?: {
    registrationComplete?: boolean;
    profileValidated?: boolean;
    readNotifications?: Array<{
      date: Date | string;
      message: string;
    }>;
    lastInteraction?: Date | string;
  };

  // Seguimiento
  observations?: string;
  assignedTo?: string;

  active?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Role {
  _id?: string;
  name: string;
  displayName: string;
  description?: string;
  permissions: string[];
  level: number;
  scope: 'Nacional' | 'IES' | 'IEMS' | 'General';
  requiresIES: boolean;
  active?: boolean;
}

export interface Permission {
  _id?: string;
  name: string;
  displayName: string;
  description?: string;
  module:
    | 'Usuarios'
    | 'IES'
    | 'IEMS'
    | 'Campañas'
    | 'Prospectos'
    | 'Periodos'
    | 'Reportes'
    | 'Configuración'
    | 'Sistema';
  action: 'create' | 'read' | 'update' | 'delete' | 'execute' | 'export' | 'import';
  resource: string;
  active?: boolean;
}

export interface Period {
  _id?: string;
  name: string;
  code: string;
  academicYear: string;
  semester: 'Enero-Junio' | 'Agosto-Diciembre' | 'Intersemestral';
  dates: {
    enrollmentStart: Date | string;
    enrollmentEnd: Date | string;
    classStart: Date | string;
    classEnd: Date | string;
    examPeriodStart?: Date | string;
    examPeriodEnd?: Date | string;
  };
  status: 'Planificado' | 'Activo' | 'En curso' | 'Finalizado' | 'Cerrado';
  isCurrent?: boolean;
  active?: boolean;
}

export interface MenuItem {
  id: string;
  label: string;
  icon: string;
  routerLink: string;
  category: string;
}

export interface RoleAuth {
  id: string;
  name: string;
  displayName: string;
  level: number;
  scope: 'Nacional' | 'IES' | 'IEMS' | 'General';
}

export interface UserAuth {
  id: string;
  firstName: string;
  lastName: string;
  secondLastName?: string;
  email: string;
  role: RoleAuth;
  menu: MenuItem[];
  ies?: IES | string;
  active: boolean;
  createdAt: string;
}

export interface AuthResponse {
  success: boolean;
  token?: string;
  user?: User;
  data?: UserAuth;
  message?: string;
  ies?: {
    id: string;
    name: string;
    code: string;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  count?: number;
  message?: string;
  error?: string;
}

export interface IEMS {
  _id?: string;
  code: string;
  name: string;
  type:
    | 'CBTis'
    | 'CETis'
    | 'CONALEP'
    | 'Bachillerato General'
    | 'Bachillerato Tecnológico'
    | 'Telebachillerato'
    | 'Preparatoria'
    | 'Otro';
  address: {
    street?: string;
    number?: string;
    neighborhood?: string;
    locality?: string;
    municipality: string;
    state: string;
    postalCode?: string;
    country?: string;
  };
  contact?: {
    directorName?: string;
    generalPhone?: string;
    email?: string;
    website?: string;
    educationalCounselor?: {
      name?: string;
      email?: string;
      phone?: string;
    };
  };
  educationalOffer?: Array<{
    career: string;
    modality: 'Presencial' | 'Mixta' | 'Virtual';
    tecNMAlignment: 'Alta' | 'Media' | 'Baja';
  }>;
  statistics?: {
    totalEnrollment?: number;
    lastCycleGraduates?: number;
    graduatesByCareer?: Array<{
      career: string;
      quantity: number;
    }>;
    lastUpdate?: Date;
  };
  linkage?: {
    directPassAgreements?: Array<{
      ies: string | IES;
      includedCareers: string[];
      validity: {
        start: Date | string;
        end: Date | string;
      };
      active: boolean;
    }>;
    tecNMRelationship?: 'Fuerte' | 'Moderada' | 'Débil' | 'Sin relación';
  };
  active?: boolean;
  showMenu?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
