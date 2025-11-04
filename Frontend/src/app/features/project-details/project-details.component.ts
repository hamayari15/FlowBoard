import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import Swal from 'sweetalert2';
import { ProjectService } from 'src/app/core/services/project.service';
import { BoardService } from 'src/app/core/services/board.service';
import { ProjectPopulated, Board } from 'src/app/core/models';
import { ProjectDialogComponent } from '../project-dialog/project-dialog.component';
import { ProjectInviteDialogComponent } from '../project-invite-dialog/project-invite-dialog.component';
import { BoardDialogComponent } from '../board-dialog/board-dialog.component';

@Component({
  selector: 'app-project-details',
  templateUrl: './project-details.component.html',
  styleUrls: ['./project-details.component.css'],
})
export class ProjectDetailsComponent implements OnInit {
  projectId: string = '';
  projectData: ProjectPopulated = {} as ProjectPopulated;
  loading = true;
  sprints: Board[] = [];
  sprintsLoading = false;
  selectedFilter: 'all' | 'planning' | 'active' | 'completed' | 'archived' = 'all';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private projectService: ProjectService,
    private boardService: BoardService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.projectId = this.route.snapshot.paramMap.get('id') || '';
    if (this.projectId) {
      this.getProjectById(this.projectId);
      this.loadSprints();
    }
  }

  getProjectById(id: string) {
    this.loading = true;
    this.projectService.getProjectById(id).subscribe({
      next: (data) => {
        this.projectData = data;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        Swal.fire('Error', 'Failed to load project', 'error');
      },
    });
  }

  goBackToWorkspace() {
    this.router.navigate([
      `/workSpace-details/${this.projectData.workspace?._id}`,
    ]);
  }

  openProjectInviteDialog() {
    const dialogRef = this.dialog.open(ProjectInviteDialogComponent, {
      width: '600px',
      data: {
        projectId: this.projectId,
        projectName: this.projectData.name,
        type: 'project',
      },
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result?.success) this.getProjectById(this.projectId);
    });
  }

  openEditProjectDialog(project: ProjectPopulated) {
    const dialogRef = this.dialog.open(ProjectDialogComponent, {
      width: '550px',
      data: { mode: 'edit', project },
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) this.getProjectById(this.projectId);
    });
  }

  getMembersCount() {
    return this.projectData.members?.length || 0;
  }

  archiveProject(project: ProjectPopulated) {
    Swal.fire({
      icon: 'question',
      title: 'Archive Project',
      text: `Are you sure you want to archive "${project.name}"?`,
      showCancelButton: true,
      confirmButtonColor: '#ff9800',
      cancelButtonColor: '#3085d6',
      reverseButtons: true,
      confirmButtonText: 'Yes, archive it!',
    }).then((result) => {
      if (result.isConfirmed && project._id) {
        this.projectService.toggleArchiveProject(project._id).subscribe({
          next: () => {
            Swal.fire({
              icon: 'success',
              title: 'Archived !',
              text: 'Project archived successfully.',
              timer: 2000,
              showConfirmButton: false,
            });
            this.getProjectById(this.projectId);
          },
          error: () => Swal.fire('Error', 'Failed to archive project', 'error'),
        });
      }
    });
  }

  deleteProject(project: ProjectPopulated) {
    Swal.fire({
      icon: 'warning',
      title: 'Are you sure?',
      text: 'You wont be able to revert this action!',
      confirmButtonText: 'Yes, delete it!',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      reverseButtons: true,
    }).then((result) => {
      if (result.isConfirmed && project._id) {
        this.projectService.deleteProject(project._id).subscribe({
          next: () => {
            Swal.fire({
              icon: 'success',
              title: 'Deleted !',
              text: 'Project deleted successfully.',
              timer: 2000,
              showConfirmButton: false,
            });
            this.goBackToWorkspace();
          },
          error: () => Swal.fire('Error', 'Failed to delete project', 'error'),
        });
      }
    });
  }

  // Sprint management methods
  loadSprints() {
    this.sprintsLoading = true;
    this.boardService.getSprintsByStatus(this.projectId, this.selectedFilter).subscribe({
      next: (sprints) => {
        this.sprints = sprints;
        this.sprintsLoading = false;
      },
      error: () => {
        Swal.fire('Error', 'Failed to load sprints', 'error');
        this.sprintsLoading = false;
      },
    });
  }

  filterSprints(filter: 'all' | 'planning' | 'active' | 'completed' | 'archived') {
    this.selectedFilter = filter;
    this.loadSprints();
  }

  openCreateSprintDialog() {
    const dialogRef = this.dialog.open(BoardDialogComponent, {
      width: '600px',
      data: {
        mode: 'add',
        projectId: this.projectId,
        isSprint: true,
      },
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) this.loadSprints();
    });
  }

  openEditSprintDialog(sprint: Board) {
    const dialogRef = this.dialog.open(BoardDialogComponent, {
      width: '600px',
      data: {
        mode: 'edit',
        board: sprint,
        isSprint: true,
      },
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) this.loadSprints();
    });
  }

  viewSprint(sprint: Board) {
    if (sprint._id) {
      this.router.navigate([`/board/${sprint._id}`]);
    }
  }

  startSprint(sprint: Board, event: Event) {
    event.stopPropagation();
    if (!sprint._id) return;

    Swal.fire({
      icon: 'question',
      title: 'Start Sprint',
      text: `Are you sure you want to start "${sprint.name}"?`,
      showCancelButton: true,
      confirmButtonColor: '#4caf50',
      cancelButtonColor: '#3085d6',
      reverseButtons: true,
      confirmButtonText: 'Yes, start it!',
    }).then((result) => {
      if (result.isConfirmed && sprint._id) {
        this.boardService.startSprint(sprint._id).subscribe({
          next: () => {
            Swal.fire({
              icon: 'success',
              title: 'Sprint Started!',
              text: 'Sprint is now active.',
              timer: 2000,
              showConfirmButton: false,
            });
            this.loadSprints();
          },
          error: () => Swal.fire('Error', 'Failed to start sprint', 'error'),
        });
      }
    });
  }

  completeSprint(sprint: Board, event: Event) {
    event.stopPropagation();
    if (!sprint._id) return;

    Swal.fire({
      icon: 'question',
      title: 'Complete Sprint',
      text: `Are you sure you want to complete "${sprint.name}"?`,
      showCancelButton: true,
      confirmButtonColor: '#2196f3',
      cancelButtonColor: '#3085d6',
      reverseButtons: true,
      confirmButtonText: 'Yes, complete it!',
    }).then((result) => {
      if (result.isConfirmed && sprint._id) {
        this.boardService.completeSprint(sprint._id).subscribe({
          next: () => {
            Swal.fire({
              icon: 'success',
              title: 'Sprint Completed!',
              text: 'Sprint marked as completed.',
              timer: 2000,
              showConfirmButton: false,
            });
            this.loadSprints();
          },
          error: () => Swal.fire('Error', 'Failed to complete sprint', 'error'),
        });
      }
    });
  }

  deleteSprint(sprint: Board, event: Event) {
    event.stopPropagation();
    if (!sprint._id) return;

    Swal.fire({
      icon: 'warning',
      title: 'Delete Sprint',
      text: `Are you sure you want to delete "${sprint.name}"? This will also delete all tasks in this sprint.`,
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      reverseButtons: true,
      confirmButtonText: 'Yes, delete it!',
    }).then((result) => {
      if (result.isConfirmed && sprint._id) {
        this.boardService.deleteBoard(sprint._id).subscribe({
          next: () => {
            Swal.fire({
              icon: 'success',
              title: 'Deleted!',
              text: 'Sprint deleted successfully.',
              timer: 2000,
              showConfirmButton: false,
            });
            this.loadSprints();
          },
          error: () => Swal.fire('Error', 'Failed to delete sprint', 'error'),
        });
      }
    });
  }

  getSprintStatusBadgeClass(status?: string): string {
    switch (status) {
      case 'planning': return 'status-planning';
      case 'active': return 'status-active';
      case 'completed': return 'status-completed';
      case 'archived': return 'status-archived';
      default: return 'status-planning';
    }
  }

  getSprintDuration(sprint: Board): string {
    if (!sprint.startDate || !sprint.endDate) return 'No dates set';
    
    const start = new Date(sprint.startDate);
    const end = new Date(sprint.endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return `${diffDays} days`;
  }

  getSprintProgress(sprint: Board): number {
    if (!sprint.startDate || !sprint.endDate || sprint.status === 'planning') return 0;
    if (sprint.status === 'completed') return 100;
    
    const start = new Date(sprint.startDate);
    const end = new Date(sprint.endDate);
    const today = new Date();
    
    // If hasn't started yet
    if (today < start) return 0;
    // If overdue
    if (today > end) return 100;
    
    const totalDuration = end.getTime() - start.getTime();
    const elapsedDuration = today.getTime() - start.getTime();
    const progress = (elapsedDuration / totalDuration) * 100;
    
    return Math.min(Math.max(Math.round(progress), 0), 100);
  }

  getDaysRemaining(sprint: Board): string {
    if (!sprint.endDate) return 'No end date';
    
    const end = new Date(sprint.endDate);
    const today = new Date();
    const diffTime = end.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'Overdue';
    if (diffDays === 0) return 'Due today';
    if (diffDays === 1) return '1 day left';
    return `${diffDays} days left`;
  }

  isSprintOverdue(sprint: Board): boolean {
    if (!sprint.endDate || sprint.status === 'completed') return false;
    return new Date(sprint.endDate) < new Date();
  }
}
