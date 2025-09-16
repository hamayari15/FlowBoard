import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
} from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Subject, takeUntil } from 'rxjs';
import Swal from 'sweetalert2';

import { WorkspaceService } from 'src/app/core/services/workspace.service';
import { AuthService } from 'src/app/core/services/auth.service';
import {
  Workspace,
  WorkspaceCreateRequest,
  WorkspaceUpdateRequest,
  ApiError,
} from 'src/app/core/models/workspace.model';

export interface DialogData {
  mode: 'add' | 'edit';
  workspace: Workspace | null;
}

@Component({
  selector: 'app-work-space-dialog',
  templateUrl: './work-space-dialog.component.html',
  styleUrls: ['./work-space-dialog.component.css'],
})
export class WorkSpaceDialogComponent implements OnInit, OnDestroy {
  workspaceForm: FormGroup;
  loading = false;
  ownerId: string = '';
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private wsService: WorkspaceService,
    private authService: AuthService,
    public dialogRef: MatDialogRef<WorkSpaceDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData
  ) {
    this.workspaceForm = this.createForm();
  }

  ngOnInit(): void {
    // this.initializeOwner();
    this.ownerId = this.authService.getUserFromToken()?._id || '';
    if (this.data.mode === 'edit' && this.data.workspace) {
      this.populateForm(this.data.workspace);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Create reactive form with validation
   */
  private createForm(): FormGroup {
    return this.fb.group({
      name: [
        '',
        [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(100),
          this.noWhitespaceValidator,
        ],
      ],
      description: ['', [Validators.maxLength(500)]],
    });
  }

  /**
   * Custom validator to prevent whitespace-only input
   */
  private noWhitespaceValidator(
    control: AbstractControl
  ): { [key: string]: any } | null {
    if (control.value && control.value.trim().length === 0) {
      return { whitespace: true };
    }
    return null;
  }

  /**
   * Populate form with existing workspace data
   */
  populateForm(workspace: Workspace): void {
    if (!workspace) return;

    this.workspaceForm.patchValue({
      name: workspace.name || '',
      description: workspace.description || '',
    });
  }

  /**
   * Submit form data
   */
  onSubmit(): void {
    if (!this.workspaceForm.valid) {
      this.markFormGroupTouched();
      return;
    }

    if (!this.ownerId) {
      this.showErrorAlert(
        'Authentication Error',
        'Unable to identify user. Please log in again.'
      );
      return;
    }

    this.loading = true;
    const formData = this.workspaceForm.value;

    if (this.data.mode === 'add') {
      this.createWorkspace(formData);
    } else if (this.data.mode === 'edit' && this.data.workspace?._id) {
      this.updateWorkspace(formData);
    }
  }

  /**
   * Create new workspace
   */
  private createWorkspace(formData: any): void {
    const workspaceData: WorkspaceCreateRequest = {
      name: formData.name.trim(),
      description: formData.description?.trim() || undefined,
      owner: this.ownerId,
    };

    this.wsService
      .addWorkSpace(workspaceData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (workspace: Workspace) => {
          this.loading = false;
          Swal.fire({
            icon: 'success',
            title: 'Success!',
            text: 'Workspace created successfully',
            timer: 2000,
            showConfirmButton: false,
          });
          this.dialogRef.close(workspace);
        },
        error: (error: ApiError) => {
          this.loading = false;
          console.error('Error creating workspace:', error);
          this.showErrorAlert(
            'Creation Failed',
            error.message || 'Failed to create workspace'
          );
        },
      });
  }

  /**
   * Update existing workspace
   */
  private updateWorkspace(formData: any): void {
    if (!this.data.workspace?._id) return;

    const workspaceData: WorkspaceUpdateRequest = {
      name: formData.name.trim(),
      description: formData.description?.trim() || undefined,
    };

    this.wsService
      .updateWorkSpace(this.data.workspace._id, workspaceData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (workspace: Workspace) => {
          this.loading = false;
          Swal.fire({
            icon: 'success',
            title: 'Success!',
            text: 'Workspace updated successfully',
            timer: 2000,
            showConfirmButton: false,
          });
          this.dialogRef.close(workspace);
        },
        error: (error: ApiError) => {
          this.loading = false;
          console.error('Error updating workspace:', error);
          this.showErrorAlert(
            'Update Failed',
            error.message || 'Failed to update workspace'
          );
        },
      });
  }

  /**
   * Mark all form fields as touched for validation display
   */
  markFormGroupTouched(): void {
    Object.keys(this.workspaceForm.controls).forEach((key) => {
      const control = this.workspaceForm.get(key);
      control?.markAsTouched();
    });
  }

  /**
   * Cancel and close dialog
   */
  onCancel(): void {
    this.dialogRef.close();
  }

  /**
   * Get validation error message for field
   */
  getFieldError(fieldName: string): string {
    const control = this.workspaceForm.get(fieldName);

    if (!control || !control.errors || !control.touched) {
      return '';
    }

    const errors = control.errors;

    if (errors['required']) {
      return `${this.getFieldDisplayName(fieldName)} is required`;
    }
    if (errors['minlength']) {
      return `${this.getFieldDisplayName(fieldName)} must be at least ${
        errors['minlength'].requiredLength
      } characters`;
    }
    if (errors['maxlength']) {
      return `${this.getFieldDisplayName(fieldName)} cannot exceed ${
        errors['maxlength'].requiredLength
      } characters`;
    }
    if (errors['whitespace']) {
      return `${this.getFieldDisplayName(
        fieldName
      )} cannot be empty or contain only spaces`;
    }

    return 'Invalid input';
  }

  /**
   * Get display name for field
   */
  private getFieldDisplayName(fieldName: string): string {
    const fieldNames: { [key: string]: string } = {
      name: 'Name',
      description: 'Description',
    };
    return fieldNames[fieldName] || fieldName;
  }

  /**
   * Check if form is valid
   */
  get isFormValid(): boolean {
    return this.workspaceForm.valid && !this.loading;
  }

  get dialogTitle(): string {
    return this.data.mode === 'add' ? 'Create New Workspace' : 'Edit Workspace';
  }

  get submitButtonText(): string {
    return this.data.mode === 'add' ? 'Create Workspace' : 'Update Workspace';
  }

  private showErrorAlert(title: string, message: string): void {
    Swal.fire({
      icon: 'error',
      title,
      text: message,
      confirmButtonColor: '#3085d6',
    });
  }
}
