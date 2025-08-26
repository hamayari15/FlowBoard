import { Component } from '@angular/core';
import { WorkspaceService } from 'src/app/core/services/workspace.service';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-work-spaces-list',
  templateUrl: './work-spaces-list.component.html',
  styleUrls: ['./work-spaces-list.component.css']
})  
export class WorkspaceListComponent { 

  workSpaces: any = []

  constructor (private wsService: WorkspaceService, private router: Router) {}

  ngOnInit() {
    this.getAllWorkSpaces()
  }

  getAllWorkSpaces(): any {
    this.wsService.getWorkSpaces().subscribe((res) => {
      this.workSpaces = res
      console.log(this.workSpaces)
    })
  }

  goToEdit(id: any) {
    this.router.navigate(['/edit-workSpace', id])
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
            Swal.fire(
              'Deleted !',
              'workSpace has been deleted.',
              'success'
            )
            this.ngOnInit();
          }, 
          error: (err) => {
            console.log('Error deleting workSpace', err);
          }
        })
      }
    })
  }

};