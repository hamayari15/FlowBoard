import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Comment, CommentCreateRequest, CommentUpdateRequest, ApiError } from '../models';

@Injectable({
  providedIn: 'root'
})
export class CommentService {
  private readonly apiUrl = `${environment.apiUrl}/commentRouter`;

  constructor(private http: HttpClient) {}

  createComment(commentData: CommentCreateRequest): Observable<Comment> {
    return this.http.post<Comment>(`${this.apiUrl}/Add`, commentData).pipe(
      map((response: any) => response as Comment),
      catchError(this.handleError)
    );
  }

  getComments(): Observable<Comment[]> {
    return this.http.get<Comment[]>(`${this.apiUrl}/getAll`).pipe(
      map((response: any) => response as Comment[]),
      catchError(this.handleError)
    );
  }

  getCommentById(id: string): Observable<Comment> {
    if (!id) {
      return throwError(() => new Error('Comment ID is required'));
    }

    return this.http.get<Comment>(`${this.apiUrl}/getById/${id}`).pipe(
      map((response: any) => response as Comment),
      catchError(this.handleError)
    );
  }

  getCommentsByTask(taskId: string): Observable<Comment[]> {
    if (!taskId) {
      return throwError(() => new Error('Task ID is required'));
    }

    return this.http.get<Comment[]>(`${this.apiUrl}/getByTask/${taskId}`).pipe(
      map((response: any) => response as Comment[]),
      catchError(this.handleError)
    );
  }

  updateComment(id: string, commentData: CommentUpdateRequest): Observable<Comment> {
    if (!id) {
      return throwError(() => new Error('Comment ID is required'));
    }

    return this.http.put<Comment>(`${this.apiUrl}/Update/${id}`, commentData).pipe(
      map((response: any) => response as Comment),
      catchError(this.handleError)
    );
  }

  deleteComment(id: string): Observable<boolean> {
    if (!id) {
      return throwError(() => new Error('Comment ID is required'));
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
            errorMessage = 'Comment not found.';
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

    console.error('CommentService Error:', apiError);
    return throwError(() => apiError);
  };
}