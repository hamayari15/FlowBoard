import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import Swal from 'sweetalert2';
import { TaskService } from 'src/app/core/services/task.service';
import { AuthService } from 'src/app/core/services/auth.service';
import { User, TaskCreateRequest, TaskUpdateRequest, Task } from 'src/app/core/models';
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
  priorities = ['low', 'medium', 'high'];
  projectMembers: User[] = [];

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
    }
  }

  loadProjectMembers(): void {
  if (!this.data.projectId) return;
  console.log("hama", this.data); 

  this.boardService.getMembersByBoardId(this.data.boardId).subscribe({
  next: (members: User[]) => {
    this.projectMembers = members;
    this.loadingMembers = false;
  },
  error: (err) => {
    console.log(err);
    this.loadingMembers = false;
    Swal.fire('Error', 'Failed to load project members', 'error');
  }
});
  };


  onSubmit(): void {
    if (this.taskForm.invalid) {
      Object.keys(this.taskForm.controls).forEach(key => {
        this.taskForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.loading = true;
    const formValue = this.taskForm.value;
    const labels = formValue.labels 
      ? formValue.labels.split(',').map((l: string) => l.trim()).filter((l: string) => l)
      : [];

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
          title: 'Task Created !',
          text: 'New task has been created successfully.',
          showConfirmButton: false,
          timer: 2000
        });          
          this.dialogRef.close(response);
        },
        error: (error) => {
          Swal.fire('Error', error.message || 'Failed to create task', 'error');
          this.loading = false;
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
          title: 'Updated !',
          text: 'Task updated successfully.',
          showConfirmButton: false,
          timer: 2000
        });          
          this.dialogRef.close({ updated: true });
        },
        error: (error) => {
          Swal.fire('Error', error.message || 'Failed to update task', 'error');
          this.loading = false;
        }
      });
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  getErrorMessage(fieldName: string): string {
    const control = this.taskForm.get(fieldName);
    if (control?.hasError('required')) return `${fieldName} is required`;
    if (control?.hasError('minlength')) return `${fieldName} must be at least ${control.errors?.['minlength'].requiredLength} characters`;
    return '';
  }
}
