import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Workspace, WorkspacePopulated, WorkspaceCreateRequest, WorkspaceUpdateRequest, ApiError } from '../models';

@Injectable({
  providedIn: 'root',
})
export class WorkspaceService {
  private readonly apiUrl = `${environment.apiUrl}/workSpaceRouter`;

  constructor(private http: HttpClient) {}

  addWorkSpace(workSpaceData: WorkspaceCreateRequest): Observable<Workspace> {
    if (!workSpaceData.name || !workSpaceData.owner) {
      return throwError(() => new Error('Name and owner are required'));
    }

    return this.http.post<Workspace>(`${this.apiUrl}/Add`, workSpaceData).pipe(
      map((response: any) => response as Workspace),
      catchError(this.handleError)
    );
  }

  inviteMember(workspaceId: string, email: string) {
    return this.http.post(`${this.apiUrl}/${workspaceId}/addMember`, {email})
  }

  bulkInviteMembers(workspaceId: string, emails: string[]) {
    return this.http.post(`${this.apiUrl}/${workspaceId}/bulkInvite`, {emails})
  }

  getWorkSpaces(): Observable<WorkspacePopulated[]> {
    return this.http.get<WorkspacePopulated[]>(`${this.apiUrl}/getAll`).pipe(
      map((response: any) => response as WorkspacePopulated[]),
      catchError(this.handleError)
    );
  }

  getWorkSpaceById(id: string): Observable<WorkspacePopulated> {
    if (!id) {
      return throwError(() => new Error('Workspace ID is required'));
    }

    return this.http.get<WorkspacePopulated>(`${this.apiUrl}/getById/${id}`).pipe(
      map((response: any) => response as WorkspacePopulated),
      catchError(this.handleError)
    );
  }

  updateWorkSpace(id: string, newData: WorkspaceUpdateRequest): Observable<Workspace> {
    if (!id) {
      return throwError(() => new Error('Workspace ID is required'));
    }
    return this.http.put<Workspace>(`${this.apiUrl}/Update/${id}`, newData)
      .pipe(
        map((response: any) => response as Workspace),
        catchError(this.handleError)
      );
  }

  deleteWorkSpace(id: string): Observable<boolean> {
    if (!id) {
      return throwError(() => new Error('Workspace ID is required'));
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
            errorMessage = 'Workspace not found.';
            break;
          case 409:
            errorMessage = 'Workspace name already exists.';
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

    console.error('WorkspaceService Error:', apiError);
    return throwError(() => apiError);
  };
}
