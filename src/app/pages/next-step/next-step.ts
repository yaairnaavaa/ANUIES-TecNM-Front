import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AngularEditorModule, AngularEditorConfig } from '@kolkov/angular-editor';
import { HttpClientModule } from '@angular/common/http';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ViewEncapsulation } from '@angular/core';
import { SafeHtmlPipe } from './safe-html.pipe'; // Asegura la ruta correcta
import { IesService } from '../../services/ies.service';
import { AuthService } from '../../services/auth.service';
@Component({
  selector: 'app-next-step',
  standalone: true,
  imports: [AngularEditorModule, FormsModule, HttpClientModule],
  templateUrl: './next-step.html',
  styleUrl: './next-step.css',
  encapsulation: ViewEncapsulation.None,
})
export class NextStep implements OnInit {
  htmlContent: string = '';
  // Esta variable guardará el HTML que Angular ya NO va a limpiar
  htmlSeguro: SafeHtml = '';
  isLoading: boolean = false;
  // Agrega | null para que TypeScript permita resetearlas con null
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);
  private iesService = inject(IesService);
  // iesId: string = this.authService.iesId() ?? '';

  constructor(private sanitiezer: DomSanitizer) {}

  ngOnInit(): void {
    this.cargarDatos();
  }

  config: AngularEditorConfig = {
    editable: true,
    spellcheck: true,
    height: '60vh', // <--- Aumentamos la altura aquí (60% del alto de la pantalla)
    minHeight: '30rem',
    placeholder: 'Escribe aquí...',
    translate: 'no',
    defaultParagraphSeparator: 'p',
    defaultFontName: 'Arial',

    toolbarHiddenButtons: [
      [
        'justifyLeft',
        'justifyCenter',
        'justifyRight',
        'justifyFull',
        'toggleEditorMode',
        'backgroundColor',
        'indent',
        'outdent',
        'insertUnorderedList',
        'insertOrderedList',
      ],
      ['insertImage', 'insertVideo', 'subscript', 'superscript'],
    ],

    customClasses: [
      { name: 'Centrar', class: 'text-center', tag: 'p' },
      { name: 'Izquierda', class: 'text-left', tag: 'p' },
      { name: 'Derecha', class: 'text-right', tag: 'p' },
    ],
  };

  // Al recibir el HTML de la base de datos, lo procesamos
  htmlPrueba: string = `
  <p class=\"text-center\"><font face=\"Comic Sans MS\" size=\"6\" color=\"#ff0000\"><b><i>Hola</i></b></font></p><p class=\"text-center\"><font face=\"Comic Sans MS\" size=\"6\" color=\"#ff0000\"><b><i><br /></i></b></font></p><p class=\"text-center\"><font size=\"6\" color=\"#ff0000\" face=\"Arial\"><b><i>ssdsdsdsd</i></b></font></p>
`;

  cargarDatos() {
    // 1. Intentar obtener el ID de la forma más rápida posible (Sincrona)
    const iesId = localStorage.getItem('anuies_ies_id');

    if (!iesId) {
      console.error('No hay IES ID disponible');
      this.actualizarVistaPrevia(this.htmlPrueba);
      return;
    }

    this.isLoading = true;

    this.iesService.getIESHtml(iesId).subscribe({
      next: (res) => {
        const contenido = res.data?.html || this.htmlPrueba;
        this.actualizarVistaPrevia(this.htmlPrueba);
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error cargando HTML:', err);
        this.actualizarVistaPrevia(this.htmlPrueba);
        this.isLoading = false;
      },
    });
  }

  // Este método se llama cada vez que el usuario escribe
  actualizarVistaPrevia(nuevoContenido: string) {
    const normalizado = nuevoContenido
      .replace(/style="text-align:\s*center;?"/gi, 'class="text-center"')
      .replace(/style="text-align:\s*right;?"/gi, 'class="text-right"')
      .replace(/style="text-align:\s*left;?"/gi, 'class="text-left"');

    this.htmlContent = normalizado;
    this.htmlSeguro = this.sanitiezer.bypassSecurityTrustHtml(normalizado);
    console.log(this.htmlContent);
  }

  // Opcional: Para que al cargar también funcione
  saveContent(): void {
    const iesId = localStorage.getItem('anuies_ies_id') as string;
    this.iesService.saveIESHtml(iesId, this.htmlContent).subscribe({
      next: (res) => {
        this.successMessage.set('Plantilla guardada');
        setTimeout(() => this.successMessage.set(null), 3500);
      },
      error: (err) => {
        this.errorMessage.set('Error al guardar la plantilla');
        setTimeout(() => this.errorMessage.set(null), 3500);
      },
    });
  }
}
