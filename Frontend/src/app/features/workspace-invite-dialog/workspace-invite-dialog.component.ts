import { Component, Inject, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { WorkspaceService } from 'src/app/core/services/workspace.service';
import { Subject, takeUntil } from 'rxjs';
import Swal from 'sweetalert2';

export interface InviteDialogData {
  workspaceId: string;
  workspaceName: string;
  type: 'workspace';
}

@Component({
  selector: 'app-workspace-invite-dialog',
  templateUrl: './workspace-invite-dialog.component.html',
  styleUrls: ['./workspace-invite-dialog.component.css']
})
export class WorkspaceInviteDialogComponent implements OnDestroy {
  inviteForm: FormGroup;
  loading = false;
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private wsService: WorkspaceService,
    public dialogRef: MatDialogRef<WorkspaceInviteDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: InviteDialogData
  ) {
    this.inviteForm = this.fb.group({
      emails: this.fb.array([this.createEmailField()]),
      message: ['', Validators.maxLength(500)]
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get emailsArray(): FormArray {
    return this.inviteForm.get('emails') as FormArray;
  }

  createEmailField(): FormGroup {
    return this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  addEmailField(): void {
    if (this.emailsArray.length < 10) {
      this.emailsArray.push(this.createEmailField());
    }
  }

  removeEmailField(index: number): void {
    if (this.emailsArray.length > 1) {
      this.emailsArray.removeAt(index);
    }
  }

  getValidEmails(): string[] {
    return this.emailsArray.controls
      .map(control => control.get('email')?.value?.trim())
      .filter(email => email && this.isValidEmail(email));
  }

  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  onSubmit(): void {
    if (!this.inviteForm.valid) return;

    const validEmails = this.getValidEmails();
    
    if (validEmails.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'No Valid Emails',
        text: 'Please enter at least one valid email address.',
        confirmButtonColor: '#667eea'
      });
      return;
    }

    this.loading = true;

    const inviteObservable = validEmails.length === 1 
      ? this.wsService.inviteMember(this.data.workspaceId, validEmails[0])
      : this.wsService.bulkInviteMembers(this.data.workspaceId, validEmails);

    inviteObservable.pipe(takeUntil(this.destroy$)).subscribe({
      next: (response: any) => {
        this.loading = false;
        
        if (validEmails.length === 1) {
          const message = response.userExists 
            ? `${validEmails[0]} has been added to the workspace!`
            : `Invitation sent to ${validEmails[0]}. They'll need to create an account to join.`;
          
          const title = response.userExists ? 'Member Added!' : 'Invitation Sent!';
          
          Swal.fire({
            icon: 'success',
            title: title,
            text: message,
            confirmButtonColor: '#667eea'
          });
        } else {
          const { summary } = response;
          let message = `${summary.successful} invitations sent successfully.`;
          
          if (summary.skipped > 0) {
            message += ` ${summary.skipped} were skipped (already members or invalid).`;
          }
          if (summary.failed > 0) {
            message += ` ${summary.failed} failed to send.`;
          }

          Swal.fire({
            icon: summary.failed === 0 ? 'success' : 'warning',
            title: 'Bulk Invitation Complete',
            text: message,
            confirmButtonColor: '#667eea'
          });
        }
        
        this.dialogRef.close({ success: true, response });
      },
      error: (error: any) => {
        this.loading = false;
        Swal.fire({
          icon: 'error',
          title: 'Invitation Failed',
          text: error.message || 'Failed to send invitations. Please try again.',
          confirmButtonColor: '#667eea'
        });
      }
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  getFieldError(fieldName: string, index?: number): string {
    const control = index !== undefined 
      ? this.emailsArray.at(index).get(fieldName)
      : this.inviteForm.get(fieldName);
      
    if (control?.errors && control.touched) {
      if (control.errors['required']) return `${fieldName} is required`;
      if (control.errors['email']) return 'Please enter a valid email address';
      if (control.errors['maxlength']) return `${fieldName} is too long`;
    }
    return '';
  }
}