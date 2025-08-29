import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { WorkspaceService } from 'src/app/core/services/workspace.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-edit-work-space',
  templateUrl: './edit-work-space.component.html',
  styleUrls: ['./edit-work-space.component.css']
})
export class EditWorkSpaceComponent implements OnInit {

  editForm!: FormGroup;
  workSpaceId: any = '';
  workSpaceData: any = []
  serverError: string = '';

  constructor(private route: ActivatedRoute, private fb: FormBuilder, private wsService: WorkspaceService, private router: Router) {}

  ngOnInit(): void {
    this.workSpaceId = this.route.snapshot.paramMap.get('id');
    this.getWorkSpaceById(this.workSpaceId);
    this.buildForm()
  }

  buildForm(): void {
    this.editForm = this.fb.group({
      name: ['', Validators.required],
      description: ['']
    });
  }

  getWorkSpaceById(workSpaceId: any) {
    this.wsService.getWorkSpaceById(workSpaceId).subscribe((data: any) => {
      this.workSpaceData = data;
      this.editForm.patchValue({
        name: data.name,
        description: data.description
      });
    });
  }

  updateWorkSpace() {
    this.wsService.updateWoksSpace(this.workSpaceId, this.editForm.value).subscribe({
      next: (res) => {
        console.log("Workspace updated successfully", res)
        this.editForm.reset()
        Swal.fire({
          icon: 'success',
          title: 'success',
          text: 'Workspace updated successfully',
          timer: 1500
        })
        setTimeout(() => {
          this.router.navigate(['/workSpaces-list']);
        }, 1500);
      },
      error: (err) => {
        this.serverError = err.error.message || 'Failed to update workspace. Try again.';
      }
    });
  }

};
