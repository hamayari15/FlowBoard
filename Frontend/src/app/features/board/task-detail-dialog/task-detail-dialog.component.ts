import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import Swal from 'sweetalert2';

import { TaskService } from 'src/app/core/services/task.service';
import { TaskPopulated, TaskUpdateRequest } from 'src/app/core/models';

@Component({
  selector: 'app-task-detail-dialog',
  templateUrl: './task-detail-dialog.component.html',
  styleUrls: ['./task-detail-dialog.component.css']
})
export class TaskDetailDialogComponent implements OnInit {
  task: TaskPopulated;
  taskForm: FormGroup;
  isEditing = false;
  loading = false;
  priorities = ['low', 'medium', 'high'];

  constructor(
    private fb: FormBuilder,
    private taskService: TaskService,
    public dialogRef: MatDialogRef<TaskDetailDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.task = data.task;
    
    this.taskForm = this.fb.group({
      title: [this.task.title, [Validators.required, Validators.minLength(3)]],
      description: [this.task.description || ''],
      priority: [this.task.priority],
      labels: [this.task.labels?.join(', ') || ''],
      dueDate: [this.task.dueDate || null]
    });
  }

  ngOnInit(): void {
    this.taskForm.disable();
  }

  toggleEdit(): void {
    this.isEditing = !this.isEditing;
    if (this.isEditing) {
      this.taskForm.enable();
    } else {
      this.taskForm.disable();
      // Reset form to original values
      this.taskForm.patchValue({
        title: this.task.title,
        description: this.task.description || '',
        priority: this.task.priority,
        labels: this.task.labels?.join(', ') || '',
        dueDate: this.task.dueDate || null
      });
    }
  }

  saveChanges(): void {
    if (this.taskForm.invalid || !this.task._id) {
      return;
    }

    this.loading = true;
    const formValue = this.taskForm.value;
    
    const labels = formValue.labels 
      ? formValue.labels.split(',').map((l: string) => l.trim()).filter((l: string) => l)
      : [];

    const updateData: TaskUpdateRequest = {
      title: formValue.title,
      description: formValue.description,
      priority: formValue.priority,
      labels: labels,
      dueDate: formValue.dueDate
    };

    this.taskService.updateTask(this.task._id, updateData).subscribe({
      next: (response: any) => {
        Swal.fire('Success', 'Task updated successfully', 'success');
        // Update only the changed fields
        this.task = { 
          ...this.task, 
          title: response.title || this.task.title,
          description: response.description,
          priority: response.priority || this.task.priority,
          labels: response.labels || this.task.labels,
          dueDate: response.dueDate
        };
        this.isEditing = false;
        this.taskForm.disable();
        this.loading = false;
        this.dialogRef.close({ updated: true });
      },
      error: (error) => {
        console.error('Error updating task:', error);
        Swal.fire('Error', 'Failed to update task', 'error');
        this.loading = false;
      }
    });
  }

  deleteTask(): void {
    Swal.fire({
      title: 'Delete Task?',
      text: 'This action cannot be undone!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!',
      reverseButtons: true
    }).then((result) => {
      if (result.isConfirmed && this.task._id) {
        this.taskService.deleteTask(this.task._id).subscribe({
          next: () => {
            Swal.fire('Deleted!', 'Task has been deleted.', 'success');
            this.dialogRef.close({ deleted: true });
          },
          error: (error) => {
            console.error('Error deleting task:', error);
            Swal.fire('Error', 'Failed to delete task', 'error');
          }
        });
      }
    });
  }

  close(): void {
    if (this.isEditing) {
      Swal.fire({
        title: 'Unsaved Changes',
        text: 'You have unsaved changes. Are you sure you want to close?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Yes, close',
        cancelButtonText: 'No, stay'
      }).then((result) => {
        if (result.isConfirmed) {
          this.dialogRef.close();
        }
      });
    } else {
      this.dialogRef.close();
    }
  }

  getPriorityClass(priority: string): string {
    return `priority-${priority}`;
  }

  getPriorityIcon(priority: string): string {
    switch (priority) {
      case 'high': return 'arrow_upward';
      case 'medium': return 'remove';
      case 'low': return 'arrow_downward';
      default: return 'remove';
    }
  }

  getInitials(firstName?: string, lastName?: string): string {
    const first = firstName?.charAt(0) || '';
    const last = lastName?.charAt(0) || '';
    return (first + last).toUpperCase();
  }
}
