import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AngularEditorModule, AngularEditorConfig } from '@kolkov/angular-editor';
import { HttpClientModule } from '@angular/common/http';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ViewEncapsulation } from '@angular/core';
import { SafeHtmlPipe } from './safe-html.pipe'; // Asegura la ruta correcta

@Component({
  selector: 'app-next-step',
  standalone: true,
  imports: [AngularEditorModule, FormsModule, HttpClientModule, SafeHtmlPipe],
  templateUrl: './next-step.html',
  styleUrl: './next-step.css',
  encapsulation: ViewEncapsulation.None,
})
export class NextStep {
  htmlContent: string = '';
  // Esta variable guardará el HTML que Angular ya NO va a limpiar
  htmlSeguro: SafeHtml = '';

  constructor(private sanitiezer: DomSanitizer) {}

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
      ],
      ['insertImage', 'insertVideo', 'subscript', 'superscript'],
    ],

    customClasses: [
      { name: 'Centrar', class: 'text-center', tag: 'p' },
      { name: 'Izquierda', class: 'text-left', tag: 'p' },
      { name: 'Derecha', class: 'text-right', tag: 'p' },
    ],
  };

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
    console.log('HTML Output:', this.htmlContent);
    alert('Contenido guardado');
  }
}
