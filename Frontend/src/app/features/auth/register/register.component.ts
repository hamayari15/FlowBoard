import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from 'src/app/core/services/auth.service';
import { Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent implements OnInit {

  registerForm!: FormGroup
  serverError: string = ''
  successMessage: string = ''
  wsId: string | null = null;
  projectId: string | null = null;
  isSubmitting: boolean = false;
  
  constructor (private fb: FormBuilder, private authService: AuthService, private router: Router, private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.buildForm()

    this.route.queryParamMap.subscribe(params => {
      this.wsId = params.get('wsId');
      this.registerForm.patchValue({ wsId: this.wsId });
    });
    this.route.queryParamMap.subscribe(params => {
      this.projectId = params.get('projectId');
      this.registerForm.patchValue({ projectId: this.projectId });
    });
  }

  buildForm(): void {
    this.registerForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      lastName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      userName: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(30)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required],
      wsId: this.wsId,
      projectId: this.projectId,
    }, {
        validators: this.passwordsMatchValidator
    });
  }

  passwordsMatchValidator(form: FormGroup) {
    const password = form.get('password')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;
    if (password !== confirmPassword) {
      form.get('confirmPassword')?.setErrors({ passwordsMismatch: true });
    }
    return null;
  }

  // Helper method to get form control errors
  getErrorMessage(controlName: string): string {
    const control = this.registerForm.get(controlName);
    
    if (!control || !control.errors) {
      return '';
    }

    if (control.hasError('required')) {
      const fieldNames: { [key: string]: string } = {
        firstName: 'First name',
        lastName: 'Last name',
        userName: 'Username',
        email: 'Email',
        password: 'Password',
        confirmPassword: 'Confirm password'
      };
      return `${fieldNames[controlName]} is required`;
    }
    
    if (control.hasError('email')) {
      return 'Please enter a valid email address';
    }
    
    if (control.hasError('minlength')) {
      const minLength = control.errors['minlength'].requiredLength;
      return `Minimum ${minLength} characters required`;
    }

    if (control.hasError('maxlength')) {
      const maxLength = control.errors['maxlength'].requiredLength;
      return `Maximum ${maxLength} characters allowed`;
    }
    
    if (control.hasError('passwordsMismatch')) {
      return 'Passwords do not match';
    }
    
    return '';
  }

  // Helper method to check if field should show error
  shouldShowError(controlName: string): boolean {
    const control = this.registerForm.get(controlName);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  onSubmit(): void {
    // Clear previous messages
    this.serverError = '';
    this.successMessage = '';

    // Check if form is valid
    if (this.registerForm.invalid) {
      Object.keys(this.registerForm.controls).forEach(key => {
        this.registerForm.get(key)?.markAsTouched();
      });
      return;
    }

    // Prevent multiple submissions
    if (this.isSubmitting) {
      return;
    }

    this.isSubmitting = true;

    this.authService.register(this.registerForm.value).subscribe({
      next: (response) => {
        console.log('✅ Registration successful:', response);
        this.isSubmitting = false;
        this.successMessage = 'Registration successful! Redirecting to login...';
        
        // Redirect after a brief delay to show success message
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 1500);
      },
      error: (err) => {
        console.error('❌ Registration failed:', err);
        this.isSubmitting = false;
        
        // Display user-friendly error message
        if (err.message) {
          this.serverError = err.message;
        } else if (err.error?.message) {
          this.serverError = err.error.message;
        } else if (err.status === 0) {
          this.serverError = 'Unable to connect to server. Please check your internet connection.';
        } else if (err.status === 409) {
          this.serverError = 'An account with this email or username already exists.';
        } else {
          this.serverError = 'Registration failed. Please try again later.';
        }
      }
    });
  }

}; 