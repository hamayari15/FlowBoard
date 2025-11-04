import { Component, Inject, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import Swal from 'sweetalert2';
import { TaskService } from 'src/app/core/services/task.service';
import { CommentService } from 'src/app/core/services/comment.service';
import { AuthService } from 'src/app/core/services';
import { TaskPopulated } from 'src/app/core/models';
import { EditCommentDialogComponent } from '../edit-comment-dialog/edit-comment-dialog.component';
import { TaskDialogComponent } from '../task-dialog/task-dialog.component';

@Component({
  selector: 'app-task-detail-dialog',
  templateUrl: './task-detail-dialog.component.html',
  styleUrls: ['./task-detail-dialog.component.css']
})
export class TaskDetailDialogComponent implements OnInit {
  task: TaskPopulated;
  loading = false;
  priorities = ['low', 'medium', 'high'];
  comments: any[] = [];
  newComment = '';
  currentUserId: string = '';

  constructor(
    private taskService: TaskService,
    private commentService: CommentService,
    private authService: AuthService,
    public dialog: MatDialog,
    public dialogRef: MatDialogRef<TaskDetailDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.task = data.task;
  }

  ngOnInit(): void {
    this.loadComments();
    const user = this.authService.getUserFromToken();
    if (user && user._id) this.currentUserId = user._id;
    else Swal.fire('Error', 'Unable to identify user. Please log in again.', 'error');
  }

  
  addComment(): void {
    if (!this.newComment.trim() || !this.task._id || !this.currentUserId) return;
    const payload = { task: this.task._id, content: this.newComment, author: this.currentUserId };
    this.commentService.createComment(payload).subscribe({
      next: (res) => {
        this.comments.push(res);
        this.newComment = '';
        Swal.fire({
          icon: 'success',
          title: 'Comment Added !',
          text: 'A new comment has been added successfully.',
          timer: 2000,
          showConfirmButton: false
        });        },
      error: () => Swal.fire('Error', 'Failed to add comment', 'error')
    });
  }
  
  loadComments(): void {
    if (!this.task._id) return;
    this.commentService.getCommentsByTask(this.task._id).subscribe({
      next: (res) => {
        this.comments = res;
      },
      error: () => Swal.fire('Error', 'Failed to load comments', 'error')
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
      text: 'You wont be able to revert this action!',
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
            Swal.fire({
                      icon: 'success',
                      title: 'Deleted !',
                      text: 'Comment deleted successfully.',
                      timer: 2000,
                      showConfirmButton: false
                    }); 
          },
          error: () => Swal.fire('Error', 'Failed to delete comment', 'error')
        });
      }
    });
  }

  openEditTaskDialog(): void {
    const dialogRef = this.dialog.open(TaskDialogComponent, {
      width: '600px',
      data: {
        mode: 'edit',
        task: this.task,
        boardId: this.data.board._id,
        projectId: this.data.board.project
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        Swal.fire('Success', 'Task updated successfully', 'success');
        this.dialogRef.close({ updated: true });
      }
    });
  }

  deleteTask(): void {
    Swal.fire({
      title: 'Delete Task?',
      text: 'You wont be able to revert this action!',
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
            Swal.fire({
                      icon: 'success',
                      title: 'Deleted !',
                      text: 'Task deleted successfully.',
                      timer: 2000,
                      showConfirmButton: false
                    }); 
            this.dialogRef.close({ deleted: true });
          },
          error: () => Swal.fire('Error', 'Failed to delete task', 'error')
        });
      }
    });
  }

  close(): void {
    this.dialogRef.close();
  }

  getPriorityClass(priority: string) {
    return `priority-${priority}`;
  }

  getPriorityIcon(priority: string): string {
    return priority === 'high' ? 'arrow_upward' : priority === 'medium' ? 'remove' : 'arrow_downward';
  }

  getInitials(firstName?: string, lastName?: string): string {
    return ((firstName?.charAt(0) || '') + (lastName?.charAt(0) || '')).toUpperCase();
  }
}
