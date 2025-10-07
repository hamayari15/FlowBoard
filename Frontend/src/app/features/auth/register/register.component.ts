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
  serverError: String = ''
  wsId: string | null = null;
  projectId: string | null = null;
  
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
      userName: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(30)]],
      email: ['', [Validators.required, Validators.email, Validators.minLength(12)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required],
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
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

  onSubmit(): void {
    this.serverError = '';
    this.authService.register(this.registerForm.value).subscribe({
      next: () => {
        this.router.navigate(['/login']);
      },
      error: (err) => {
        console.error('❌ Login failed:', err);
        this.serverError = err.message || 'Register failed, please try again later.';
      }
    });
  }

}; 