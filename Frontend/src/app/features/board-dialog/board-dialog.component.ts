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
  isSprint = false;
  minStartDate = new Date();
  private initialFormValue: { name: string; description: string; goal: string; startDate: string; endDate: string; status: string } | null = null;

  statusOptions = [
    { value: 'planning', label: 'Planning', icon: 'event_note', color: '#ff9800' },
    { value: 'active', label: 'Active', icon: 'play_circle', color: '#4caf50' },
    { value: 'completed', label: 'Completed', icon: 'check_circle', color: '#2196f3' },
    { value: 'archived', label: 'Archived', icon: 'archive', color: '#757575' }
  ];

  constructor(
    private fb: FormBuilder,
    private boardService: BoardService,
    public dialogRef: MatDialogRef<BoardDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.mode = data.mode || 'add';
    this.isSprint = data.isSprint || false;

    this.boardForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100), this.noWhitespaceValidator]],
      description: ['', [Validators.maxLength(500)]],
      goal: ['', [Validators.maxLength(500)]],
      startDate: [''],
      endDate: [''],
      status: ['planning']
    });
  }

  ngOnInit(): void {
    if (this.mode === 'edit' && this.data.board) {
      this.boardForm.patchValue({
        name: this.data.board.name,
        description: this.data.board.description || '',
        goal: this.data.board.goal || '',
        startDate: this.data.board.startDate || '',
        endDate: this.data.board.endDate || '',
        status: this.data.board.status || 'planning'
      });

      this.initialFormValue = {
        name: (this.data.board.name || '').trim(),
        description: (this.data.board.description || '').trim(),
        goal: (this.data.board.goal || '').trim(),
        startDate: this.normalizeDate(this.data.board.startDate),
        endDate: this.normalizeDate(this.data.board.endDate),
        status: this.data.board.status || 'planning'
      };
    }
  }

  private normalizeDate(value: any): string {
    if (!value) return '';
    const d = new Date(value);
    return isNaN(d.getTime()) ? '' : d.toDateString();
  }

  get hasChanges(): boolean {
    if (this.mode !== 'edit' || !this.initialFormValue) return true;

    const formValue = this.boardForm.value;
    const current = {
      name: (formValue.name || '').trim(),
      description: (formValue.description || '').trim(),
      goal: (formValue.goal || '').trim(),
      startDate: this.normalizeDate(formValue.startDate),
      endDate: this.normalizeDate(formValue.endDate),
      status: formValue.status || 'planning'
    };

    if (current.name !== this.initialFormValue.name || current.description !== this.initialFormValue.description) {
      return true;
    }

    if (!this.isSprint) return false;

    return (
      current.goal !== this.initialFormValue.goal ||
      current.startDate !== this.initialFormValue.startDate ||
      current.endDate !== this.initialFormValue.endDate ||
      current.status !== this.initialFormValue.status
    );
  }

  get isFormValid(): boolean {
    return this.boardForm.valid && !this.loading && this.hasChanges;
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

    if (this.isSprint) {
      boardData.goal = formValue.goal?.trim() || undefined;
      boardData.startDate = formValue.startDate || undefined;
      boardData.endDate = formValue.endDate || undefined;
      boardData.status = formValue.status || 'planning';
    }

    this.boardService.createBoard(boardData).subscribe({
      next: (board: Board) => {
        this.loading = false;
        this.data.board = board;
        Swal.fire({
          icon: 'success',
          title: 'Sprint Created!',
          text: 'New sprint has been created successfully',
          showConfirmButton: true
        });
        this.dialogRef.close(board);
      },
      error: (error: ApiError) => {
        this.loading = false;
        this.showErrorAlert('Creation Failed', error.message || 'Failed to create ' + (this.isSprint ? 'sprint' : 'board'));
      }
    });
  }

  private updateBoard(formValue: any): void {
    if (!this.data.board?._id) return;

    const boardData: BoardUpdateRequest = {
      name: formValue.name.trim(),
      description: formValue.description?.trim() || undefined
    };

    if (this.isSprint) {
      boardData.goal = formValue.goal?.trim() || undefined;
      boardData.startDate = formValue.startDate || undefined;
      boardData.endDate = formValue.endDate || undefined;
      boardData.status = formValue.status || 'planning';
    }

    this.boardService.updateBoard(this.data.board._id, boardData).subscribe({
      next: (board: Board) => {
        this.loading = false;
        Swal.fire({
          icon: 'success',
          title: 'Sprint Updated!',
          text: 'Sprint updated successfully',
          timer: 2000,
          showConfirmButton: false
        });
        this.dialogRef.close(board);
      },
      error: (error: ApiError) => {
        this.loading = false;
        this.showErrorAlert('Update Failed', error.message || 'Failed to update ' + (this.isSprint ? 'sprint' : 'board'));
      }
    });
  }

  get selectedStatus() {
    return this.statusOptions.find(s => s.value === this.boardForm.get('status')?.value);
  }

  private showErrorAlert(title: string, message: string): void {
    Swal.fire({ icon: 'error', title, text: message, confirmButtonColor: '#3085d6' });
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}