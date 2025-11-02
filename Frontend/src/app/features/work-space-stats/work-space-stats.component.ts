import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { WorkspaceService } from 'src/app/core/services';
import { ChartOptions, ChartData, ChartConfiguration } from 'chart.js';

interface ProjectStats {
  projectId: string;
  projectName: string;
  projectDescription: string;
  projectStatus: string;
  totalTasks: number;
  completedTasks: number;
  completionPercentage: number;
  overdueTasks: number;
  totalBoards: number;
  statusBreakdown: { [key: string]: number };
  priorityBreakdown: { [key: string]: number };
  tasksByAssignee: { [key: string]: number };
  tasksByDate: { [key: string]: number };
  boardsBreakdown: any[];
  teamMembers: any[];
  owner: string;
  createdAt: string;
}

interface WorkspaceStats {
  workspace: {
    id: string;
    name: string;
    totalMembers: number;
    owner: string;
  };
  overview: {
    totalProjects: number;
    totalBoards: number;
    totalTasks: number;
    completedTasks: number;
    overallCompletionRate: number;
    overdueTasks: number;
  };
  taskStatusCount: { [key: string]: number };
  taskPriorityCount: { [key: string]: number };
  tasksByAssignee: { [key: string]: number };
  projectStatusCount: { [key: string]: number };
  projectProgress: ProjectStats[];
  memberStats: any[];
  tasksByDate: { [key: string]: number };
}

@Component({
  selector: 'app-work-space-stats',
  templateUrl: './work-space-stats.component.html',
  styleUrls: ['./work-space-stats.component.css']
})
export class WorkSpaceStatsComponent implements OnInit {
  workspaceId: string = '';

  stats: WorkspaceStats | null = null;
  loading: boolean = true;
  error: string | null = null;
  selectedProjectIndex: number = 0;

  // Workspace-level Chart data (general overview)
  projectStatusData: ChartData<'pie'> = { labels: [], datasets: [] };
  memberPerformanceData: ChartData<'bar'> = { labels: [], datasets: [] };

  // Project-level Chart data (for selected project)
  projectTaskStatusData: ChartData<'doughnut'> = { labels: [], datasets: [] };
  projectTaskPriorityData: ChartData<'doughnut'> = { labels: [], datasets: [] };
  projectTasksByAssigneeData: ChartData<'bar'> = { labels: [], datasets: [] };
  projectTasksOverTimeData: ChartData<'line'> = { labels: [], datasets: [] };
  projectBoardProgressData: ChartData<'bar'> = { labels: [], datasets: [] };

