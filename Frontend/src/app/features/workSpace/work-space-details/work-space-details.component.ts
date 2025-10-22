import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import Swal from 'sweetalert2';

import { WorkspaceService } from 'src/app/core/services/workspace.service';
import { ProjectService } from 'src/app/core/services/project.service';
import { ProjectPopulated, WorkspacePopulated } from 'src/app/core/models';
import { WorkSpaceDialogComponent } from '../work-space-dialog/work-space-dialog.component';
import { WorkspaceInviteDialogComponent } from '../workspace-invite-dialog/workspace-invite-dialog.component';
import { ProjectDialogComponent } from '../project-dialog/project-dialog.component';
import { ProjectInviteDialogComponent } from '../project-invite-dialog/project-invite-dialog.component';

@Component({
  selector: 'app-work-space-details',
  templateUrl: './work-space-details.component.html',
  styleUrls: ['./work-space-details.component.css'],
})
export class WorkSpaceDetailsComponent implements OnInit {

  workSpaceId: string = '';
  workSpaceData: any = {};
  projects: ProjectPopulated[] = [];
  filteredProjects: ProjectPopulated[] = [];
  loading = true;
  loadingProjects = true;
  searchTerm: string = '';
  archiveFilter: 'all' | 'archived' | 'active' = 'all';

  displayedColumns: string[] = [
    'name',
    'description',
    'status',
    'members',
    'createdAt',
    'actions',
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private wsService: WorkspaceService,
    private projectService: ProjectService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.workSpaceId = this.route.snapshot.paramMap.get('id') || '';
    if (this.workSpaceId) {
      this.getWorkSpaceById(this.workSpaceId);
      this.getProjectsByWorkspace(this.workSpaceId);
    }
  }

  getWorkSpaceById(workSpaceId: string) {
    this.loading = true;
    this.wsService.getWorkSpaceById(workSpaceId).subscribe({
      next: (data: any) => {
        this.workSpaceData = data;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        Swal.fire('Error', 'Failed to load workspace details', 'error');
      },
    });
  }

  goBackToWorkspaces() {
    this.router.navigate(['/workSpaces-list']);
  }

  goToCharts(id: string) {
    if (id) this.router.navigate(['/workSpace-stats', id]);
  }

