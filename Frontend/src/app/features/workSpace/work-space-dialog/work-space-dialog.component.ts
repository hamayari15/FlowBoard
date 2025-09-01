import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { WorkspaceService } from 'src/app/core/services/workspace.service';
import Swal from 'sweetalert2';
import { AuthService } from 'src/app/core/services/auth.service';

export interface DialogData {
  mode: 'add' | 'edit';
  workspace: any | null;
}

@Component({
  selector: 'app-work-space-dialog',
  templateUrl: './work-space-dialog.component.html',
  styleUrls: ['./work-space-dialog.component.css'],
})
export class WorkSpaceDialogComponent implements OnInit {
  workspaceForm: FormGroup;
  loading = false;
  ownerId: string = '';

  constructor(
    private fb: FormBuilder,
    private wsService: WorkspaceService,
    private authService: AuthService,
    public dialogRef: MatDialogRef<WorkSpaceDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData
  ) {
    this.workspaceForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      description: ['', Validators.maxLength(500)],
    });
  }

  ngOnInit(): void {
    this.ownerId = this.authService.getUserFromToken()._id; // get owner id from auth service
    console.log(this.ownerId)

    if (this.data.mode === 'edit' && this.data.workspace) {
      this.populateForm(this.data.workspace);
    }
  }

  populateForm(workspace: any) {
    this.workspaceForm.patchValue({
      name: workspace.name,
      description: workspace.description || '',
    });
  }

  onSubmit() {
    if (!this.workspaceForm.valid) {
      this.markFormGroupTouched();
      return;
    }

    this.loading = true;
    const formData = this.workspaceForm.value;
    const workspaceData: any = {
      ...formData,
      owner: this.ownerId,
    };

    if (this.data.mode === 'add') {
      this.wsService.addWorkSpace(workspaceData).subscribe({
        next: (res) => {
          this.loading = false;
          Swal.fire('Success!', 'Workspace created successfully', 'success');
          this.dialogRef.close(res);
        },
        error: (err) => {
          this.loading = false;
          console.error('Error creating workspace:', err);
          Swal.fire('Error', 'Failed to create workspace', 'error');
        },
      });
    } else if (this.data.mode === 'edit' && this.data.workspace?._id) {
      this.wsService.updateWorkSpace(this.data.workspace._id, workspaceData).subscribe({
        next: (res) => {
          this.loading = false;
          Swal.fire('Success!', 'Workspace updated successfully', 'success');
          this.dialogRef.close(res);
        },
        error: (err) => {
          this.loading = false;
          console.error('Error updating workspace:', err);
          Swal.fire('Error', 'Failed to update workspace', 'error');
        },
      });
    }
  }

  markFormGroupTouched() {
    Object.keys(this.workspaceForm.controls).forEach((key) => {
      const control = this.workspaceForm.get(key);
      control?.markAsTouched();
    });
  }

  onCancel() {
    this.dialogRef.close();
  }

  getFieldError(fieldName: string): string {
    const field = this.workspaceForm.get(fieldName);
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
    return this.workspaceForm.valid;
  }

  get dialogTitle(): string {
    return this.data.mode === 'add' ? 'Create New Workspace' : 'Edit Workspace';
  }

  get submitButtonText(): string {
    return this.data.mode === 'add' ? 'Create Workspace' : 'Update Workspace';
  }

};