  // Chart options
  doughnutOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 10,
          font: { size: 11 },
          boxWidth: 12,
          boxHeight: 12
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0,0,0,0.8)',
        padding: 10,
        titleFont: { size: 13, weight: 'bold' },
        bodyFont: { size: 12 },
        callbacks: {
          label: (context) => {
            const label = context.label || '';
            const value = context.parsed || 0;
            const total = (context.dataset.data as number[]).reduce((a, b) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: ${value} (${percentage}%)`;
          }
        }
      }
    }
  };

  pieOptions: ChartOptions<'pie'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 10,
          font: { size: 11 },
          boxWidth: 12,
          boxHeight: 12
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0,0,0,0.8)',
        padding: 10,
        titleFont: { size: 13, weight: 'bold' },
        bodyFont: { size: 12 }
      }
    }
  };

  barOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(0,0,0,0.8)',
        padding: 10,
        titleFont: { size: 13, weight: 'bold' },
        bodyFont: { size: 12 }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
          font: { size: 10 }
        },
        grid: {
          color: 'rgba(0,0,0,0.05)'
        }
      },
      x: {
        ticks: {
          font: { size: 10 },
          maxRotation: 45,
          minRotation: 0
        },
        grid: {
          display: false
        }
      }
    }
  };

  lineOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(0,0,0,0.8)',
        padding: 10,
        mode: 'index',
        intersect: false
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
          font: { size: 10 }
        },
        grid: {
          color: 'rgba(0,0,0,0.05)'
        }
      },
      x: {
        ticks: {
          font: { size: 9 },
          maxRotation: 45,
          minRotation: 0
        },
        grid: {
          display: false
        }
      }
    }
  };

  constructor(
    private workspaceService: WorkspaceService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Get workspace ID from route parameters
    this.route.params.subscribe(params => {
      this.workspaceId = params['id'];
      
      if (!this.workspaceId) {
        this.error = 'Workspace ID is required';
        this.loading = false;
        return;
      }
      
      this.loadStats();
    });
  }

  loadStats(): void {
    this.loading = true;
    this.error = null;

    this.workspaceService.getWorkspaceStats(this.workspaceId).subscribe({
      next: (res: WorkspaceStats) => {
        this.stats = res;
        this.prepareChartData(res);
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading workspace stats', err);
        this.error = 'Failed to load workspace statistics. Please try again later.';
        this.loading = false;
      }
    });
  }

  onProjectTabChange(index: number): void {
    this.selectedProjectIndex = index;
    if (this.stats && this.stats.projectProgress[index]) {
      this.prepareProjectChartData(this.stats.projectProgress[index]);
    }
  }

  prepareChartData(data: WorkspaceStats): void {
    // Prepare workspace-level charts
    this.prepareWorkspaceCharts(data);
    
    // Prepare first project charts if projects exist
    if (data.projectProgress && data.projectProgress.length > 0) {
      this.prepareProjectChartData(data.projectProgress[0]);
    }
  }

  prepareWorkspaceCharts(data: WorkspaceStats): void {
    // Project Status Chart
    if (Object.keys(data.projectStatusCount).length > 0) {
      const projectStatusColors: { [key: string]: string } = {
        'active': '#10b981',
        'completed': '#3b82f6',
        'on-hold': '#f59e0b'
      };

      this.projectStatusData = {
        labels: Object.keys(data.projectStatusCount).map(s => this.formatLabel(s)),
        datasets: [{
          data: Object.values(data.projectStatusCount),
          backgroundColor: Object.keys(data.projectStatusCount).map(s => 
            projectStatusColors[s] || '#94a3b8'
          ),
          borderWidth: 2,
          borderColor: '#ffffff'
        }]
      };
    }

    // Member Performance Chart (across all projects)
    if (data.memberStats && data.memberStats.length > 0) {
      const topMembers = data.memberStats
        .sort((a, b) => b.assignedTasks - a.assignedTasks)
        .slice(0, 8);

      this.memberPerformanceData = {
        labels: topMembers.map(m => m.memberName),
        datasets: [
          {
            label: 'Completed',
            data: topMembers.map(m => m.completedTasks),
            backgroundColor: '#10b981',
            borderRadius: 6
          },
          {
            label: 'In Progress',
            data: topMembers.map(m => m.assignedTasks - m.completedTasks),
            backgroundColor: '#f59e0b',
            borderRadius: 6
          }
        ]
      };
    }
  }

  prepareProjectChartData(project: ProjectStats): void {
    const statusColors: { [key: string]: string } = {
      'to-do': '#6366f1',
      'in-progress': '#f59e0b',
      'done': '#10b981',
      'blocked': '#ef4444',
      'review': '#8b5cf6'
    };

    const priorityColors: { [key: string]: string } = {
      'low': '#10b981',
      'medium': '#f59e0b',
      'high': '#ef4444'
    };

    // Reset all charts to empty state first
    this.projectTaskStatusData = { labels: [], datasets: [] };
    this.projectTaskPriorityData = { labels: [], datasets: [] };
    this.projectTasksByAssigneeData = { labels: [], datasets: [] };
    this.projectTasksOverTimeData = { labels: [], datasets: [] };
    this.projectBoardProgressData = { labels: [], datasets: [] };

    // Project Task Status Chart
    if (project.statusBreakdown && Object.keys(project.statusBreakdown).length > 0) {
      this.projectTaskStatusData = {
        labels: Object.keys(project.statusBreakdown).map(s => this.formatLabel(s)),
        datasets: [{
          data: Object.values(project.statusBreakdown),
          backgroundColor: Object.keys(project.statusBreakdown).map(s => 
            statusColors[s] || '#94a3b8'
          ),
          borderWidth: 2,
          borderColor: '#ffffff'
        }]
      };
    }

    // Project Task Priority Chart
    if (project.priorityBreakdown && Object.keys(project.priorityBreakdown).length > 0) {
      this.projectTaskPriorityData = {
        labels: Object.keys(project.priorityBreakdown).map(p => this.formatLabel(p)),
        datasets: [{
          data: Object.values(project.priorityBreakdown),
          backgroundColor: Object.keys(project.priorityBreakdown).map(p => 
            priorityColors[p] || '#94a3b8'
          ),
          borderWidth: 2,
          borderColor: '#ffffff'
        }]
      };
    }

    // Project Tasks by Assignee Chart
    if (project.tasksByAssignee && Object.keys(project.tasksByAssignee).length > 0) {
      // Filter out entries with 0 count
      const assigneeEntries = Object.entries(project.tasksByAssignee)
        .filter(([, count]) => count > 0)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);

      if (assigneeEntries.length > 0) {
        this.projectTasksByAssigneeData = {
          labels: assigneeEntries.map(([name]) => name),
          datasets: [{
            label: 'Tasks Assigned',
            data: assigneeEntries.map(([, count]) => count),
            backgroundColor: '#6366f1',
            borderColor: '#4f46e5',
            borderWidth: 1,
            borderRadius: 6
          }]
        };
      }
    }

    // Project Tasks Over Time Chart
    if (project.tasksByDate && Object.keys(project.tasksByDate).length > 0) {
      const sortedDates = Object.keys(project.tasksByDate).sort();
      
      if (sortedDates.length > 0) {
        this.projectTasksOverTimeData = {
          labels: sortedDates.map(date => this.formatDate(date)),
          datasets: [{
            label: 'Tasks Created',
            data: sortedDates.map(date => project.tasksByDate[date]),
            borderColor: '#6366f1',
            backgroundColor: 'rgba(99, 102, 241, 0.1)',
            tension: 0.4,
            fill: true,
            pointRadius: 4,
            pointBackgroundColor: '#6366f1',
            pointBorderColor: '#ffffff',
            pointBorderWidth: 2
          }]
        };
      }
    }

    // Board Progress Chart
    if (project.boardsBreakdown && project.boardsBreakdown.length > 0) {
      // Only show boards that have tasks
      const boardsWithTasks = project.boardsBreakdown.filter(b => b.totalTasks > 0);
      
      if (boardsWithTasks.length > 0) {
        this.projectBoardProgressData = {
          labels: boardsWithTasks.map(b => b.boardName),
          datasets: [
            {
              label: 'Completed',
              data: boardsWithTasks.map(b => b.completedTasks),
              backgroundColor: '#10b981',
              borderRadius: 6
            },
            {
              label: 'In Progress',
              data: boardsWithTasks.map(b => b.totalTasks - b.completedTasks),
              backgroundColor: '#f59e0b',
              borderRadius: 6
            }
          ]
        };
      }
    }
  }

  formatLabel(text: string): string {
    return text.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  getProgressColor(percentage: number): string {
    if (percentage >= 75) return '#10b981';
    if (percentage >= 50) return '#3b82f6';
    if (percentage >= 25) return '#f59e0b';
    return '#ef4444';
  }

  getStatusBadgeClass(status: string): string {
    const statusMap: { [key: string]: string } = {
      'active': 'status-active',
      'completed': 'status-completed',
      'on-hold': 'status-on-hold'
    };
    return statusMap[status] || 'status-default';
  }
}
