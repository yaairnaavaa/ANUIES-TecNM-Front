import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface AcademicCycle {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  status: 'active' | 'finished' | 'scheduled';
}

@Component({
  selector: 'app-cycles',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cycles.html',
})
export class Cycles {
  // Data Management
  cyclesList = signal<AcademicCycle[]>([
    {
      id: '1',
      name: 'Agosto 2025 - Enero 2026',
      startDate: new Date('2025-07-31'),
      endDate: new Date('2026-01-30'),
      status: 'active',
    },
    {
      id: '2',
      name: 'Febrero 2025 - Julio 2025',
      startDate: new Date('2025-01-31'),
      endDate: new Date('2025-07-30'),
      status: 'finished',
    },
    {
      id: '3',
      name: 'Agosto 2024 - Enero 2025',
      startDate: new Date('2024-07-31'),
      endDate: new Date('2025-01-30'),
      status: 'finished',
    },
  ]);

  // UI State
  searchTerm = signal('');
  isModalOpen = signal(false);
  currentPage = signal(1);
  pageSize = signal(10);

  // Filtered List
  filteredCycles = computed(() => {
    const term = this.searchTerm().toLowerCase();
    return this.cyclesList()
      .filter((c) => c.name.toLowerCase().includes(term))
      .filter((c) => c.status !== 'active'); // History only
  });

  // Active Cycle Helper
  activeCycle = computed(() => this.cyclesList().find((c) => c.status === 'active'));

  // Pagination Helper
  totalPages = computed(() => Math.ceil(this.filteredCycles().length / this.pageSize()));

  openModal() {
    this.isModalOpen.set(true);
  }
  closeModal() {
    this.isModalOpen.set(false);
  }

  clearSearch() {
    this.searchTerm.set('');
  }
}
