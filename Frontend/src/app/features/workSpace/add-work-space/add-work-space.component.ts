import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { WorkspaceService } from 'src/app/core/services/workspace.service';

@Component({
  selector: 'app-add-work-space',
  templateUrl: './add-work-space.component.html',
  styleUrls: ['./add-work-space.component.css']
})
export class AddWorkSpaceComponent {

  workspace = {
    name: '',
    description: '',
    owner: ''
  };

  isLoading: boolean = false

  constructor(private workSpaceService: WorkspaceService, private router: Router) {}

  onSubmit() {
    if (!this.workspace.name || !this.workspace.owner) {
      alert('Please fill all fields');
      return;
    }

    this.workSpaceService.addWorkSpace(this.workspace).subscribe({
      next: (res) => {
        console.log('Workspace added:', res);
        this.router.navigate(['/workSpaces-list']);
      },
      error: (err) => {
        console.log(this.workspace);
        console.error(err);
      }
    });
  }

  goBack() {
    this.router.navigate(['/workSpaces-list']);
  }

};
