import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Task, TaskCreateRequest, TaskUpdateRequest, ApiError } from '../models';

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private readonly apiUrl = `${environment.apiUrl}/taskRouter`;

  constructor(private http: HttpClient) {}

  createTask(taskData: TaskCreateRequest): Observable<Task> {
    return this.http.post<Task>(`${this.apiUrl}/Add`, taskData).pipe(
      map((response: any) => response as Task),
      catchError(this.handleError)
    );
  }



  getTaskById(id: string): Observable<Task> {
    if (!id) {
      return throwError(() => new Error('Task ID is required'));
    }

    return this.http.get<Task>(`${this.apiUrl}/getById/${id}`).pipe(
      map((response: any) => response as Task),
      catchError(this.handleError)
    );
  }

  removeFromBoard(taskId: string): Observable<Task> {
  if (!taskId) {
    return throwError(() => new Error('Task ID is required'));
  }
  return this.http.patch<Task>(`${this.apiUrl}/removeFromBoard/${taskId}`, {}).pipe(
    map((response: any) => response as Task),
    catchError(this.handleError)
  );
}

// Get unassigned tasks (tasks not in any board)
getUnassignedTasks(projectId: string): Observable<Task[]> {
  if (!projectId) {
    return throwError(() => new Error('Project ID is required'));
  }
  return this.http.get<Task[]>(`${this.apiUrl}/getUnassigned/${projectId}`).pipe(
    map((response: any) => response as Task[]),
    catchError(this.handleError)
  );
}

  getTasksByBoard(boardId: string): Observable<Task[]> {
    if (!boardId) {
      return throwError(() => new Error('Board ID is required'));
    }

    return this.http.get<Task[]>(`${this.apiUrl}/getByBoard/${boardId}`).pipe(
      map((response: any) => response as Task[]),
      catchError(this.handleError)
    );
  }

  updateTask(id: string, taskData: TaskUpdateRequest): Observable<Task> {
    if (!id) {
      return throwError(() => new Error('Task ID is required'));
    }

    return this.http.put<Task>(`${this.apiUrl}/Update/${id}`, taskData).pipe(
      map((response: any) => response as Task),
      catchError(this.handleError)
    );
  }

  deleteTask(id: string): Observable<boolean> {
    if (!id) {
      return throwError(() => new Error('Task ID is required'));
    }

    return this.http.delete(`${this.apiUrl}/Delete/${id}`).pipe(
      map(() => true),
      catchError(this.handleError)
    );
  }

  updateTaskPosition(id: string, newPosition: number): Observable<Task> {
    if (!id) {
      return throwError(() => new Error('Task ID is required'));
    }

   return this.http.patch<Task>(`${this.apiUrl}/updatePosition/${id}`, { position: newPosition }).pipe(
  map((response: any) => response as Task),
  catchError(this.handleError)
);

  }

  bulkUpdatePositions(tasks: Array<{ id: string; position: number; status?: string }>): Observable<any> {
    return this.http.post(`${this.apiUrl}/bulkUpdatePositions`, { tasks }).pipe(
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
            errorMessage = 'Task not found.';
            break;
          case 409:
            errorMessage = 'Task conflict occurred.';
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

    console.error('TaskService Error:', apiError);
    return throwError(() => apiError);
  };
}