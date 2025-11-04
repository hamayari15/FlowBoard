import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Board, User, BoardCreateRequest, BoardUpdateRequest, ApiError } from '../models';

@Injectable({
  providedIn: 'root'
})
export class BoardService {
  private readonly apiUrl = `${environment.apiUrl}/boardRouter`;

  constructor(private http: HttpClient) {}

  createBoard(boardData: BoardCreateRequest): Observable<Board> {
    return this.http.post<Board>(`${this.apiUrl}/Add`, boardData).pipe(
      map((response: any) => response as Board),
      catchError(this.handleError)
    );
  }

  getBoardById(id: string): Observable<Board> {
    if (!id) {
      return throwError(() => new Error('Board ID is required'));
    }

    return this.http.get<Board>(`${this.apiUrl}/getById/${id}`).pipe(
      map((response: any) => response as Board),
      catchError(this.handleError)
    );
  }

  getMembersByBoardId(boardId: string): Observable<User[]> {
    if (!boardId) return throwError(() => new Error('Board ID is required'));

    return this.http.get<User[]>(`${this.apiUrl}/getMembersByBoardId/${boardId}/members`).pipe(
      map((response: any) => response as User[]),
      catchError(this.handleError)
    );
  }

  updateBoard(id: string, boardData: BoardUpdateRequest): Observable<Board> {
    if (!id) {
      return throwError(() => new Error('Board ID is required'));
    }

    return this.http.put<Board>(`${this.apiUrl}/Update/${id}`, boardData).pipe(
      map((response: any) => response as Board),
      catchError(this.handleError)
    );
  }

  deleteBoard(id: string): Observable<boolean> {
    if (!id) {
      return throwError(() => new Error('Board ID is required'));
    }

    return this.http.delete(`${this.apiUrl}/Delete/${id}`).pipe(
      map(() => true),
      catchError(this.handleError)
    );
  }

  // Sprint-specific methods
  getActiveSprints(projectId: string): Observable<Board[]> {
    if (!projectId) {
      return throwError(() => new Error('Project ID is required'));
    }

    return this.http.get<Board[]>(`${this.apiUrl}/active/${projectId}`).pipe(
      map((response: any) => response as Board[]),
      catchError(this.handleError)
    );
  }

  getSprintsByStatus(projectId: string, status: string = 'all'): Observable<Board[]> {
    if (!projectId) {
      return throwError(() => new Error('Project ID is required'));
    }

    return this.http.get<Board[]>(`${this.apiUrl}/status/${projectId}/${status}`).pipe(
      map((response: any) => response as Board[]),
      catchError(this.handleError)
    );
  }

  completeSprint(sprintId: string): Observable<Board> {
    if (!sprintId) {
      return throwError(() => new Error('Sprint ID is required'));
    }

    return this.http.put<Board>(`${this.apiUrl}/complete/${sprintId}`, {}).pipe(
      map((response: any) => response as Board),
      catchError(this.handleError)
    );
  }

  startSprint(sprintId: string): Observable<Board> {
    if (!sprintId) {
      return throwError(() => new Error('Sprint ID is required'));
    }

    return this.http.put<Board>(`${this.apiUrl}/start/${sprintId}`, {}).pipe(
      map((response: any) => response as Board),
      catchError(this.handleError)
    );
  }

  getSprintStats(sprintId: string): Observable<any> {
    if (!sprintId) {
      return throwError(() => new Error('Sprint ID is required'));
    }

    return this.http.get<any>(`${this.apiUrl}/stats/${sprintId}`).pipe(
      map((response: any) => response),
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
            errorMessage = 'Board not found.';
            break;
          case 409:
            errorMessage = 'Board name already exists.';
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

    console.error('BoardService Error:', apiError);
    return throwError(() => apiError);
  };
}