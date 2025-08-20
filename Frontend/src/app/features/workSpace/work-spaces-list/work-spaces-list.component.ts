import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { WorkspaceService } from 'src/app/core/services/workspace.service';

@Component({
  selector: 'app-work-spaces-list',
  templateUrl: './work-spaces-list.component.html',
  styleUrls: ['./work-spaces-list.component.css']
})
export class WorkspaceListComponent implements OnInit {

  workSpaces: any[] = [];

  constructor(
    private workspaceService: WorkspaceService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.getWorkSpaces();
  }

  getWorkSpaces() {
    this.workspaceService.getWorkSpaces().subscribe({
      next: (res: any) => {
        this.workSpaces = res;
        console.log('WorkSpaces fetched:', res);
      },
      error: (err) => {
        console.error('Error fetching workSpaces:', err);
      }
    });
  }

  navigateToAddWorkspace() {
    this.router.navigate(['/add-workSpace']);
  }

  editWorkspace(workspaceId: any) {
    this.router.navigate(['/edit-workSpace', workspaceId]);
  }

};