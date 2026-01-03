export interface SidebarItem {
  label: string;
  icon: string;
  route: string;
  badge: number;
  section: string; // Para separar por 'Principal', 'Gestión', etc.
}
