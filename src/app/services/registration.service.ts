import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { ApplicantRegistration } from '../interfaces/register.model';

@Injectable({ providedIn: 'root' })
export class RegistrationService {
  
  // Placeholder for your future backend URL
  submitRegistration(data: ApplicantRegistration): Observable<any> {
    console.log('Payload ready for backend:', data);
    // Simulating a successful server response
    return of({ status: 'success', message: 'Registration processed' }).pipe(delay(1500));
  }
}