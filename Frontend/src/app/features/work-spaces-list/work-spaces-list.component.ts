import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { Subject, takeUntil } from 'rxjs';
import Swal from 'sweetalert2';
import { WorkspaceService } from 'src/app/core/services/workspace.service';
import { WorkSpaceDialogComponent } from '../work-space-dialog/work-space-dialog.component';
import { WorkspaceInviteDialogComponent } from '../workspace-invite-dialog/workspace-invite-dialog.component';
import { WorkspacePopulated, ApiError } from 'src/app/core/models';
import { AuthService } from 'src/app/core/services/auth.service';

@Component({
  selector: 'app-work-spaces-list',
  templateUrl: './work-spaces-list.component.html',
  styleUrls: ['./work-spaces-list.component.css'],
})
export class WorkspaceListComponent implements OnInit, OnDestroy {
  workSpaces: WorkspacePopulated[] = [];
  filteredWorkSpaces: WorkspacePopulated[] = [];
  searchTerm = '';
  loading = false;
  error: string | null = null;
  private destroy$ = new Subject<void>();
  private currentUserId = '';

  constructor(
    private wsService: WorkspaceService,
    private router: Router,
    private dialog: MatDialog,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.currentUserId = this.authService.getUserFromToken()?._id || '';
    this.getAllWorkSpaces();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  getAllWorkSpaces(): void {
    this.loading = true;
    this.error = null;
    this.wsService.getWorkSpaces()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (workspaces: WorkspacePopulated[]) => {
          this.workSpaces = workspaces?.filter(ws => ws.owner && ws.owner._id.toString() === this.currentUserId || ws.members?.some(member => member._id.toString() === this.currentUserId)) || [];
          this.filteredWorkSpaces = [...this.workSpaces];
          this.loading = false;
        },
        error: (error: ApiError) => {
          this.error = error.message || 'Failed to load workspaces';
          this.loading = false;
          this.showErrorAlert('Failed to Load', this.error);
        },
      });
  }

  searchWorkspaces(): void {
    const term = this.searchTerm.trim().toLowerCase();
    this.filteredWorkSpaces = term
      ? this.workSpaces.filter(ws => ws.name.toLowerCase().includes(term))
      : [...this.workSpaces];
  }

  goToDetails(id: string): void {
    if (id) this.router.navigate(['/workSpace-details', id]);
  }

  goToCharts(id: string): void {
    if (id) this.router.navigate(['/workSpace-stats', id]);
  }

  openAddDialog(): void {
    const dialogRef = this.dialog.open(WorkSpaceDialogComponent, {
      width: '500px',
      maxWidth: '90vw',
      data: { mode: 'add', workspace: null },
      disableClose: true,
    });
    dialogRef.afterClosed().pipe(takeUntil(this.destroy$)).subscribe(result => {
      if (result) this.getAllWorkSpaces();
    });
  }

  openEditDialog(workspace: WorkspacePopulated): void {
    if (!workspace?._id) return;
    const dialogRef = this.dialog.open(WorkSpaceDialogComponent, {
      width: '500px',
      maxWidth: '90vw',
      data: { mode: 'edit', workspace },
      disableClose: true,
    });
    dialogRef.afterClosed().pipe(takeUntil(this.destroy$)).subscribe(result => {
      if (result) this.getAllWorkSpaces();
    });
  }

  openInviteDialog(workspace: WorkspacePopulated): void {
    const dialogRef = this.dialog.open(WorkspaceInviteDialogComponent, {
      width: '600px',
      data: { workspaceId: workspace._id, workspaceName: workspace.name, type: 'workspace' },
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result?.success) this.getAllWorkSpaces();
    });
  }

  delete(id: string): void {
    if (!id) return;
    Swal.fire({
      icon: 'warning',
      title: 'Are you sure?',
      text: "You won't be able to revert this action!",
      confirmButtonText: 'Yes, delete it!',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      reverseButtons: true,
      showLoaderOnConfirm: true,
      preConfirm: () =>
        this.wsService.deleteWorkSpace(id)
          .pipe(takeUntil(this.destroy$))
          .toPromise()
          .catch((error: ApiError) => {
            Swal.showValidationMessage(`Request failed: ${error.message}`);
            throw error;
          }),
    }).then(result => {
      if (result.isConfirmed) {
        Swal.fire({
          icon: 'success',
          title: 'Deleted !',
          text: 'Workspace deleted successfully.',
          timer: 2000,
          showConfirmButton: false,
        });
        this.getAllWorkSpaces();
      }
    });
  }

  refresh(): void {
    this.searchTerm = '';
    this.getAllWorkSpaces();
  }

  trackByWorkspaceId(index: number, workspace: WorkspacePopulated): string {
    return workspace._id || index.toString();
  }

  getMembersTooltip(members: any[]): string {
    if (!members?.length) return 'No members';
    return members.length === 1 ? '1 member' : `${members.length} members`;
  }

  private showErrorAlert(title: string, message: string): void {
    Swal.fire({ icon: 'error', title, text: message, confirmButtonColor: '#3085d6' });
  }
}
