// 1. Component e Input vienen de @angular/core
import { Component, Input, computed, signal } from '@angular/core'; 

// 2. CommonModule viene de @angular/common
import { CommonModule } from '@angular/common';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar {
  @Input() titulo: string = 'Articulación EMS';
  @Input() subtitulo: string = 'Instituto Tecnológico de Aguascalientes';
  @Input() evento: string = 'Feria Universitaria 2024';
  @Input() registros: number = 0;
  @Input() campaign: any = null; // Información de la campaña
  @Input() campaignId: string | null = null; // ID de la campaña

  // Estado del Modal
  isModalOpen: boolean = false;
  
  // Imagen del QR personalizada con el nombre de la campaña
  customQRImage = signal<string>('');

  // URL base para el QR
  private readonly baseUrl = `${environment.ANUIES_FRONT_URL}/register`;;


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
    // Generar imagen personalizada del QR con el nombre de la campaña
    this.generateCustomQRImage();
  }

  cerrarModal() {
    this.isModalOpen = false;
    this.customQRImage.set('');
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
   * Generar imagen personalizada del QR con el nombre de la campaña
   */
  generateCustomQRImage(): void {
    const campaignName = this.getCampaignName();

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
        while (ctx.measureText(campaignName).width > maxWidth && fontSize > 12) {
          fontSize -= 2;
          ctx.font = `bold ${fontSize}px Arial, sans-serif`;
        }
        
        // Dividir texto en líneas si es necesario
        const words = campaignName.split(' ');
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
      this.customQRImage.set(this.qrImage());
    };
    
    img.src = this.qrImage();
  }

  /**
   * Descargar imagen del QR personalizada
   */
  downloadQR() {
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
