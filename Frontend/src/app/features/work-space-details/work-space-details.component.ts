import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { Subject, takeUntil } from 'rxjs';
import Swal from 'sweetalert2';

import { WorkspaceService } from 'src/app/core/services/workspace.service';
import { ProjectService } from 'src/app/core/services/project.service';
import { ProjectPopulated, WorkspacePopulated, ApiError } from 'src/app/core/models';
import { WorkSpaceDialogComponent } from '../work-space-dialog/work-space-dialog.component';
import { WorkspaceInviteDialogComponent } from '../workspace-invite-dialog/workspace-invite-dialog.component';
import { ProjectDialogComponent } from '../project-dialog/project-dialog.component';
import { ProjectInviteDialogComponent } from '../project-invite-dialog/project-invite-dialog.component';

@Component({
  selector: 'app-work-space-details',
  templateUrl: './work-space-details.component.html',
  styleUrls: ['./work-space-details.component.css'],
})
export class WorkSpaceDetailsComponent implements OnInit, OnDestroy {
  workSpaceId = '';
  workSpaceData: WorkspacePopulated | any = {};
  projects: ProjectPopulated[] = [];
  filteredProjects: ProjectPopulated[] = [];
  loading = true;
  loadingProjects = true;
  searchTerm = '';
  archiveFilter: 'all' | 'archived' | 'active' = 'all';
  private destroy$ = new Subject<void>();

