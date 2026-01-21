import { Component, OnInit, signal, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Navbar } from '../../navbar/navbar';
import { RegistrationForm } from '../../registration-form/registration-form';
import { CampaignService } from '../../../services/campaign.service';

@Component({
  selector: 'app-register',
  imports: [Navbar, RegistrationForm],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register implements OnInit {
  private route = inject(ActivatedRoute);
  private campaignService = inject(CampaignService);
  
  campaignId = signal<string | null>(null);
  currentCampaign = signal<any>(null);
  isLoadingCampaign = signal<boolean>(false);
  campaignError = signal<string | null>(null);

  ngOnInit() {
    // Capturar el parámetro de campaña de la ruta
    this.route.paramMap.subscribe(params => {
      const id = params.get('campaignId');
      if (id) {
        this.campaignId.set(id);
        console.log('📋 ID de campaña capturado:', id);
        this.loadCampaign(id);
      }
    });
  }

  /**
   * Cargar información de la campaña desde el API
   */
  loadCampaign(campaignId: string): void {
    console.log('🔍 Cargando información de la campaña:', campaignId);
    
    this.isLoadingCampaign.set(true);
    this.campaignError.set(null);
    
    this.campaignService.getCampaignById(campaignId).subscribe({
      next: (response: any) => {
        console.log('✅ Respuesta de la campaña:', response);
        
        // Manejar diferentes estructuras de respuesta
        const isSuccess = response.success === true || response.status === 'success';
        const campaignData = response.data;
        
        if (isSuccess && campaignData) {
          this.currentCampaign.set(campaignData);
          this.isLoadingCampaign.set(false);
          console.log('📋 Campaña cargada:', campaignData);
        } else {
          this.campaignError.set('No se encontró información de la campaña');
          this.isLoadingCampaign.set(false);
          console.warn('⚠️ No se pudo cargar la campaña');
        }
      },
      error: (error) => {
        console.error('❌ Error al cargar la campaña:', error);
        this.isLoadingCampaign.set(false);
        
        // Mensaje de error específico según el código de estado
        if (error.status === 404) {
          this.campaignError.set('La campaña solicitada no existe o ha sido eliminada');
        } else if (error.status === 0) {
          this.campaignError.set('No se pudo conectar con el servidor. Verifica tu conexión a internet');
        } else {
          this.campaignError.set('Ocurrió un error al cargar la información de la campaña');
        }
      }
    });
  }
}
