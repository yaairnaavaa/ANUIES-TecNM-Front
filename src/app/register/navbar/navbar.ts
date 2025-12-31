import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-navbar',
  imports: [],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar {
  // Estos datos podrán venir de un servicio más adelante
  @Input() titulo: string = 'Articulación EMS-TecNM';
  @Input() subtitulo: string = 'Instituto Tecnológico de Aguascalientes';
  @Input() evento: string = 'Feria Universitaria 2024';
  @Input() registrosHoy: number = 47;

  verQR() {
    console.log('Abriendo QR...');
    // Aquí irá la lógica para mostrar el modal
  }
}
