import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import Swal from 'sweetalert2';
import { TaskService } from 'src/app/core/services/task.service';
import { AuthService } from 'src/app/core/services/auth.service';
import { User, TaskCreateRequest, TaskUpdateRequest, Task, ApiError } from 'src/app/core/models';
import { BoardService } from 'src/app/core/services';

@Component({
  selector: 'app-task-dialog',
  templateUrl: './task-dialog.component.html',
  styleUrls: ['./task-dialog.component.css']
})
export class TaskDialogComponent implements OnInit {
  taskForm: FormGroup;
  loading = false;
  loadingMembers = false;
  mode: 'create' | 'edit' = 'create';
  priorityOptions = [
    { value: 'low', label: 'Low', icon: 'arrow_downward', color: '#4caf50' },
    { value: 'medium', label: 'Medium', icon: 'drag_handle', color: '#ff9800' },
    { value: 'high', label: 'High', icon: 'arrow_upward', color: '#f44336' }
  ];
  projectMembers: User[] = [];
  private initialFormValue: { title: string; description: string; priority: string; labels: string[]; assignee: string | null; dueDate: string } | null = null;

  constructor(
    private fb: FormBuilder,
    private taskService: TaskService,
    private authService: AuthService,
    private boardService: BoardService,
    public dialogRef: MatDialogRef<TaskDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.mode = data.mode || 'create';
    this.taskForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      description: [''],
      priority: ['medium'],
      labels: [''],
      assignee: [null],
      dueDate: [null]
    });
  }

  ngOnInit(): void {
    if (this.data.projectId) this.loadProjectMembers();
    if (this.mode === 'edit' && this.data.task) {
      const task = this.data.task;
      this.taskForm.patchValue({
        title: task.title,
        description: task.description || '',
        priority: task.priority,
        labels: task.labels?.join(', ') || '',
        assignee: task.assignee?._id || task.assignee || null,
        dueDate: task.dueDate || null
      });

      this.initialFormValue = {
        title: (task.title || '').trim(),
        description: (task.description || '').trim(),
        priority: task.priority || 'medium',
        labels: this.parseLabels(task.labels?.join(', ') || ''),
        assignee: task.assignee?._id || task.assignee || null,
        dueDate: this.normalizeDate(task.dueDate)
      };
    }
  }

  private parseLabels(raw: string): string[] {
    return raw
      ? raw.split(',').map((l: string) => l.trim()).filter((l: string) => l).sort()
      : [];
  }

  private normalizeDate(value: any): string {
    if (!value) return '';
    const d = new Date(value);
    return isNaN(d.getTime()) ? '' : d.toDateString();
  }

  get hasChanges(): boolean {
    if (this.mode !== 'edit' || !this.initialFormValue) return true;

    const formValue = this.taskForm.value;
    const currentLabels = this.parseLabels(formValue.labels || '');
    const labelsChanged =
      currentLabels.length !== this.initialFormValue.labels.length ||
      currentLabels.some((l, i) => l !== this.initialFormValue!.labels[i]);

    return (
      (formValue.title || '').trim() !== this.initialFormValue.title ||
      (formValue.description || '').trim() !== this.initialFormValue.description ||
      formValue.priority !== this.initialFormValue.priority ||
      (formValue.assignee || null) !== this.initialFormValue.assignee ||
      this.normalizeDate(formValue.dueDate) !== this.initialFormValue.dueDate ||
      labelsChanged
    );
  }

  get isFormValid(): boolean {
    return this.taskForm.valid && !this.loading && this.hasChanges;
  }

  loadProjectMembers(): void {
    if (!this.data.projectId) return;

    this.boardService.getMembersByBoardId(this.data.boardId).subscribe({
      next: (members: User[]) => {
        this.projectMembers = members;
        this.loadingMembers = false;
      },
      error: (error: ApiError) => {
        this.loadingMembers = false;
        Swal.fire({ icon: 'error', title: 'Load Failed', text: 'Unable to load assignees for this project. You can still create the task and assign it later.', confirmButtonColor: '#3085d6' });
      }
    });
  }

  onSubmit(): void {
    if (this.taskForm.invalid) {
      Object.keys(this.taskForm.controls).forEach(key => {
        this.taskForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.loading = true;
    const formValue = this.taskForm.value;
    const labels = this.parseLabels(formValue.labels);

    const currentUser = this.authService.getCurrentUser();

    if (this.mode === 'create') {
      const taskData: TaskCreateRequest = {
        title: formValue.title,
        description: formValue.description,
        board: this.data.boardId,
        status: this.data.status || 'to-do',
        priority: formValue.priority,
        labels: labels,
        assignee: formValue.assignee || undefined,
        dueDate: formValue.dueDate,
        createdBy: (currentUser as any)?._id || (currentUser as any)?.id
      };
      this.taskService.createTask(taskData).subscribe({
        next: (response) => {
          Swal.fire({
            icon: 'success',
            title: 'Task Created!',
            text: 'New task has been created successfully',
            showConfirmButton: true
          });
          this.dialogRef.close(response);
        },
        error: (error: ApiError) => {
          this.loading = false;
          Swal.fire({ icon: 'error', title: 'Creation Failed', text: error.message || 'Failed to create task', confirmButtonColor: '#3085d6' });
        }
      });
    } else if (this.mode === 'edit') {
      const updateData: TaskUpdateRequest = {
        title: formValue.title,
        description: formValue.description,
        priority: formValue.priority,
        labels: labels,
        assignee: formValue.assignee || undefined,
        dueDate: formValue.dueDate
      };
      this.taskService.updateTask(this.data.task._id, updateData).subscribe({
        next: (response) => {
          Swal.fire({
            icon: 'success',
            title: 'Task Updated!',
            text: 'Task updated successfully',
            showConfirmButton: false,
            timer: 2000
          });
          this.dialogRef.close({ updated: true });
        },
        error: (error: ApiError) => {
          this.loading = false;
          Swal.fire({ icon: 'error', title: 'Update Failed', text: error.message || 'Failed to update task', confirmButtonColor: '#3085d6' });
        }
      });
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  get selectedPriority() {
    return this.priorityOptions.find(p => p.value === this.taskForm.get('priority')?.value);
  }

  getErrorMessage(fieldName: string): string {
    const control = this.taskForm.get(fieldName);
    if (control?.hasError('required')) return `${fieldName} is required`;
    if (control?.hasError('minlength')) return `${fieldName} must be at least ${control.errors?.['minlength'].requiredLength} characters`;
    return '';
  }
}