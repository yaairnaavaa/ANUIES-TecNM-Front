import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApplicantRegistration } from '../interfaces/register.model';

@Injectable({ providedIn: 'root' })
export class RegistrationService {
  private http = inject(HttpClient);

  private readonly baseUrl = `${environment.apiUrl}/prospects/register`;

  /**
   * Registrar un nuevo aspirante
   */
  registerApplicant(payload: ApplicantRegistration): Observable<any> {
    return this.http.post(this.baseUrl, payload);
  }
}
