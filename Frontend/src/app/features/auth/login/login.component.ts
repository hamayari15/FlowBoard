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

  // Email validator that matches the backend regex pattern
  emailValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) {
      return null; // Don't validate empty values to allow required validator to handle it
    }
    // Same regex as backend: /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})+$/
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
    // Clear previous errors
    this.serverError = '';

    // Check if form is valid
    if (this.loginForm.invalid) {
      Object.keys(this.loginForm.controls).forEach(key => {
        this.loginForm.get(key)?.markAsTouched();
      });
      return;
    }

    // Prevent multiple submissions
    if (this.isSubmitting) {
      return;
    }

    this.isSubmitting = true;

    this.authService.login(this.loginForm.value).subscribe({
      next: (res) => {
        console.log('✅ Login successful:', res);
        this.isSubmitting = false;
        
        // Check for redirect URL
        const redirectUrl = this.authService.getAndClearRedirectUrl();
        if (redirectUrl) {
          console.log('🔄 Redirecting to stored URL:', redirectUrl);
          this.router.navigateByUrl(redirectUrl);
        } else {
          // Default redirect
          this.router.navigate(['/workSpaces-list']); 
        }
      },
      error: (err) => {
        console.error('❌ Login failed:', err);
        this.isSubmitting = false;
        
        // Display specific error messages based on backend responses
        if (err.message) {
          this.serverError = err.message;
        } else if (err.error?.message) {
          // Backend error messages
          const message = err.error.message;
          
          // Map backend messages to user-friendly messages
          if (message.includes('No account found')) {
            this.serverError = '❌ No account found with this email address. Please check your email or create a new account.';
          } else if (message.includes('Incorrect password')) {
            this.serverError = '🔒 Incorrect password. Please try again or reset your password.';
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
        } else if (err.status === 404) {
          this.serverError = '❌ No account found with this email address. Please check your email or create a new account.';
        } else if (err.status === 401) {
          this.serverError = '🔒 Incorrect password. Please try again or reset your password.';
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

  // Helper method to check if field should show error
  shouldShowError(controlName: string): boolean {
    const control = this.loginForm.get(controlName);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

};
