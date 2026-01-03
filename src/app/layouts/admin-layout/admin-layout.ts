import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../../components/sidebar-component/sidebar-component';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, SidebarComponent],
  template: `
    <div class="flex min-h-screen bg-slate-50">
      <app-sidebar-component></app-sidebar-component>

      <main class="flex-1 h-screen overflow-y-auto pt-16 lg:pt-0">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
})
export class AdminLayout {}