  displayedColumns: string[] = ['name', 'description', 'status', 'members', 'createdAt', 'actions'];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private wsService: WorkspaceService,
    private projectService: ProjectService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.workSpaceId = this.route.snapshot.paramMap.get('id') || '';
    if (this.workSpaceId) this.refresh();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  getWorkSpaceById(): void {
    this.loading = true;
    this.wsService.getWorkSpaceById(this.workSpaceId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: data => { this.workSpaceData = data; this.loading = false; },
        error: (err: ApiError) => { this.loading = false; this.showErrorAlert('Failed to load workspace', err.message); }
      });
  }

  getProjectsByWorkspace(): void {
    this.loadingProjects = true;
    this.projectService.getProjectsByWorkspace(this.workSpaceId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: projects => { this.projects = projects; this.applyFilters(); this.loadingProjects = false; },
        error: (err: ApiError) => { this.loadingProjects = false; this.showErrorAlert('Failed to load projects', err.message); }
      });
  }

  searchProjects(): void { this.applyFilters(); }

  applyFilters(): void {
    const term = this.searchTerm.trim().toLowerCase();
    this.filteredProjects = this.projects.filter(project => {
      const matchesSearch = project.name.toLowerCase().includes(term);
      const matchesArchive =
        this.archiveFilter === 'all' ||
        (this.archiveFilter === 'archived' && project.isArchived) ||
        (this.archiveFilter === 'active' && !project.isArchived);
      return matchesSearch && matchesArchive;
    });
  }

  setArchiveFilter(filter: 'all' | 'archived' | 'active'): void {
    this.archiveFilter = filter;
    this.applyFilters();
  }

  goBackToWorkspaces(): void { this.router.navigate(['/workSpaces-list']); }

  goToCharts(id: string): void { if (id) this.router.navigate(['/workSpace-stats', id]); }

  openEditWorkspaceDialog(workspace: WorkspacePopulated): void {
    if (!workspace?._id) return;
    const dialogRef = this.dialog.open(WorkSpaceDialogComponent, { width: '400px', maxWidth: '90vw', data: { mode: 'edit', workspace }, disableClose: true });
    dialogRef.afterClosed().pipe(takeUntil(this.destroy$)).subscribe(result => { if (result) this.getWorkSpaceById(); });
  }

  openWorkspaceInviteDialog(): void {
    const dialogRef = this.dialog.open(WorkspaceInviteDialogComponent, { width: '500px', data: { workspaceId: this.workSpaceId, workspaceName: this.workSpaceData.name, type: 'workspace' } });
    dialogRef.afterClosed().pipe(takeUntil(this.destroy$)).subscribe(result => { if (result?.success) this.getWorkSpaceById(); });
  }

  deleteWorkspace(): void {
    if (!this.workSpaceId) return;
    Swal.fire({
      icon: 'warning', title: 'Are you sure?', text: "You won't be able to revert this action!",
      confirmButtonText: 'Yes, delete it!', showCancelButton: true, confirmButtonColor: '#d33', cancelButtonColor: '#3085d6', reverseButtons: true,
      showLoaderOnConfirm: true,
      preConfirm: () => this.wsService.deleteWorkSpace(this.workSpaceId).pipe(takeUntil(this.destroy$)).toPromise()
        .catch((error: ApiError) => { Swal.showValidationMessage(`Request failed: ${error.message}`); throw error; }),
    }).then(result => {
      if (result.isConfirmed) {
        Swal.fire({ icon: 'success', title: 'Deleted !', text: 'Workspace deleted successfully.', timer: 2000, showConfirmButton: false });
        this.goBackToWorkspaces();
      }
    });
  }

  goToDetails(id: string): void { if (!id) return; this.router.navigate(['/project-details', id]); }

  openAddProjectDialog(): void {
    const dialogRef = this.dialog.open(ProjectDialogComponent, { width: '450px', data: { mode: 'add', workspaceId: this.workSpaceId, project: null } });
    dialogRef.afterClosed().pipe(takeUntil(this.destroy$)).subscribe(result => { if (result) this.refreshProjects(); });
  }

  openEditProjectDialog(project: ProjectPopulated): void {
    const dialogRef = this.dialog.open(ProjectDialogComponent, { width: '450px', data: { mode: 'edit', workspaceId: this.workSpaceId, project } });
    dialogRef.afterClosed().pipe(takeUntil(this.destroy$)).subscribe(result => { if (result) this.refreshProjects(); });
  } 

  openProjectInviteDialog(project: ProjectPopulated): void {
    const dialogRef = this.dialog.open(ProjectInviteDialogComponent, { width: '500px', data: { projectId: project._id, projectName: project.name, workspaceName: this.workSpaceData.name, type: 'project' } });
    dialogRef.afterClosed().pipe(takeUntil(this.destroy$)).subscribe(result => { if (result?.success) this.refreshProjects(); });
  }

  archiveProject(project: ProjectPopulated): void {
    if (!project._id) return;
    const action = project.isArchived ? 'Unarchive' : 'Archive';
    Swal.fire({
      icon: 'question',
      title: `${action} Project`,
      text: `Are you sure you want to ${action.toLowerCase()} "${project.name}"?`,
      confirmButtonText: `Yes, ${action.toLowerCase()} it!`,
      showCancelButton: true, confirmButtonColor: '#ff9800', cancelButtonColor: '#3085d6', reverseButtons: true,
      showLoaderOnConfirm: true,
      preConfirm: () => this.projectService.toggleArchiveProject(project._id!).pipe(takeUntil(this.destroy$)).toPromise()
        .catch(error => { Swal.showValidationMessage(`Request failed: ${error.message}`); throw error; }),
    }).then(result => {
      if (result.isConfirmed) {
        Swal.fire({ icon: 'success', title: `${action}d !`, text: `Project ${action.toLowerCase()}d successfully.`, timer: 2000, showConfirmButton: false });
        this.refreshProjects();
      }
    });
  }

  deleteProject(project: ProjectPopulated): void {
    if (!project._id) return;
    Swal.fire({
      icon: 'warning', title: 'Are you sure?', text: "You won't be able to revert this action!",
      confirmButtonText: 'Yes, delete it!', showCancelButton: true, confirmButtonColor: '#d33', cancelButtonColor: '#3085d6', reverseButtons: true,
      showLoaderOnConfirm: true,
      preConfirm: () => this.projectService.deleteProject(project._id!).pipe(takeUntil(this.destroy$)).toPromise()
        .catch(error => { Swal.showValidationMessage(`Request failed: ${error.message}`); throw error; }),
    }).then(result => {
      if (result.isConfirmed) {
        Swal.fire({ icon: 'success', title: 'Deleted !', text: 'Project deleted successfully.', timer: 2000, showConfirmButton: false });
        this.refreshProjects();
      }
    });
  }

  refreshProjects(): void { this.getProjectsByWorkspace(); }

  refresh(): void {
    this.searchTerm = '';
    this.getWorkSpaceById();
    this.refreshProjects();
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'active': return '#4caf50';
      case 'completed': return '#2f99efff';
      case 'on-hold': return '#ff9800';
      default: return '#757575';
    }
  }

  getMembersCount(project: ProjectPopulated): number { return project.members?.length || 0; }

  private showErrorAlert(title: string, message: string): void {
    Swal.fire({ icon: 'error', title, text: message, confirmButtonColor: '#3085d6' });
  }
}
