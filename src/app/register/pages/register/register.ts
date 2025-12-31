import { Component } from '@angular/core';
import { Navbar } from '../../navbar/navbar';
import { Stepper } from '../../stepper/stepper';
import { RegistrationForm } from '../../registration-form/registration-form';
@Component({
  selector: 'app-register',
  imports: [Navbar, Stepper, RegistrationForm],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register {
  activeStep: number = 1;

  goToNextStep() {
    if (this.activeStep < 3) {
      this.activeStep++;
    }
  }

  goToPreviousStep() {
    if (this.activeStep > 1) {
      this.activeStep--;
    }
  }
}
