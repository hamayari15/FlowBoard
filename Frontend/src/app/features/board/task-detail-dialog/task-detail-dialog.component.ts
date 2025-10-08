import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import Swal from 'sweetalert2';
import { TaskService } from 'src/app/core/services/task.service';
import { CommentService } from 'src/app/core/services/comment.service';
import { AuthService } from 'src/app/core/services';
import { TaskPopulated, TaskUpdateRequest } from 'src/app/core/models';
import { EditCommentDialogComponent } from '../../edit-comment-dialog/edit-comment-dialog.component';

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
  comments: any[] = [];
  newComment = '';
  currentUserId: string = '';

  constructor(
    private fb: FormBuilder,
    private taskService: TaskService,
    private commentService: CommentService,
    private authService: AuthService,
    public dialog: MatDialog,
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
    this.loadComments();
    const user = this.authService.getUserFromToken();
    if (user && user._id) this.currentUserId = user._id;
    else Swal.fire('Error', 'Unable to identify user. Please log in again.', 'error');
  }

  loadComments(): void {
    if (!this.task._id) return;
    this.commentService.getCommentsByTask(this.task._id).subscribe({
      next: (res) => {
        this.comments = res
        console.log(this.comments)
      },
      
      error: () => Swal.fire('Error', 'Failed to load comments', 'error')
    });
  }

  addComment(): void {
    if (!this.newComment.trim() || !this.task._id || !this.currentUserId) return;
    const payload = { task: this.task._id, content: this.newComment, author: this.currentUserId };
    this.commentService.createComment(payload).subscribe({
      next: (res) => {
        this.comments.push(res);
        this.newComment = '';
        Swal.fire('Success', 'Comment added successfully', 'success');
      },
      error: () => Swal.fire('Error', 'Failed to add comment', 'error')
    });
  }

  editComment(comment: any): void {
    const dialogRef = this.dialog.open(EditCommentDialogComponent, {
      width: '500px',
      data: { comment }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result?.updated) {
        const index = this.comments.findIndex(c => c._id === comment._id);
        if (index !== -1) this.comments[index] = result.comment;
      }
    });
  }

  deleteComment(comment: any): void {
    Swal.fire({
      title: 'Delete Comment?',
      text: 'This action cannot be undone!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!',
      reverseButtons: true
    }).then(result => {
      if (result.isConfirmed && comment._id) {
        this.commentService.deleteComment(comment._id).subscribe({
          next: () => {
            this.comments = this.comments.filter(c => c._id !== comment._id);
            Swal.fire('Deleted!', 'Comment has been deleted.', 'success');
          },
          error: () => Swal.fire('Error', 'Failed to delete comment', 'error')
        });
      }
    });
  }

  toggleEdit(): void {
    this.isEditing = !this.isEditing;
    if (this.isEditing) this.taskForm.enable();
    else this.taskForm.disable();
  }

  saveChanges(): void {
    if (this.taskForm.invalid || !this.task._id) return;
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
        this.task = { ...this.task, ...response };
        this.isEditing = false;
        this.taskForm.disable();
        this.loading = false;
        this.dialogRef.close({ updated: true });
      },
      error: () => {
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
    }).then(result => {
      if (result.isConfirmed && this.task._id) {
        this.taskService.deleteTask(this.task._id).subscribe({
          next: () => {
            Swal.fire('Deleted!', 'Task has been deleted.', 'success');
            this.dialogRef.close({ deleted: true });
          },
          error: () => Swal.fire('Error', 'Failed to delete task', 'error')
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
      }).then(result => { if (result.isConfirmed) this.dialogRef.close(); });
    } else this.dialogRef.close();
  }

  getPriorityClass(priority: string) { return `priority-${priority}`; }

  getPriorityIcon(priority: string): string {
    return priority === 'high' ? 'arrow_upward' : priority === 'medium' ? 'remove' : 'arrow_downward';
  }

  getInitials(firstName?: string, lastName?: string): string {
    return ((firstName?.charAt(0) || '') + (lastName?.charAt(0) || '')).toUpperCase();
  }
}
