// 1. Component e Input vienen de @angular/core
import { Component, Input, computed } from '@angular/core'; 

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
  @Input() registros: number = 0;
  @Input() campaign: any = null; // Información de la campaña
  @Input() campaignId: string | null = null; // ID de la campaña

  // Estado del Modal
  isModalOpen: boolean = false;

  // URL base para el QR
  private readonly baseUrl = 'https://anuies-front.vercel.app/register';

  // Generar URL del QR basada en el campaignId
  qrUrl = computed(() => {
    if (this.campaignId) {
      return `${this.baseUrl}/${this.campaignId}`;
    }
    return `${this.baseUrl}`;
  });

  // Generar imagen del QR usando API externa
  qrImage = computed(() => {
    const url = encodeURIComponent(this.qrUrl());
    return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${url}`;
  });

  verQR() {
    this.isModalOpen = true;
  }

  cerrarModal() {
    this.isModalOpen = false;
  }

  copyLink() {
    navigator.clipboard.writeText(this.qrUrl());
  }

  /**
   * Generar nombre del archivo QR con formato: nombre_campaña_periodo.png
   */
  getQRFileName(): string {
    let nombre = 'registro';
    let periodo = '';
    
    if (this.campaign) {
      // Obtener nombre de la campaña
      nombre = this.campaign.name || 'registro';
      
      // Obtener período del ciclo
      if (this.campaign.cycle?.cycleName) {
        periodo = this.campaign.cycle.cycleName;
      }
    }
    
    // Limpiar y formatear el nombre (remover caracteres especiales, espacios, etc.)
    nombre = nombre
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remover acentos
      .replace(/[^a-z0-9\s-]/g, '') // Remover caracteres especiales
      .replace(/\s+/g, '_') // Reemplazar espacios con guiones bajos
      .replace(/_+/g, '_') // Reemplazar múltiples guiones bajos con uno solo
      .replace(/^_|_$/g, ''); // Remover guiones bajos al inicio y final
    
    // Formatear período
    if (periodo) {
      periodo = periodo
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
      return `${nombre}_${periodo}.png`;
    }
    return `${nombre}.png`;
  }

  /**
   * Descargar imagen del QR
   */
  downloadQR() {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    const fileName = this.getQRFileName();
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        
        canvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
          }
        }, 'image/png');
      }
    };
    
    img.onerror = () => {
      // Fallback: intentar descarga directa
      const link = document.createElement('a');
      link.href = this.qrImage();
      link.download = fileName;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };
    
    img.src = this.qrImage();
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
