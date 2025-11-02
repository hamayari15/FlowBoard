import { Component, Input } from '@angular/core';
import { WorkspaceService } from 'src/app/core/services';
import { ChartOptions, ChartData } from 'chart.js';

@Component({
  selector: 'app-work-space-stats',
  templateUrl: './work-space-stats.component.html',
  styleUrls: ['./work-space-stats.component.css']
})
export class WorkSpaceStatsComponent {
  @Input() workspaceId!: string;

  totalTasks: number = 0;
  taskStatusData: ChartData<'doughnut'> = { labels: [], datasets: [] };
  taskPriorityData: ChartData<'doughnut'> = { labels: [], datasets: [] };
  projectProgress: any[] = [];
  assigneeStats: ChartData<'bar'> = { labels: [], datasets: [] };

  chartOptions: ChartOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
    }
  };

  constructor(private workspaceService: WorkspaceService) {}

  ngOnInit(): void {
    if (!this.workspaceId) return;
    this.loadStats();
  }

  loadStats() {
    this.workspaceService.getWorkspaceStats(this.workspaceId).subscribe({
      next: (res: any) => {
        this.totalTasks = res.totalTasks;
        console.log('Workspace Stats:', res);

        this.taskStatusData = {
          labels: Object.keys(res.taskStatusCount),
          datasets: [
            {
              data: Object.values(res.taskStatusCount),
              backgroundColor: ['#36A2EB', '#FF6384', '#FFCE56', '#4BC0C0']
            }
          ]
        };

        this.taskPriorityData = {
          labels: Object.keys(res.taskPriorityCount),
          datasets: [
            {
              data: Object.values(res.taskPriorityCount),
              backgroundColor: ['#FF6384', '#FFCE56', '#36A2EB']
            }
          ]
        };

        this.projectProgress = res.projectProgress;
      },
      error: (err) => console.error('Error loading workspace stats', err)
    });
  }

};
