import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import Swal from 'sweetalert2';

import { ProjectService } from 'src/app/core/services/project.service';
import { BoardService } from 'src/app/core/services/board.service';
import { ProjectPopulated, Board } from 'src/app/core/models';
import { BoardDialogComponent } from '../board-dialog/board-dialog.component';
import { ProjectInviteDialogComponent } from '../project-invite-dialog/project-invite-dialog.component';

@Component({
  selector: 'app-project-details',
  templateUrl: './project-details.component.html',
  styleUrls: ['./project-details.component.css']
})
export class ProjectDetailsComponent implements OnInit {

  projectId: string = '';
  projectData: ProjectPopulated | any = {};
  boards: Board[] = [];
  loading = true;
  loadingBoards = true;

  displayedColumns: string[] = [
    'name',
    'description',
    'createdAt',
    'actions',
  ];

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
      this.getBoardsByProject(this.projectId);
    }
  }

  getProjectById(projectId: string) {
    this.loading = true;
    this.projectService.getProjectById(projectId).subscribe({
      next: (data: ProjectPopulated) => {
        this.projectData = data;
        console.log('Project data:', this.projectData);
        this.loading = false;
      },
      error: (error) => {
        console.error('Error fetching project:', error);
        this.loading = false;
        Swal.fire('Error', 'Failed to load project details', 'error');
      },
    });
  }

  getBoardsByProject(projectId: string) {
    this.loadingBoards = true;
    this.boardService.getBoardsByProject(projectId).subscribe({
      next: (boards: Board[]) => {
        this.boards = boards;
        console.log(this.boards);
        this.loadingBoards = false;
      },
      error: (error) => {
        console.error('Error fetching boards:', error);
        this.loadingBoards = false;
        Swal.fire('Error', 'Failed to load boards', 'error');
      },
    });
  }

  openAddBoardDialog() {
    const dialogRef = this.dialog.open(BoardDialogComponent, {
      width: '600px',
      data: {
        mode: 'add',
        projectId: this.projectId,
        board: null,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.refreshBoards();
      }
    });
  }

  openEditBoardDialog(board: Board) {
    const dialogRef = this.dialog.open(BoardDialogComponent, {
      width: '600px',
      data: {
        mode: 'edit',
        projectId: this.projectId,
        board: board,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.refreshBoards();
      }
    });
  }

  deleteBoard(board: Board) {
    Swal.fire({
      icon: 'warning',
      title: 'Are you sure?',
      text: 'You won’t be able to revert this!',
      confirmButtonText: 'Yes, delete it!',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      reverseButtons: true
    }).then((result) => {
      if (result.isConfirmed && board._id) {
        this.boardService.deleteBoard(board._id).subscribe({
          next: () => {
            Swal.fire('Deleted!', 'Board has been deleted.', 'success');
            this.refreshBoards();
          },
          error: (error) => {
            console.error('Error deleting board:', error);
            Swal.fire('Error', 'Failed to delete board', 'error');
          },
        });
      }
    });
  }

  refreshBoards() {
    this.getBoardsByProject(this.projectId);
  }

  goBackToProjects() {
    this.router.navigate(['/workSpaces-list']);
  }

  refreshData() {
    this.getProjectById(this.projectId);
    this.refreshBoards();
  }

  getMembersCount(): number {
    return this.projectData?.members ? this.projectData.members.length : 0;
  }

  openProjectInviteDialog() {
    const dialogRef = this.dialog.open(ProjectInviteDialogComponent, {
      width: '600px',
      data: {
        projectId: this.projectId,
        projectName: this.projectData.name,
        type: 'project'
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result?.success) {
        this.getProjectById(this.projectId);
      }
    });
  }

  viewBoard(board: Board) {
    if (board._id) {
      this.router.navigate(['/board', board._id]);
    }
  }
  
};
