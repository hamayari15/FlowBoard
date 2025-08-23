import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from 'src/app/core/services/auth.service';
import { WorkspaceService } from 'src/app/core/services/workspace.service';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
@Component({
  selector: 'app-add-work-space',
  templateUrl: './add-work-space.component.html',
  styleUrls: ['./add-work-space.component.css']
})

export class AddWorkSpaceComponent implements OnInit {

  form!: FormGroup
  userId: any = '';
  serverError = '';

  constructor(private authService: AuthService, private fb: FormBuilder, private wsService: WorkspaceService, private router: Router) {}

  ngOnInit () {
    this.userId = this.authService.getUserFromToken()._id
    this.buildForm()
  }

  buildForm(): void {
    this.form = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      members: []
    });
  }

  submit() {
    const workspaceData = {
      ...this.form.value,
      owner: this.userId        
    };

    this.wsService.addWorkSpace(workspaceData).subscribe({
      next: (res) => {
        console.log("Workspace created successfully", res)
        this.form.reset()
        Swal.fire({
            icon: 'success',
            title: 'success',
            text: 'Workspace created successfully',
            timer: 1500
          })      
          setTimeout(() => {
            this.router.navigate(['/workSpaces-list'])
          }, 1500);  
      },
      error: (err) => {
        this.serverError = err.error?.message || 'Unexpected error ❌';
      }
    });
  }

};
