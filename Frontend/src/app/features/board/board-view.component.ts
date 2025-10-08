import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import Swal from 'sweetalert2';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { BoardService } from 'src/app/core/services/board.service';
import { TaskService } from 'src/app/core/services/task.service';
import { Board, BoardColumn, TaskPopulated, getColumnId } from 'src/app/core/models';
import { TaskDialogComponent } from './task-dialog/task-dialog.component';
import { TaskDetailDialogComponent } from './task-detail-dialog/task-detail-dialog.component';

interface ColumnWithTasks extends BoardColumn {
  id: string;
  tasks: TaskPopulated[];
}

@Component({
  selector: 'app-board-view',
  templateUrl: './board-view.component.html',
  styleUrls: ['./board-view.component.css']
})
export class BoardViewComponent implements OnInit, OnDestroy {
  boardId: string = '';
  board: Board | null = null;
  columnsWithTasks: ColumnWithTasks[] = [];
  connectedDropLists: string[] = [];
  loading = true;
  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private boardService: BoardService,
    private taskService: TaskService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.boardId = this.route.snapshot.paramMap.get('boardId') || '';
    if (this.boardId) {
      this.loadBoardData();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadBoardData(): void {
    this.loading = true;
    
    this.boardService.getBoardById(this.boardId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (board) => {
          this.board = board;
          this.loadTasks();
        },
        error: (error) => {
          console.error('Error loading board:', error);
          Swal.fire('Error', 'Failed to load board', 'error');
          this.loading = false;
        }
      });
  }

  loadTasks(): void {
    this.taskService.getTasksByBoard(this.boardId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (tasks: any[]) => {
          this.organizeTasks(tasks);
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading tasks:', error);
          Swal.fire('Error', 'Failed to load tasks', 'error');
          this.loading = false;
        }
      });
  }

  organizeTasks(tasks: TaskPopulated[]): void {
    if (!this.board) return;

    this.columnsWithTasks = this.board.columns.map(column => {
      const columnId = getColumnId(column);
      return {
        ...column,
        id: columnId,
        tasks: tasks
          .filter(task => task.status === columnId)
          .sort((a, b) => a.position - b.position)
      };
    });

    // Update connected drop lists for drag and drop
    this.connectedDropLists = this.columnsWithTasks.map(col => col.id);
  }

  onDrop(event: CdkDragDrop<TaskPopulated[]>, columnId: string): void {
    if (event.previousContainer === event.container) {
      // Reordering within the same column
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
      this.updateTaskPositions(event.container.data, columnId);
    } else {
      // Moving to a different column
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
      
      // Update the moved task's status
      const movedTask = event.container.data[event.currentIndex];
      if (movedTask._id) {
        this.taskService.updateTask(movedTask._id, { status: columnId })
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            error: (error) => {
              console.error('Error updating task status:', error);
              Swal.fire('Error', 'Failed to move task', 'error');
              this.loadTasks(); // Reload to reset state
            }
          });
      }
      
      // Update positions for both columns
      this.updateTaskPositions(event.previousContainer.data, event.previousContainer.id);
      this.updateTaskPositions(event.container.data, columnId);
    }
  }

  updateTaskPositions(tasks: TaskPopulated[], columnId: string): void {
    const updates = tasks.map((task, index) => ({
      id: task._id!,
      position: index,
      status: columnId
    }));

    // Update positions on the backend
    tasks.forEach((task, index) => {
      if (task._id) {
        this.taskService.updateTask(task._id, { 
          position: index,
          status: columnId 
        }).pipe(takeUntil(this.destroy$)).subscribe({
          error: (error) => console.error('Error updating task position:', error)
        });
      }
    });
  }

  openCreateTaskDialog(columnId: string): void {
    const dialogRef = this.dialog.open(TaskDialogComponent, {
      width: '600px',
      data: {
        mode: 'create',
        boardId: this.boardId,
        projectId: this.board?.project,
        status: columnId,
        board: this.board
      }
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => {
        if (result) {
          this.loadTasks();
        }
      });
  }

  openTaskDetail(task: TaskPopulated): void {
    const dialogRef = this.dialog.open(TaskDetailDialogComponent, {
      width: '600px',
      data: {
        task,
        board: this.board
      }
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => {
        if (result?.updated || result?.deleted) {
          this.loadTasks();
        }
      });
  }

  deleteTask(task: TaskPopulated, event: Event): void {
    event.stopPropagation();
    
    Swal.fire({
      title: 'Delete Task?',
      text: `Are you sure you want to delete "${task.title}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!',
      reverseButtons: true
    }).then((result) => {
      if (result.isConfirmed && task._id) {
        this.taskService.deleteTask(task._id)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              Swal.fire('Deleted!', 'Task has been deleted.', 'success');
              this.loadTasks();
            },
            error: (error) => {
              console.error('Error deleting task:', error);
              Swal.fire('Error', 'Failed to delete task', 'error');
            }
          });
      }
    });
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

  getAssigneeTooltip(assignee: any): string {
    if (!assignee) return '';
    return `${assignee.firstName} ${assignee.lastName}`;
  }

  goBack(): void {
    this.router.navigate(['/workSpaces-list']);
  }

  getColumnId(column: ColumnWithTasks): string {
    return column.id;
  }

};
