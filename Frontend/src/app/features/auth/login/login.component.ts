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
  serverError: string = ''
  isSubmitting: boolean = false

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

  // Helper method to get form control errors
  getErrorMessage(controlName: string): string {
    const control = this.loginForm.get(controlName);
    
    if (control?.hasError('required')) {
      return `${controlName === 'email' ? 'Email' : 'Password'} is required`;
    }
    
    if (controlName === 'email' && control?.hasError('email')) {
      return 'Please enter a valid email address';
    }
    
    if (controlName === 'password' && control?.hasError('minlength')) {
      return 'Password must be at least 6 characters';
    }
    
    return '';
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
        
        // Display user-friendly error message
        if (err.message) {
          this.serverError = err.message;
        } else if (err.error?.message) {
          this.serverError = err.error.message;
        } else if (err.status === 0) {
          this.serverError = 'Unable to connect to server. Please check your internet connection.';
        } else {
          this.serverError = 'Login failed. Please try again later.';
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
