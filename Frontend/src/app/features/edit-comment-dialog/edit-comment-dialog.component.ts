import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import Swal from 'sweetalert2';
import { CommentService } from 'src/app/core/services/comment.service';

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
        Swal.fire('Success', 'Comment updated successfully', 'success');
        this.dialogRef.close({ updated: true, comment: res });
        this.loading = false;
      },
      error: () => {
        Swal.fire('Error', 'Failed to update comment', 'error');
        this.loading = false;
      }
    });
  }

  close(): void {
    this.dialogRef.close();
  }
}
