import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import Swal from 'sweetalert2';
import { BoardService } from 'src/app/core/services/board.service';
import { BoardCreateRequest, BoardUpdateRequest, Board, ApiError } from 'src/app/core/models';

@Component({
  selector: 'app-board-dialog',
  templateUrl: './board-dialog.component.html',
  styleUrls: ['./board-dialog.component.css']
})
export class BoardDialogComponent implements OnInit {
  boardForm: FormGroup;
  loading = false;
  mode: 'add' | 'edit' = 'add';

  constructor(
    private fb: FormBuilder,
    private boardService: BoardService,
    public dialogRef: MatDialogRef<BoardDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.mode = data.mode || 'add';
    this.boardForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100), this.noWhitespaceValidator]],
      description: ['', [Validators.maxLength(500)]]
    });
  }

  ngOnInit(): void {
    if (this.mode === 'edit' && this.data.board) {
      this.boardForm.patchValue({
        name: this.data.board.name,
        description: this.data.board.description || ''
      });
    }
  }

  private noWhitespaceValidator(control: AbstractControl): { [key: string]: any } | null {
    if (control.value && control.value.trim().length === 0) {
      return { whitespace: true };
    }
    return null;
  }

  onSubmit(): void {
    if (this.boardForm.invalid) {
      Object.keys(this.boardForm.controls).forEach(key => this.boardForm.get(key)?.markAsTouched());
      return;
    }

    this.loading = true;
    const formValue = this.boardForm.value;

    if (this.mode === 'add') {
      this.createBoard(formValue);
    } else {
      this.updateBoard(formValue);
    }
  }

  private createBoard(formValue: any): void {
    const boardData: BoardCreateRequest = {
      name: formValue.name.trim(),
      description: formValue.description?.trim() || undefined,
      project: this.data.projectId || this.data.project,
      columns: [
        { name: 'To Do', order: 0 },
        { name: 'In Progress', order: 1 },
        { name: 'In Review', order: 2 },
        { name: 'Done', order: 3 }
      ]
    };

    this.boardService.createBoard(boardData).subscribe({
      next: (board: Board) => {
        this.loading = false;
        this.data.board = board;
        Swal.fire({
          icon: 'success',
          title: 'Board Created !',
          text: 'Your board has been created successfully.',
          showConfirmButton: true
        });
        this.dialogRef.close(board);
      },
      error: (error: ApiError) => {
        this.loading = false;
        this.showErrorAlert('Creation Failed', error.message || 'Failed to create board');
      }
    });
  }

  private updateBoard(formValue: any): void {
    if (!this.data.board?._id) return;

    const boardData: BoardUpdateRequest = {
      name: formValue.name.trim(),
      description: formValue.description?.trim() || undefined
    };

    this.boardService.updateBoard(this.data.board._id, boardData).subscribe({
      next: (board: Board) => {
        this.loading = false;
        Swal.fire({
          icon: 'success',
          title: 'Updated !',
          text: 'Board updated successfully.',
          timer: 2000,
          showConfirmButton: false
        });
        this.dialogRef.close(board);
      },
      error: (error: ApiError) => {
        this.loading = false;
        this.showErrorAlert('Update Failed', error.message || 'Failed to update board');
      }
    });
  }

  private showErrorAlert(title: string, message: string): void {
    Swal.fire({ icon: 'error', title, text: message, confirmButtonColor: '#3085d6' });
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
