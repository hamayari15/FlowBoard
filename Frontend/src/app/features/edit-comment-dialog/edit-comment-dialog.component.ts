import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import Swal from 'sweetalert2';
import { CommentService } from 'src/app/core/services/comment.service';
import { ApiError } from 'src/app/core/models';

@Component({
  selector: 'app-edit-comment-dialog',
  templateUrl: './edit-comment-dialog.component.html',
  styleUrls: ['./edit-comment-dialog.component.css']
})

export class EditCommentDialogComponent implements OnInit {
  commentForm: FormGroup;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private commentService: CommentService,
    public dialogRef: MatDialogRef<EditCommentDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.commentForm = this.fb.group({
      content: [data.comment.content, [Validators.required, Validators.minLength(3)]]
    });
  }

  ngOnInit(): void {}

  saveComment(): void {
    if (this.commentForm.invalid) return;
    this.loading = true;
    const updatedContent = this.commentForm.value.content;

    this.commentService.updateComment(this.data.comment._id, { content: updatedContent }).subscribe({
      next: (res) => {
      Swal.fire({
          icon: 'success',
          title: 'Comment Updated!',
          text: 'Comment updated successfully',
          showConfirmButton: false,
          timer: 2000
        }); 
        this.dialogRef.close({ updated: true, comment: res });
        this.loading = false;
      },
      error: (error: ApiError) => Swal.fire({ icon: 'error', title: 'Update Failed', text: error.message || 'Failed to update comment', confirmButtonColor: '#3085d6' })    
    });
  }

  close(): void {
    this.dialogRef.close();
  }
}
