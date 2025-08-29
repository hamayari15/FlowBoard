import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { WorkspaceService } from 'src/app/core/services/workspace.service';

@Component({
  selector: 'app-work-space-details',
  templateUrl: './work-space-details.component.html',
  styleUrls: ['./work-space-details.component.css']
})
export class WorkSpaceDetailsComponent {

  workSpaceId: any = ''
  workSpaceData: any = []

  constructor (private route: ActivatedRoute, private wsService: WorkspaceService) {}

  ngOnInit(): void {
    this.workSpaceId = this.route.snapshot.paramMap.get('id')
      this.getWorkSpaceById(this.workSpaceId)
    }
    
    getWorkSpaceById(workSpaceId: String) {
      this.wsService.getWorkSpaceById(workSpaceId).subscribe((data: any) => {
        this.workSpaceData = data;
        console.log(this.workSpaceData)
    });
  }

};
