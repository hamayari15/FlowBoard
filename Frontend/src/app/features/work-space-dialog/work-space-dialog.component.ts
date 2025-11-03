import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Subject, takeUntil } from 'rxjs';
import Swal from 'sweetalert2';
import { WorkspaceService } from 'src/app/core/services/workspace.service';
import { AuthService } from 'src/app/core/services/auth.service';
import { Workspace, WorkspacePopulated, WorkspaceCreateRequest, WorkspaceUpdateRequest, ApiError } from 'src/app/core/models';

export interface DialogData {
  mode: 'add' | 'edit';
  workspace: Workspace | WorkspacePopulated | null;
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
    this.workspaceForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100), this.noWhitespaceValidator]],
      description: ['', [Validators.maxLength(500)]],
    });
  }

  ngOnInit(): void {
    this.ownerId = this.authService.getUserFromToken()?._id || '';
    if (this.data.mode === 'edit' && this.data.workspace) {
      this.workspaceForm.patchValue({
        name: this.data.workspace.name || '',
        description: this.data.workspace.description || '',
      });
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private noWhitespaceValidator(control: AbstractControl): { [key: string]: any } | null {
    if (control.value && control.value.trim().length === 0) {
      return { whitespace: true };
    }
    return null;
  }

  onSubmit(): void {
    if (!this.workspaceForm.valid) {
      this.markFormGroupTouched();
      return;
    }
    if (!this.ownerId) {
      this.showErrorAlert('Authentication Error', 'Unable to identify user. Please log in again.');
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

  private createWorkspace(formData: any): void {
    const workspaceData: WorkspaceCreateRequest = {
      name: formData.name.trim(),
      description: formData.description?.trim() || undefined,
      owner: this.ownerId,
    };

    this.loading = true;
    this.wsService.addWorkSpace(workspaceData).pipe(takeUntil(this.destroy$)).subscribe({
      next: (workspace: Workspace) => {
        this.loading = false;
        this.data.workspace = workspace;
        Swal.fire({
          icon: 'success',
          title: 'Workspace Created !',
          text: 'Your workspace has been created successfully. You can now invite members using the invite button.',
          showConfirmButton: true
        });
        this.dialogRef.close(workspace);
      },
      error: (error: ApiError) => {
        this.loading = false;
        this.showErrorAlert('Creation Failed', error.message || 'Failed to create workspace');
      },
    });
  }

  private updateWorkspace(formData: any): void {
    if (!this.data.workspace?._id) return;
    const workspaceData: WorkspaceUpdateRequest = {
      name: formData.name.trim(),
      description: formData.description?.trim() || undefined,
    };
    this.wsService.updateWorkSpace(this.data.workspace._id, workspaceData).pipe(takeUntil(this.destroy$)).subscribe({
      next: (workspace: Workspace) => {
        this.loading = false;
          Swal.fire({
            icon: 'success',
            title: 'Updated !',
            text: 'Workspace updated successfully.',
            timer: 2000,
            showConfirmButton: false
          });        
        this.dialogRef.close(workspace);
      },
      error: (error: ApiError) => {
        this.loading = false;
        this.showErrorAlert('Update Failed', error.message || 'Failed to update workspace');
      },
    });
  }

  markFormGroupTouched(): void {
    Object.keys(this.workspaceForm.controls).forEach((key) => {
      this.workspaceForm.get(key)?.markAsTouched();
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  getFieldError(fieldName: string): string {
    const control = this.workspaceForm.get(fieldName);
    if (!control || !control.errors || !control.touched) return '';
    if (control.errors['required']) return `${this.getFieldDisplayName(fieldName)} is required`;
    if (control.errors['minlength']) return `${this.getFieldDisplayName(fieldName)} must be at least ${control.errors['minlength'].requiredLength} characters`;
    if (control.errors['maxlength']) return `${this.getFieldDisplayName(fieldName)} cannot exceed ${control.errors['maxlength'].requiredLength} characters`;
    if (control.errors['whitespace']) return `${this.getFieldDisplayName(fieldName)} cannot be empty or contain only spaces`;
    return 'Invalid input';
  }

  private getFieldDisplayName(fieldName: string): string {
    const fieldNames: { [key: string]: string } = { name: 'Name', description: 'Description' };
    return fieldNames[fieldName] || fieldName;
  }

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
    Swal.fire({ icon: 'error', title, text: message, confirmButtonColor: '#3085d6' });
  }
}
