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

  editForm: FormGroup;
  workspaceId: any;

  constructor(
    private fb: FormBuilder,
    private workspaceService: WorkspaceService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.editForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      owner: ['', Validators.required],
      members: ['']
    });
  }

  ngOnInit(): void {
    this.workspaceId = this.route.snapshot.paramMap.get('id');
    this.getWorkspace();
  }

  getWorkspace() {
    this.workspaceService.getWorkSpaceById(this.workspaceId).subscribe({
      next: (res: any) => {
        this.editForm.patchValue({
          name: res.name,
          description: res.description,
          owner: res.owner?._id || res.owner,
          members: res.members?.map((m: any) => m._id).join(',') || ''
        });
      },
      error: (err) => {
        console.error('Error fetching workspace:', err);
      }
    });
  }

  onSubmit() {
    if (this.editForm.invalid) return;

    const updatedData = {
      ...this.editForm.value,
      members: this.editForm.value.members.split(',').map((id: string) => id.trim())
    };

    this.workspaceService.updateWoksSpace(updatedData, this.workspaceId).subscribe({
      next: (res) => {
        console.log('Workspace updated:', res);
        this.router.navigate(['/workSpaces-list']);
      },
      error: (err) => {
        console.error('Error updating workspace:', err);
      }
    });
  }

};
