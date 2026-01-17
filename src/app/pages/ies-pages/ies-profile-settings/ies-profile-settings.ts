import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  FormArray,
} from '@angular/forms';

import { IesService } from '../../../services/ies.service';
import { AuthService } from '../../../services/auth.service';

/**
 * Secciones editables del perfil
 */
type EditSection = 'general' | 'social';

@Component({
  selector: 'app-ies-profile-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './ies-profile-settings.html',
})
export class IesProfileSettings implements OnInit {
  private fb = inject(FormBuilder);
  private iesService = inject(IesService);
  private authService = inject(AuthService);

  isSaving = false;
  showCareerModal = false;

  editModes: Record<EditSection, boolean> = {
    general: false,
    social: false,
  };

  iesForm!: FormGroup;

  // ================================
  // Lifecycle
  // ================================
  ngOnInit(): void {
    this.buildForm();
    this.loadData();
  }

  // ================================
  // Form setup
  // ================================
  private buildForm(): void {
    this.iesForm = this.fb.group({
      mision: ['', Validators.required],
      vision: ['', Validators.required],

      branding: this.fb.group({
        primaryColor: ['#4f46e5', Validators.required],
        secondaryColor: ['#0f172a', Validators.required],
      }),

      socialMedia: this.fb.group({
        website: [''],
        facebook: [''],
        instagram: [''],
        tiktok: [''],
      }),

      careers: this.fb.array([]),
    });
  }

  // ================================
  // Getters
  // ================================
  get careers(): FormArray<FormGroup> {
    return this.iesForm.get('careers') as FormArray<FormGroup>;
  }

  // ================================
  // Data loading
  // ================================
  loadData(): void {
    const user = this.authService.currentUser();

    const iesId =
      typeof user?.ies === 'string' ? user.ies : user?.ies?._id;

    if (!iesId) return;

    this.iesService.getIESById(iesId).subscribe((res) => {
      const data = res?.data;
      if (!data) return;

      this.iesForm.patchValue({
        mision: data.mision ?? '',
        vision: data.vision ?? '',
        branding: data.branding ?? {},
        socialMedia: data.socialMedia ?? {},
      });

      this.careers.clear();

      (data.careers ?? []).forEach((career: any) => {
        this.careers.push(
          this.fb.group({
            name: [career.name ?? '', Validators.required],
            modality: [career.modality ?? '', Validators.required],
          }),
        );
      });
    });
  }

  // ================================
  // UI actions
  // ================================
  toggleEdit(section: EditSection): void {
    this.editModes[section] = !this.editModes[section];
  }

  // ================================
  // Save actions
  // ================================
  saveGeneral(): void {
    if (this.iesForm.get('mision')?.invalid) return;

    this.update(
      {
        mision: this.iesForm.value.mision,
        vision: this.iesForm.value.vision,
      },
      'general',
    );
  }

  saveBranding(): void {
    this.update({ branding: this.iesForm.value.branding });
  }

  saveSocial(): void {
    this.update(
      { socialMedia: this.iesForm.value.socialMedia },
      'social',
    );
  }

  // ================================
  // Careers
  // ================================
  addCareer(): void {
    this.careers.push(
      this.fb.group({
        name: ['', Validators.required],
        modality: ['', Validators.required],
      }),
    );
  }

  deleteCareer(index: number): void {
    this.careers.removeAt(index);
    this.update({ careers: this.careers.value });
  }

  // ================================
  // API update
  // ================================
  private update(payload: any, section?: EditSection): void {
    const user = this.authService.currentUser();
    const iesId =
      typeof user?.ies === 'string' ? user.ies : user?.ies?._id;

    if (!iesId) return;

    this.isSaving = true;

    this.iesService.updateIES(iesId, payload).subscribe({
      next: () => {
        if (section) {
          this.editModes[section] = false;
        }
        this.isSaving = false;
      },
      error: () => {
        this.isSaving = false;
      },
    });
  }
}
