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

  myForm!: FormGroup
  serverError: String = ''
  showPassword: boolean = false

  constructor (private fb: FormBuilder, private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    this.myForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  onSubmit(): void {
    if(this.myForm.invalid) {
      return
    }

    this.authService.login(this.myForm.value).subscribe({
      next: (res) => {
        console.log('✅ Login successful:', res);
        this.router.navigate(['/workSpace']); 
      },
      error: (err) => {
        console.error('❌ Login failed:', err);
        this.serverError = err.error?.message || 'Login failed, please try again.';
      }
    });
  }

};
