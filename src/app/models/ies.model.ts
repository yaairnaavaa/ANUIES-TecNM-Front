export interface ContactoIES {
  email: string;
  telefono: string;
  responsable: string;
}

export interface IES {
  id?: string;
  nombre: string;
  claveOficial: string;
  estatus: 'Activa' | 'Inactiva';
  contacto: ContactoIES;
  fechaRegistro?: string;
}

export interface SidebarItem {
  label: string;
  icon: string;
  route: string;
  badge?: number;
}

export interface SidebarSection {
  title: string;
  items: SidebarItem[];
}