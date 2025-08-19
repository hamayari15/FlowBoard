import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Project {
  _id?: string;
  name: string;
  description?: string;
  workspace: string;
  owner: string;
  members?: string[];
  status: 'active' | 'completed' | 'on-hold';
  isArchived: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

@Injectable({
  providedIn: 'root',
})
export class ProjectService {
  private apiUrl = 'http://localhost:3000/projectRouter';

  constructor(private http: HttpClient) {}

  addProject(projectData: Project): Observable<Project> {
    return this.http.post<Project>(`${this.apiUrl}/Add`, projectData);
  }

  getProjects(): Observable<Project[]> {
    return this.http.get<Project[]>(`${this.apiUrl}/getAll`);
  }

  getProjectById(id: string): Observable<Project> {
    return this.http.get<Project>(`${this.apiUrl}/getById/${id}`);
  }

  getProjectsByWorkspace(workspaceId: string): Observable<Project[]> {
    return this.http.get<Project[]>(
      `${this.apiUrl}/getByWorkspace/${workspaceId}`
    );
  }

  updateProject(
    projectData: Partial<Project>,
    id: string
  ): Observable<Project> {
    return this.http.put<Project>(`${this.apiUrl}/Update/${id}`, projectData);
  }

  archiveProject(id: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/Archive/${id}`, {});
  }

  deleteProject(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/Delete/${id}`);
  }
}
