import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/core/services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {

  loginForm!: FormGroup
  showPassword: boolean = false
  serverError: String = ''

  constructor (private fb: FormBuilder, private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    this.buildForm()
  }

  buildForm(): void {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  onSubmit(): void {
    this.authService.login(this.loginForm.value).subscribe({
      next: (res) => {
        console.log('✅ Login successful:', res);
        this.router.navigate(['/workSpaces-list']); 
      },
      error: (err) => {
        console.error('❌ Login failed:', err);
        this.serverError = err.error?.message || 'Login failed, please try again later.';
      }
    });
  }

};
