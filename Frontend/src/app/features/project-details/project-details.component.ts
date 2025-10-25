import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import Swal from 'sweetalert2';
import { ProjectService } from 'src/app/core/services/project.service';
import { ProjectPopulated } from 'src/app/core/models';
import { ProjectDialogComponent } from '../project-dialog/project-dialog.component';
import { ProjectInviteDialogComponent } from '../project-invite-dialog/project-invite-dialog.component';

@Component({
  selector: 'app-project-details',
  templateUrl: './project-details.component.html',
  styleUrls: ['./project-details.component.css'],
})
export class ProjectDetailsComponent implements OnInit {
  projectId: string = '';
  projectData: ProjectPopulated = {} as ProjectPopulated;
  loading = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private projectService: ProjectService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.projectId = this.route.snapshot.paramMap.get('id') || '';
    if (this.projectId) {
      this.getProjectById(this.projectId);
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
}
