import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
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

  emailValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) {
      return null;
    }
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})+$/;
    const valid = emailRegex.test(control.value);
    return valid ? null : { invalidEmail: true };
  }

  buildForm(): void {
    this.registerForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(30)]],
      lastName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(30)]],
      userName: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(30)]],
      email: ['', [Validators.required, this.emailValidator.bind(this), Validators.minLength(12)]],
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
    const confirmControl = form.get('confirmPassword');

    if (password !== confirmPassword) {
      confirmControl?.setErrors({ ...confirmControl.errors, passwordsMismatch: true });
    } else if (confirmControl?.hasError('passwordsMismatch')) {
      const { passwordsMismatch, ...rest } = confirmControl.errors ?? {};
      confirmControl.setErrors(Object.keys(rest).length ? rest : null);
    }

    return null;
  }

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
    
    if (control.hasError('invalidEmail')) {
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

  shouldShowError(controlName: string): boolean {
    const control = this.registerForm.get(controlName);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  onSubmit(): void {
    this.serverError = '';
    this.successMessage = '';

    if (this.registerForm.invalid) {
      Object.keys(this.registerForm.controls).forEach(key => {
        this.registerForm.get(key)?.markAsTouched();
      });
      return;
    }

    if (this.isSubmitting) {
      return;
    }

    this.isSubmitting = true;

    this.authService.register(this.registerForm.value).subscribe({
      next: (response) => {
        console.log('✅ Registration successful:', response);
        this.isSubmitting = false;
        this.successMessage = 'Registration successful! Redirecting to login...';
        
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 1500);
      },
      error: (err) => {
        console.error('❌ Registration failed:', err);
        this.isSubmitting = false;
        
        if (err.message) {
          this.serverError = err.message;
        } else if (err.error?.message) {
          const message = err.error.message;
          
          if (message.includes('All fields are required')) {
            this.serverError = '⚠️ All fields are required: firstName, lastName, userName, email, and password.';
          } else if (message.includes('valid email')) {
            this.serverError = '📧 Please enter a valid email address.';
          } else if (message.includes('Username must be between')) {
            this.serverError = '👤 Username must be between 3 and 30 characters.';
          } else if (message.includes('Password must be at least')) {
            this.serverError = '🔒 Password must be at least 6 characters long.';
          } else if (message.includes('email already exists')) {
            this.serverError = '❌ An account with this email already exists. Please use a different email or try logging in.';
          } else if (message.includes('username is already taken')) {
            this.serverError = '❌ This username is already taken. Please choose a different username.';
          } else if (message.includes('Workspace not found')) {
            this.serverError = '🔍 Workspace not found. Please check your invitation link.';
          } else if (message.includes('Project not found')) {
            this.serverError = '🔍 Project not found. Please check your invitation link.';
          } else {
            this.serverError = message;
          }
        } else if (err.status === 0) {
          this.serverError = '🌐 Unable to connect to server. Please check your internet connection.';
        } else if (err.status === 409) {
          this.serverError = '❌ An account with this email or username already exists.';
        } else if (err.status === 400) {
          this.serverError = '⚠️ Invalid input. Please check your information and try again.';
        } else if (err.status === 404) {
          this.serverError = '🔍 Resource not found. Please check your invitation link.';
        } else if (err.status === 500) {
          this.serverError = '⚠️ Server error. Please try again later.';
        } else {
          this.serverError = '❌ Registration failed. Please try again later.';
        }
      }
    });
  }

}; 