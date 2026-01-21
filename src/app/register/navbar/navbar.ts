// 1. Component e Input vienen de @angular/core
import { Component, Input } from '@angular/core'; 

// 2. CommonModule viene de @angular/common
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar {
  @Input() titulo: string = 'Articulación EMS-TecNM';
  @Input() subtitulo: string = 'Instituto Tecnológico de Aguascalientes';
  @Input() evento: string = 'Feria Universitaria 2024';
  @Input() registrosHoy: number = 47;
  @Input() campaign: any = null; // Información de la campaña

  // Estado del Modal
  isModalOpen: boolean = false;

  // Datos del QR (Próximamente de Backend)
  qrUrl: string = 'https://articulacion.tecnm.mx/r/feria2024';
  qrImage: string = 'assets/qr-placeholder.png'; // Ruta a la imagen generada

  verQR() {
    this.isModalOpen = true;
  }

  cerrarModal() {
    this.isModalOpen = false;
  }

  copyLink() {
    navigator.clipboard.writeText(this.qrUrl);
    alert('¡Enlace copiado al portapapeles!');
  }

  /**
   * Obtener nombre de la IES de la campaña
   */
  getCampaignIESName(): string {
    if (!this.campaign?.ies) return this.subtitulo;
    return this.campaign.ies.iesName || this.campaign.ies.name || this.subtitulo;
  }

  /**
   * Obtener nombre del evento/campaña
   */
  getCampaignName(): string {
    return this.campaign?.name || this.evento;
  }
}
