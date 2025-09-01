import { Component, OnInit } from '@angular/core';
import { WorkspaceService } from 'src/app/core/services/workspace.service';
import Swal from 'sweetalert2';
import { MatDialog } from '@angular/material/dialog';
import { WorkSpaceDialogComponent } from '../work-space-dialog/work-space-dialog.component';
import { Router } from '@angular/router';

@Component({
  selector: 'app-work-spaces-list',
  templateUrl: './work-spaces-list.component.html',
  styleUrls: ['./work-spaces-list.component.css']
})
export class WorkspaceListComponent implements OnInit {

  workSpaces: any = [];

  constructor(
    private wsService: WorkspaceService,
    private router: Router,
    private dialog: MatDialog
  ) {}

  ngOnInit() {
    this.getAllWorkSpaces();
  }

  getAllWorkSpaces() {
    this.wsService.getWorkSpaces().subscribe({
      next: (res) => { this.workSpaces = res; },
      error: (err) => { console.error('Error fetching workspaces', err); }
    });
  }

  goToDetails(id: any) {
    this.router.navigate(['/workSpace-details', id]);
  }

  openAddDialog() {
    const dialogRef = this.dialog.open(WorkSpaceDialogComponent, {
      width: '500px',
      data: { mode: 'add', workspace: null }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) this.getAllWorkSpaces();
    });
  }

  openEditDialog(ws: any) {
    const dialogRef = this.dialog.open(WorkSpaceDialogComponent, {
      width: '500px',
      data: { mode: 'edit', workspace: ws }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) this.getAllWorkSpaces();
    });
  }

  delete(id: string) {
    Swal.fire({
      icon: 'warning',
      title: 'Are you sure?',
      text: 'You wont be able to revert this !',
      confirmButtonText: 'Yes, delete it!',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      reverseButtons: true
    }).then((result) => {
      if(result.isConfirmed) {
        this.wsService.deleteWorkSpace(id).subscribe({
          next: () => {
            Swal.fire('Deleted!', 'Workspace has been deleted.', 'success');
            this.getAllWorkSpaces();
          },
          error: (err) => {
            console.error('Error deleting workspace', err);
            Swal.fire('Error', 'Failed to delete workspace', 'error');
          }
        });
      }
    });
  }
}
