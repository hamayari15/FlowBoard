import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { WorkspaceService } from 'src/app/core/services/workspace.service';

@Component({
  selector: 'app-edit-work-space',
  templateUrl: './edit-work-space.component.html',
  styleUrls: ['./edit-work-space.component.css']
})
export class EditWorkSpaceComponent {

  workSpaceId: any = ''
  workSpaceData: any = ''

  constructor (private route: ActivatedRoute , private wsService: WorkspaceService, private router: Router) {}

  ngOnInit(): void {
    this.workSpaceId = this.route.snapshot.paramMap.get('id')
    this.getWorkSpaceById(this.workSpaceId)
  }

  getWorkSpaceById(workSpaceId: any) {
    this.wsService.getWorkSpaceById(workSpaceId).subscribe((data) => {
      this.workSpaceData = data
      console.log(this.workSpaceData)
    })
  }

};
