import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatTable } from '@angular/material/table';
import { WorkspaceService } from 'src/app/core/services/workspace.service';
import { ProjectService, Project } from 'src/app/core/services/project.service';
import Swal from 'sweetalert2';
import { ProjectDialogComponent } from '../project-dialog/project-dialog.component';

@Component({
  selector: 'app-work-space-details',
  templateUrl: './work-space-details.component.html',
  styleUrls: ['./work-space-details.component.css'],
})
export class WorkSpaceDetailsComponent implements OnInit {
  @ViewChild(MatTable) table!: MatTable<Project>;

  workSpaceId: string = '';
  workSpaceData: any = {};
  projects: Project[] = [];
  loading = true;
  loadingProjects = true;

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
      error: (error) => {
        console.error('Error fetching workspace:', error);
        this.loading = false;
        Swal.fire('Error', 'Failed to load workspace details', 'error');
      },
    });
  }

  getProjectsByWorkspace(workspaceId: string) {
    this.loadingProjects = true;
    this.projectService.getProjectsByWorkspace(workspaceId).subscribe({
      next: (projects: Project[]) => {
        this.projects = projects;
        this.loadingProjects = false;
      },
      error: (error) => {
        console.error('Error fetching projects:', error);
        this.loadingProjects = false;
        Swal.fire('Error', 'Failed to load projects', 'error');
      },
    });
  }

  openAddProjectDialog() {
    const dialogRef = this.dialog.open(ProjectDialogComponent, {
      width: '600px',
      data: {
        mode: 'add',
        workspaceId: this.workSpaceId,
        project: null,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.refreshProjects();
      }
    });
  }

  openEditProjectDialog(project: Project) {
    const dialogRef = this.dialog.open(ProjectDialogComponent, {
      width: '600px',
      data: {
        mode: 'edit',
        workspaceId: this.workSpaceId,
        project: project,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.refreshProjects();
      }
    });
  }

  deleteProject(project: Project) {
    Swal.fire({
      title: 'Are you sure?',
      text: `Do you want to delete the project "${project.name}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!',
    }).then((result) => {
      if (result.isConfirmed && project._id) {
        this.projectService.deleteProject(project._id).subscribe({
          next: () => {
            Swal.fire('Deleted!', 'Project has been deleted.', 'success');
            this.refreshProjects();
          },
          error: (error) => {
            console.error('Error deleting project:', error);
            Swal.fire('Error', 'Failed to delete project', 'error');
          },
        });
      }
    });
  }

  archiveProject(project: Project) {
    Swal.fire({
      title: 'Archive Project',
      text: `Are you sure you want to archive "${project.name}"?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#ff9800',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, archive it!',
    }).then((result) => {
      if (result.isConfirmed && project._id) {
        this.projectService.archiveProject(project._id).subscribe({
          next: () => {
            Swal.fire('Archived!', 'Project has been archived.', 'success');
            this.refreshProjects();
          },
          error: (error) => {
            console.error('Error archiving project:', error);
            Swal.fire('Error', 'Failed to archive project', 'error');
          },
        });
      }
    });
  }

  refreshProjects() {
    this.getProjectsByWorkspace(this.workSpaceId);
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'active':
        return '#4caf50';
      case 'completed':
        return '#2196f3';
      case 'on-hold':
        return '#ff9800';
      default:
        return '#757575';
    }
  }

  getMembersCount(project: Project): number {
    return project.members ? project.members.length : 0;
  }
}
