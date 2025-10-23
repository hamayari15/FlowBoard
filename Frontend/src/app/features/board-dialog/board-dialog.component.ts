import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import Swal from 'sweetalert2';

import { BoardService } from 'src/app/core/services/board.service';
import { BoardCreateRequest, BoardUpdateRequest } from 'src/app/core/models';


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
      name: ['', [Validators.required, Validators.minLength(3)]],
      description: ['']
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

  onSubmit(): void {
    if (this.boardForm.invalid) {
      Object.keys(this.boardForm.controls).forEach(key => {
        this.boardForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.loading = true;

    if (this.mode === 'add') {
      this.createBoard();
    } else {
      this.updateBoard();
    }
  }

  createBoard(): void {
    const formValue = this.boardForm.value;
    const boardData: BoardCreateRequest = {
      name: formValue.name,
      description: formValue.description,
      project: this.data.projectId || this.data.project,
      columns: [
        { name: 'To Do', order: 0 },
        { name: 'In Progress', order: 1 },
        { name: 'In Review', order: 2 },
        { name: 'Done', order: 3 }
      ]
    };

    this.boardService.createBoard(boardData).subscribe({
      next: (response) => {
        Swal.fire('Success', 'Board created successfully', 'success');
        this.dialogRef.close(response);
      },
      error: (error) => {
        console.error('Error creating board:', error);
        Swal.fire('Error', error.message || 'Failed to create board', 'error');
        this.loading = false;
      }
    });
  }

  updateBoard(): void {
    const formValue = this.boardForm.value;
    const boardData: BoardUpdateRequest = {
      name: formValue.name,
      description: formValue.description
    };

    this.boardService.updateBoard(this.data.board._id, boardData).subscribe({
      next: (response) => {
        Swal.fire('Success', 'Board updated successfully', 'success');
        this.dialogRef.close(response);
      },
      error: (error) => {
        console.error('Error updating board:', error);
        Swal.fire('Error', error.message || 'Failed to update board', 'error');
        this.loading = false;
      }
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }
  
};
