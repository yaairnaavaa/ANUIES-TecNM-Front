import { Component } from '@angular/core';
import { Navbar } from '../../navbar/navbar';
import { RegistrationForm } from '../../registration-form/registration-form';
@Component({
  selector: 'app-register',
  imports: [Navbar, RegistrationForm],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register {

}
