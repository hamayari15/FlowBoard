import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { User, UserProfile, UserUpdateRequest, ApiError } from '../models';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly apiUrl = `${environment.apiUrl}/userRouter`;

  constructor(private http: HttpClient) {}

  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/getAll`).pipe(
      map((response: any) => response as User[]),
      catchError(this.handleError)
    );
  }

  getUserById(id: string): Observable<User> {
    if (!id) {
      return throwError(() => new Error('User ID is required'));
    }

    return this.http.get<User>(`${this.apiUrl}/getById/${id}`).pipe(
      map((response: any) => response as User),
      catchError(this.handleError)
    );
  }

  getUserProfile(id: string): Observable<UserProfile> {
    if (!id) {
      return throwError(() => new Error('User ID is required'));
    }

    return this.http.get<UserProfile>(`${this.apiUrl}/profile/${id}`).pipe(
      map((response: any) => {
        const user = response as User;
        return {
          ...user,
          fullName: `${user.firstName} ${user.lastName}`
        } as UserProfile;
      }),
      catchError(this.handleError)
    );
  }

  updateUser(id: string, userData: UserUpdateRequest): Observable<User> {
    if (!id) {
      return throwError(() => new Error('User ID is required'));
    }

    return this.http.put<User>(`${this.apiUrl}/update/${id}`, userData).pipe(
      map((response: any) => response as User),
      catchError(this.handleError)
    );
  }

  deleteUser(id: string): Observable<boolean> {
    if (!id) {
      return throwError(() => new Error('User ID is required'));
    }

    return this.http.delete(`${this.apiUrl}/delete/${id}`).pipe(
      map(() => true),
      catchError(this.handleError)
    );
  }

  searchUsers(query: string): Observable<User[]> {
    if (!query) {
      return throwError(() => new Error('Search query is required'));
    }

    return this.http.get<User[]>(`${this.apiUrl}/search?q=${encodeURIComponent(query)}`).pipe(
      map((response: any) => response as User[]),
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
            errorMessage = 'User not found.';
            break;
          case 409:
            errorMessage = 'User already exists.';
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

    console.error('UserService Error:', apiError);
    return throwError(() => apiError);
  };
}