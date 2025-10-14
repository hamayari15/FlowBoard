import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { User, LoginRequest, LoginResponse, RegisterRequest, RegisterResponse } from '../models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly tokenKey = 'Token';
  private readonly apiUrl = `${environment.apiUrl}/userRouter`;

  private isLoggedInSubject = new BehaviorSubject<boolean>(false);
  public isLoggedIn$ = this.isLoggedInSubject.asObservable();

  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    this.initializeAuth();
  }

  private initializeAuth(): void {
    const token = this.getToken();
    if (token) {
      if (this.isTokenExpired()) {
        this.logout();
        return;
      }
      const user = this.getUserFromToken();
      if (user) {
        this.isLoggedInSubject.next(true);
        this.currentUserSubject.next(user);
      } else {
        this.logout();
      }
    }
  }

  register(registerData: RegisterRequest): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>(`${this.apiUrl}/register`, registerData)
      .pipe(catchError(this.handleError));
  }

  login(loginData: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, loginData)
      .pipe(
        tap((response: LoginResponse) => {
          if (response?.myToken) {
            this.setToken(response.myToken);
            const user = this.getUserFromToken();
            if (user) {
              this.isLoggedInSubject.next(true);
              this.currentUserSubject.next(user);
            }
          } else {
            throw new Error('No token received from server');
          }
        }),
        catchError(this.handleError)
      );
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  private setToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
  }

  getUserFromToken(): User | null {
    const token = this.getToken();
    if (!token) return null;
    try {
      const payload = token.split('.')[1];
      if (!payload) return null;
      const decodedPayload = JSON.parse(atob(payload));
      if (!decodedPayload._id || !decodedPayload.email || !decodedPayload.firstName || !decodedPayload.lastName) {
        return null;
      }
      return {
        _id: decodedPayload._id,
        userName: decodedPayload.userName || '',
        email: decodedPayload.email,
        firstName: decodedPayload.firstName,
        lastName: decodedPayload.lastName,
        exp: decodedPayload.exp
      } as User;
    } catch {
      return null;
    }
  }

  isLoggedIn(): boolean {
    const token = this.getToken();
    if (!token) return false;
    if (this.isTokenExpired()) {
      this.logout();
      return false;
    }
    const user = this.getUserFromToken();
    if (!user) {
      this.logout();
      return false;
    }
    return true;
  }

  isAuthenticated(): boolean {
    return this.isLoggedIn();
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem('redirectUrl');
    this.isLoggedInSubject.next(false);
    this.currentUserSubject.next(null);
  }

  getAndClearRedirectUrl(): string | null {
    const redirectUrl = localStorage.getItem('redirectUrl');
    if (redirectUrl) {
      localStorage.removeItem('redirectUrl');
      return redirectUrl;
    }
    return null;
  }

  isTokenExpired(): boolean {
    const token = this.getToken();
    if (!token) return true;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expiry = payload.exp;
      if (!expiry) return true;
      return Math.floor(new Date().getTime() / 1000) >= expiry;
    } catch {
      return true;
    }
  }

  refreshAuthState(): void {
    if (this.isTokenExpired()) {
      this.logout();
    } else {
      const user = this.getUserFromToken();
      if (user) {
        this.isLoggedInSubject.next(true);
        this.currentUserSubject.next(user);
      } else {
        this.logout();
      }
    }
  }

  debugAuthState(): { tokenExists: boolean; user: User | null } {
    const token = this.getToken();
    const user = token ? this.getUserFromToken() : null;
    return {
      tokenExists: !!token,
      user
    };
  }

  private handleError = (error: HttpErrorResponse): Observable<never> => {
    let errorMessage = 'An unknown error occurred';
    
    // Check if it's a client-side or network error
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Network error: ${error.error.message}`;
    } else if (error.status === 0) {
      // Network error or CORS issue
      errorMessage = 'Unable to connect to server. Please check your internet connection and try again.';
    } else {
      // Backend returned an unsuccessful response code
      if (error.error?.message) {
        // Use the backend's error message
        errorMessage = error.error.message;
      } else if (error.error?.error) {
        // Some APIs return error in different format
        errorMessage = typeof error.error.error === 'string' 
          ? error.error.error 
          : 'An error occurred. Please try again.';
      } else {
        // Fallback to status-based messages
        switch (error.status) {
          case 400:
            errorMessage = 'Invalid request. Please check your input and try again.';
            break;
          case 401:
            errorMessage = 'Invalid email or password. Please try again.';
            break;
          case 403:
            errorMessage = 'Access forbidden. Your account may be deactivated.';
            break;
          case 404:
            errorMessage = 'Service not found. Please contact support if this persists.';
            break;
          case 409:
            errorMessage = 'An account with this email or username already exists.';
            break;
          case 422:
            errorMessage = 'Invalid data provided. Please check your input.';
            break;
          case 429:
            errorMessage = 'Too many requests. Please try again later.';
            break;
          case 500:
            errorMessage = 'Internal server error. Please try again later.';
            break;
          case 503:
            errorMessage = 'Service temporarily unavailable. Please try again later.';
            break;
          default:
            errorMessage = `Unexpected error (${error.status}). Please try again later.`;
        }
      }
    }
    
    console.error('Auth Service Error:', {
      status: error.status,
      message: errorMessage,
      error: error.error
    });
    
    return throwError(() => new Error(errorMessage));
  };
}
