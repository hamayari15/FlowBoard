import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ProjectService } from 'src/app/core/services/project.service';
import { WorkspaceService } from 'src/app/core/services/workspace.service';
import { AuthService } from 'src/app/core/services/auth.service';
import { Project, ProjectPopulated, ProjectCreateRequest, ApiError } from 'src/app/core/models';
import { Subject, takeUntil } from 'rxjs';
import Swal from 'sweetalert2';

export interface DialogData {
  mode: 'add' | 'edit';
  workspaceId: string;
  project: Project | ProjectPopulated | null;
}

@Component({
  selector: 'app-project-dialog',
  templateUrl: './project-dialog.component.html',
  styleUrls: ['./project-dialog.component.css'],
})
export class ProjectDialogComponent implements OnInit, OnDestroy {
  projectForm: FormGroup;
  loading = false;
  availableMembers: any[] = [];
  selectedMembers: string[] = [];
  private destroy$ = new Subject<void>();

  statusOptions = [
    { value: 'active', label: 'Active', icon: 'play_circle', color: '#4caf50' },
    {
      value: 'on-hold',
      label: 'On Hold',
      icon: 'pause_circle',
      color: '#ff9800',
    },
    {
      value: 'completed',
      label: 'Completed',
      icon: 'check_circle',
      color: '#2196f3',
    },
  ];

  constructor(
    private fb: FormBuilder,
    private projectService: ProjectService,
    private workspaceService: WorkspaceService,
    private authService: AuthService,
    public dialogRef: MatDialogRef<ProjectDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData
  ) {
    this.projectForm = this.fb.group({
      name: [
        '',
        [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(100),
        ],
      ],
      description: ['', Validators.maxLength(500)],
      status: ['active', Validators.required],
      members: [[]],
    });
  }

  ngOnInit(): void {
    this.loadWorkspaceMembers();

    if (this.data.mode === 'edit' && this.data.project) {
      this.populateForm(this.data.project);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadWorkspaceMembers() {
    this.workspaceService.getWorkSpaceById(this.data.workspaceId).subscribe({
      next: (workspace: any) => {
        this.availableMembers = workspace.members || [];
        if (
          workspace.owner &&
          !this.availableMembers.find((m: any) => m._id === workspace.owner._id)
        ) {
          this.availableMembers.unshift(workspace.owner);
        }
      },
      error: (error) => {
        console.error('Error loading workspace members:', error);
      },
    });
  }

  populateForm(project: Project | ProjectPopulated) {
    this.projectForm.patchValue({
      name: project.name,
      description: project.description || '',
      status: project.status
    });
  }

  onSubmit() {
    if (this.projectForm.valid) {
      if (this.data.mode === 'add' && !this.authService.getCurrentUser()?._id) {
        Swal.fire('Authentication Error', 'Unable to identify user. Please log in again.', 'error');
        return;
      }

      this.loading = true;
      const formData = this.projectForm.value;

      const projectData: any = {
        name: formData.name,
        description: formData.description,
        status: formData.status,
        members: this.selectedMembers,
        workspace: this.data.workspaceId,
        owner: this.authService.getCurrentUser()?._id,
      };

      if (this.data.mode === 'add') {
        this.projectService.addProject(projectData).subscribe({
          next: (project: Project) => {
            this.loading = false;
            Swal.fire({
          icon: 'success',
          title: 'Project Created !',
          text: 'Your project has been created successfully. You can now invite members using the invite button.',
          showConfirmButton: true
        });            this.dialogRef.close(project);
          },
          error: (error) => {
            this.loading = false;
            console.error('Error creating project:', error);
            Swal.fire('Error', 'Failed to create project', 'error');
          },
        });
      } else if (this.data.mode === 'edit' && this.data.project?._id) {
        // For update, only send the fields that can be updated
        const updateData = {
          name: formData.name,
          description: formData.description,
          status: formData.status,
          members: this.selectedMembers,
        };
        
        this.projectService
          .updateProject(this.data.project._id, updateData)
          .subscribe({
            next: (project: Project) => {
              this.loading = false;
              Swal.fire({
          icon: 'success',
          title: 'Updated !',
          text: 'Project updated successfully.',
          timer: 2000,
          showConfirmButton: false
        });
        this.dialogRef.close(project);  
          },
          error: (error) => {
            this.loading = false;
            console.error('Error updating project:', error);
            Swal.fire('Error', 'Failed to update project', 'error');
          },
        });
      }
    } else {
      this.markFormGroupTouched();
    }
  }

  markFormGroupTouched() {
    Object.keys(this.projectForm.controls).forEach((key) => {
      const control = this.projectForm.get(key);
      control?.markAsTouched();
    });
  }

  onCancel() {
    this.dialogRef.close();
  }

  getFieldError(fieldName: string): string {
    const field = this.projectForm.get(fieldName);
    if (field?.errors && field.touched) {
      if (field.errors['required']) return `${fieldName} is required`;
      if (field.errors['minlength'])
        return `${fieldName} must be at least ${field.errors['minlength'].requiredLength} characters`;
      if (field.errors['maxlength'])
        return `${fieldName} must be at most ${field.errors['maxlength'].requiredLength} characters`;
    }
    return '';
  }

  get isFormValid(): boolean {
    return this.projectForm.valid;
  }

  get dialogTitle(): string {
    return this.data.mode === 'add' ? 'Create New Project' : 'Edit Project';
  }

  get submitButtonText(): string {
    return this.data.mode === 'add' ? 'Create Project' : 'Update Project';
  }
}
