import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { WorkspaceService } from 'src/app/core/services/workspace.service';

@Component({
  selector: 'app-edit-work-space',
  templateUrl: './edit-work-space.component.html',
  styleUrls: ['./edit-work-space.component.css']
})
export class EditWorkSpaceComponent implements OnInit {

  editForm!: FormGroup;
  workSpaceId: any = '';
  workSpaceData: any = ''
  serverError: string = '';

  constructor(
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private wsService: WorkspaceService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.workSpaceId = this.route.snapshot.paramMap.get('id');
    this.editForm = this.fb.group({
      name: ['', Validators.required],
      description: ['']
    });
    this.getWorkSpaceById(this.workSpaceId);
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
    if (this.editForm.invalid) return;
    this.wsService.updateWoksSpace(this.workSpaceId, this.editForm.value).subscribe({
      next: () => {
        this.router.navigate(['/workSpaces-list']);
      },
      error: (err) => {
        console.log(err)
        this.serverError = err.error.message || 'Failed to update workspace. Try again.';
      }
    });
  }

};
