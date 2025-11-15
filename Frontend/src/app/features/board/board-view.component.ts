import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import Swal from 'sweetalert2';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { BoardService } from 'src/app/core/services/board.service';
import { TaskService } from 'src/app/core/services/task.service';
import { BoardDialogComponent } from '../board-dialog/board-dialog.component';
import { Board, BoardColumn, TaskPopulated, getColumnId } from 'src/app/core/models';
import { TaskDialogComponent } from '../task-dialog/task-dialog.component';
import { TaskDetailDialogComponent } from '../task-detail-dialog/task-detail-dialog.component';

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
    if (this.boardId) this.loadBoardData();
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
        error: () => {
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
        error: () => {
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
    this.connectedDropLists = this.columnsWithTasks.map(col => col.id);
  }

  onDrop(event: CdkDragDrop<TaskPopulated[]>, columnId: string): void {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
      this.updateTaskPositions(event.container.data, columnId);
    } else {
      transferArrayItem(event.previousContainer.data, event.container.data, event.previousIndex, event.currentIndex);
      const movedTask = event.container.data[event.currentIndex];
      if (movedTask._id) {
        this.taskService.updateTask(movedTask._id, { status: columnId })
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            error: () => {
              Swal.fire('Error', 'Failed to move task', 'error');
              this.loadTasks();
            }
          });
      }
      this.updateTaskPositions(event.previousContainer.data, event.previousContainer.id);
      this.updateTaskPositions(event.container.data, columnId);
    }
  }

  updateTaskPositions(tasks: TaskPopulated[], columnId: string): void {
    tasks.forEach((task, index) => {
      if (task._id) {
        this.taskService.updateTask(task._id, { position: index, status: columnId })
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            error: () => console.error('Error updating task position')
          });
      }
    });
  }

  openCreateTaskDialog(columnId: string): void {
    const dialogRef = this.dialog.open(TaskDialogComponent, {
      width: '450px',
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
        if (result) this.loadTasks();
      });
  }

  openTaskDetail(task: TaskPopulated): void {
    const dialogRef = this.dialog.open(TaskDetailDialogComponent, {
      width: '550px',
      data: { task, board: this.board }
    });
    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => {
        if (result?.updated || result?.deleted) this.loadTasks();
      });
  }

  deleteTask(task: TaskPopulated, event: Event): void {
    event.stopPropagation();
    Swal.fire({
      title: 'Delete Task?',
      text: 'You wont be able to revert this action!',
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
            Swal.fire({
              icon: 'success',
              title: 'Deleted !',
              text: 'Task deleted successfully.',
              timer: 2000,
              showConfirmButton: false,
            });                
            this.loadTasks();
            },
            error: () => Swal.fire('Error', 'Failed to delete task', 'error')
          });
      }
    });
  }

   openBoardEditDialog(): void {
    if (!this.board) return;
    const dialogRef = this.dialog.open(BoardDialogComponent, {
      width: '450px',
      data: { mode: 'edit', board: this.board, isSprint: true // 🔹 أضف هذا السطر باش يظهرلك goal, dates, status, ...
 }
    });
    dialogRef.afterClosed().pipe(takeUntil(this.destroy$)).subscribe(result => {
      if (result) this.loadBoardData();
    });
  }

  deleteBoard(): void {
    Swal.fire({
      title: 'Are you sure?',
      text: `You won't be able to revert this action!`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      reverseButtons: true,
      confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
      if (result.isConfirmed) {
        this.boardService.deleteBoard(this.boardId)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
            Swal.fire({
              icon: 'success',
              title: 'Deleted !',
              text: 'Sprint deleted successfully.',
              timer: 2000,
              showConfirmButton: false,
            });              
            this.router.navigate(['/project-details']);
            },
            error: () => Swal.fire('Error', 'Failed to delete board', 'error')
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

  getAllAssignees() {
  const assigneesMap = new Map<string, any>();

  this.columnsWithTasks?.forEach(column => {
    column.tasks?.forEach(task => {
      if (task.assignee) {
        const key = task.assignee.email || task.assignee._id || task.assignee.firstName + task.assignee.lastName;
        if (!assigneesMap.has(key)) {
          assigneesMap.set(key, task.assignee);
        }
      }
    });
  });

  return Array.from(assigneesMap.values());
}


  goBack(): void {
    if (this.board?.project) {
      // Navigate back to project details
      const projectId = typeof this.board.project === 'string' 
        ? this.board.project 
        : (this.board.project as any)._id;
      this.router.navigate([`/project-details/${projectId}`]);
    } else {
      this.router.navigate(['/workSpaces-list']);
    }
  }

  getColumnId(column: ColumnWithTasks): string {
    return column.id;
  }

  // Sprint-specific helper methods
  getSprintStatusText(): string {
    if (!this.board?.status) return '';
    return this.board.status.charAt(0).toUpperCase() + this.board.status.slice(1);
  }

  getSprintStatusClass(): string {
    switch (this.board?.status) {
      case 'planning': return 'sprint-status-planning';
      case 'active': return 'sprint-status-active';
      case 'completed': return 'sprint-status-completed';
      case 'archived': return 'sprint-status-archived';
      default: return '';
    }
  }

  getSprintDaysRemaining(): string {
    if (!this.board?.endDate) return '';
    
    const end = new Date(this.board.endDate);
    const today = new Date();
    const diffTime = end.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'Overdue';
    if (diffDays === 0) return 'Due today';
    if (diffDays === 1) return '1 day left';
    return `${diffDays} days left`;
  }

  isSprintOverdue(): boolean {
    if (!this.board?.endDate || this.board.status === 'completed') return false;
    return new Date(this.board.endDate) < new Date();
  }

  hasSprintDates(): boolean {
    return !!(this.board?.startDate || this.board?.endDate);
  }

  getAssigneeIndex(user: any): number {
    const allAssignees = this.getAllAssignees();
    return allAssignees.findIndex(a => a._id === user._id) + 1;
  }

}