  openEditWorkspaceDialog(workspace: WorkspacePopulated) {
    if (!workspace?._id) return;
    const dialogRef = this.dialog.open(WorkSpaceDialogComponent, {
      width: '500px',
      maxWidth: '90vw',
      data: { mode: 'edit', workspace },
      disableClose: true,
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) this.getWorkSpaceById(this.workSpaceId);
    });
  }

  openWorkspaceInviteDialog() {
    const dialogRef = this.dialog.open(WorkspaceInviteDialogComponent, {
      width: '600px',
      data: {
        workspaceId: this.workSpaceId,
        workspaceName: this.workSpaceData.name,
        type: 'workspace'
      },
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.success) this.getWorkSpaceById(this.workSpaceId);
    });
  }

  deleteWorkspace(id: string) {
    if (!id) return;
    Swal.fire({
      icon: 'warning',
      title: 'Are you sure?',
      text: "You won't be able to revert this action !",
      confirmButtonText: 'Yes, delete it !',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      reverseButtons: true,
      showLoaderOnConfirm: true 
    }).then(result => {
      if (result.isConfirmed) {
        this.wsService.deleteWorkSpace(this.workSpaceId).subscribe({
          next: () => {
            Swal.fire({
              icon: 'success',
              title: 'Deleted !',
              text: 'Workspace has been deleted successfully.',
              timer: 2000,
              showConfirmButton: false,
            });
            this.goBackToWorkspaces();
          },
          error: () => Swal.fire('Error', 'Failed to delete workspace', 'error')
        });
      }
    });
  }

  getProjectsByWorkspace(workspaceId: string) {
    this.loadingProjects = true;
    this.projectService.getProjectsByWorkspace(workspaceId).subscribe({
      next: (projects: ProjectPopulated[]) => {
        this.projects = projects;
        this.applyFilters();
        this.loadingProjects = false;
      },
      error: () => {
        this.loadingProjects = false;
        Swal.fire('Error', 'Failed to load projects', 'error');
      },
    });
  }

  searchProjects() {
    this.applyFilters();
  }

  applyFilters() {
    const term = this.searchTerm.toLowerCase();
    this.filteredProjects = this.projects.filter(project => {
      const matchesSearch = project.name.toLowerCase().includes(term);
      const matchesArchive =
        this.archiveFilter === 'all' ||
        (this.archiveFilter === 'archived' && project.isArchived) ||
        (this.archiveFilter === 'active' && !project.isArchived);
      return matchesSearch && matchesArchive;
    });
  }

  setArchiveFilter(filter: 'all' | 'archived' | 'active') {
    this.archiveFilter = filter;
    this.applyFilters();
  }

  goToDetails(id: string) {
    if (!id) return;
    this.router.navigate(['/project-details', id]);
  }

  openAddProjectDialog() {
    const dialogRef = this.dialog.open(ProjectDialogComponent, {
      width: '550px',
      data: { mode: 'add', workspaceId: this.workSpaceId, project: null },
    });
    dialogRef.afterClosed().subscribe(result => { if (result) this.refreshProjects(); });
  }

  openEditProjectDialog(project: ProjectPopulated) {
    const dialogRef = this.dialog.open(ProjectDialogComponent, {
      width: '550px',
      data: { mode: 'edit', workspaceId: this.workSpaceId, project },
    });
    dialogRef.afterClosed().subscribe(result => { if (result) this.refreshProjects(); });
  }

  getStatusColor(status: string) {
    switch (status) {
      case 'active': return '#4caf50';
      case 'completed': return '#2196f3';
      case 'on-hold': return '#ff9800';
      default: return '#757575';
    }
  }

  openProjectInviteDialog(project: ProjectPopulated) {
    const dialogRef = this.dialog.open(ProjectInviteDialogComponent, {
      width: '600px',
      data: { projectId: project._id, projectName: project.name, workspaceName: this.workSpaceData.name, type: 'project' },
    });
    dialogRef.afterClosed().subscribe(result => { if (result?.success) this.refreshProjects(); });
  }

  getMembersCount(project: ProjectPopulated) {
    return project.members?.length || 0;
  }

  archiveProject(project: ProjectPopulated) {
    Swal.fire({
      icon: 'question',
      title: 'Archive Project',
      text: `Are you sure you want to archive "${project.name}" ?`,
      showCancelButton: true,
      confirmButtonColor: '#ff9800',
      cancelButtonColor: '#3085d6',
      reverseButtons: true,
      confirmButtonText: 'Yes, archive it !',
    }).then(result => {
      if (result.isConfirmed && project._id) {
        this.projectService.archiveProject(project._id).subscribe({
          next: () => { Swal.fire({
                      icon: 'success',
                      title: 'Project Archived !',
                      text: 'Project has been archived successfully.',
                      timer: 2000,
                      showConfirmButton: false
                    });   this.refreshProjects(); },
          error: () => Swal.fire('Error', 'Failed to archive project', 'error')
        });
      }
    });
  }

  deleteProject(project: ProjectPopulated) {
    Swal.fire({
      icon: 'warning',
      title: 'Are you sure?',
      text: 'You wont be able to revert this action !',
      confirmButtonText: 'Yes, delete it !',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      reverseButtons: true
    }).then(result => {
      if (result.isConfirmed && project._id) {
        this.projectService.deleteProject(project._id).subscribe({
          next: () => { Swal.fire({
                    icon: 'success',
                    title: 'Deleted !',
                    text: 'Project has been deleted successfully.',
                    timer: 2000,
                    showConfirmButton: false,
                  }); this.refreshProjects(); },
          error: () => Swal.fire('Error', 'Failed to delete project', 'error')
        });
      }
    });
  }

  refreshProjects() {
    this.getProjectsByWorkspace(this.workSpaceId);
  }

  refreshData() {
    this.getWorkSpaceById(this.workSpaceId);
    this.refreshProjects();
  }

}
