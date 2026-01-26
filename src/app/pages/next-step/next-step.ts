import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AngularEditorModule, AngularEditorConfig } from '@kolkov/angular-editor';
import { HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-next-step',
  standalone: true,
  imports: [AngularEditorModule, FormsModule, HttpClientModule],
  templateUrl: './next-step.html',
  styleUrl: './next-step.css',
})
export class NextStep {
  htmlContent: string = '';

  config: AngularEditorConfig = {
    editable: true,
    spellcheck: true,
    height: '15rem',
    minHeight: '5rem',
    placeholder: 'Escribe aquí...',
    translate: 'no',
    defaultParagraphSeparator: 'p',
    defaultFontName: 'Arial',
    toolbarHiddenButtons: [['insertImage', 'insertVideo']],
    customClasses: [
      {
        name: 'quote',
        class: 'quote',
      },
      {
        name: 'redText',
        class: 'redText',
      },
      {
        name: 'titleText',
        class: 'titleText',
        tag: 'h1',
      },
    ],
  };

  saveContent(): void {
    console.log('HTML Output:', this.htmlContent);
    alert('Contenido guardado en consola');
  }
}
