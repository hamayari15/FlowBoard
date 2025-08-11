import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/core/services/auth.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent implements OnInit {

  registerForm!: FormGroup
  serverError: String = ''
  
  constructor (private fb: FormBuilder, private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    this.buildForm()
  }

  buildForm(): void {
    this.registerForm = this.fb.group({
      userName: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(30)]],
      email: ['', [Validators.required, Validators.email, Validators.minLength(12)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required],
      firstName: ['', Validators.required],
      lastName: ['', Validators.required]
    }, {
        validators: this.passwordsMatchValidator
    })
  }

  passwordsMatchValidator(form: FormGroup) {
    const password = form.get('password')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;
    if (password !== confirmPassword) {
      form.get('confirmPassword')?.setErrors({ passwordsMismatch: true });
    }
    return null;
  }

  onSubmit(): void {
    if(this.registerForm.invalid) {
      console.warn('❌ Form is invalid');
      return
    }

    this.authService.register(this.registerForm.value).subscribe({
      next: (res) => {
        console.log('✅ Registration successful:', res);
        this.router.navigate(['/login']);
      },
      error: (err) => {
        if (err.status === 400) {
          this.serverError = err.error.error; 
        }
        else {
          this.serverError = "Something went wrong. Please try again later.";
        }
      }
    })

  }

}; 