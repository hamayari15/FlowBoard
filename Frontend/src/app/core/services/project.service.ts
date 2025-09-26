import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Project, ProjectPopulated, ProjectCreateRequest, ProjectUpdateRequest, ApiError } from '../models';

@Injectable({
  providedIn: 'root',
})
export class ProjectService {
  private readonly apiUrl = `${environment.apiUrl}/projectRouter`;

  constructor(private http: HttpClient) {}

  addProject(projectData: ProjectCreateRequest): Observable<Project> {
    return this.http.post<Project>(`${this.apiUrl}/Add`, projectData).pipe(
      map((response: any) => response as Project),
      catchError(this.handleError)
    );
  }

  getProjects(): Observable<ProjectPopulated[]> {
    return this.http.get<ProjectPopulated[]>(`${this.apiUrl}/getAll`).pipe(
      map((response: any) => response as ProjectPopulated[]),
      catchError(this.handleError)
    );
  }

  getProjectById(id: string): Observable<ProjectPopulated> {
    if (!id) {
      return throwError(() => new Error('Project ID is required'));
    }

    return this.http.get<ProjectPopulated>(`${this.apiUrl}/getById/${id}`).pipe(
      map((response: any) => response as ProjectPopulated),
      catchError(this.handleError)
    );
  }

  getProjectsByWorkspace(workspaceId: string): Observable<ProjectPopulated[]> {
    if (!workspaceId) {
      return throwError(() => new Error('Workspace ID is required'));
    }

    return this.http.get<ProjectPopulated[]>(`${this.apiUrl}/getByWorkspace/${workspaceId}`).pipe(
      map((response: any) => response as ProjectPopulated[]),
      catchError(this.handleError)
    );
  }

  updateProject(id: string, projectData: ProjectUpdateRequest): Observable<Project> {
    if (!id) {
      return throwError(() => new Error('Project ID is required'));
    }

    return this.http.put<Project>(`${this.apiUrl}/Update/${id}`, projectData).pipe(
      map((response: any) => response as Project),
      catchError(this.handleError)
    );
  }

  archiveProject(id: string): Observable<boolean> {
    if (!id) {
      return throwError(() => new Error('Project ID is required'));
    }

    return this.http.patch(`${this.apiUrl}/Archive/${id}`, {}).pipe(
      map(() => true),
      catchError(this.handleError)
    );
  }

  deleteProject(id: string): Observable<boolean> {
    if (!id) {
      return throwError(() => new Error('Project ID is required'));
    }

    return this.http.delete(`${this.apiUrl}/Delete/${id}`).pipe(
      map(() => true),
      catchError(this.handleError)
    );
  }

  private handleError = (error: HttpErrorResponse): Observable<never> => {
    let errorMessage = 'An unknown error occurred';
    let errorStatus = 500;

    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`;
    } else {
      errorStatus = error.status;
      if (error.error?.message) {
        errorMessage = error.error.message;
      } else {
        switch (error.status) {
          case 400:
            errorMessage = 'Bad request. Please check your input.';
            break;
          case 401:
            errorMessage = 'Unauthorized. Please log in.';
            break;
          case 403:
            errorMessage = "Forbidden. You don't have permission.";
            break;
          case 404:
            errorMessage = 'Project not found.';
            break;
          case 409:
            errorMessage = 'Project name already exists.';
            break;
          case 500:
            errorMessage = 'Internal server error. Please try again later.';
            break;
          default:
            errorMessage = `Error: ${error.status} - ${error.statusText}`;
        }
      }
    }

    const apiError: ApiError = {
      message: errorMessage,
      status: errorStatus,
      error: error.error,
    };

    console.error('ProjectService Error:', apiError);
    return throwError(() => apiError);
  };
}
