import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
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
  serverError: string = ''
  isSubmitting: boolean = false

  constructor (private fb: FormBuilder, private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    this.buildForm()
  }

  emailValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) {
      return null;
    }
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})+$/;
    const valid = emailRegex.test(control.value);
    return valid ? null : { invalidEmail: true };
  }

  buildForm(): void {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, this.emailValidator.bind(this)]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }


  onSubmit(): void {
    this.serverError = '';

    if (this.loginForm.invalid) {
      Object.keys(this.loginForm.controls).forEach(key => {
        this.loginForm.get(key)?.markAsTouched();
      });
      return;
    }

    if (this.isSubmitting) {
      return;
    }

    this.isSubmitting = true;

    this.authService.login(this.loginForm.value).subscribe({
      next: (res) => {
        console.log('✅ Login successful:', res);
        this.isSubmitting = false;
        
        const redirectUrl = this.authService.getAndClearRedirectUrl();
        if (redirectUrl) {
          console.log('🔄 Redirecting to stored URL:', redirectUrl);
          this.router.navigateByUrl(redirectUrl);
        } else {
          this.router.navigate(['/workSpaces-list']); 
        }
      },
      error: (err) => {
        console.error('❌ Login failed:', err);
        this.isSubmitting = false;
        
        if (err.message) {
          this.serverError = err.message;
        } else if (err.error?.message) {
          const message = err.error.message;
          
          if (message.includes('Invalid email or password')) {
            this.serverError = '❌ Invalid email or password.';
          } else if (message.includes('deactivated')) {
            this.serverError = '🚫 Your account has been deactivated. Please contact support.';
          } else if (message.includes('Email and password are required')) {
            this.serverError = '⚠️ Email and password are required.';
          } else if (message.includes('valid email')) {
            this.serverError = '📧 Please enter a valid email address.';
          } else {
            this.serverError = message;
          }
        } else if (err.status === 0) {
          this.serverError = '🌐 Unable to connect to server. Please check your internet connection.';
        } else if (err.status === 401) {
          this.serverError = '❌ Invalid email or password.';
        } else if (err.status === 403) {
          this.serverError = '🚫 Your account has been deactivated. Please contact support.';
        } else if (err.status === 500) {
          this.serverError = '⚠️ Server error. Please try again later.';
        } else {
          this.serverError = '❌ Login failed. Please try again later.';
        }
      }
    });
  }

  shouldShowError(controlName: string): boolean {
    const control = this.loginForm.get(controlName);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

};
