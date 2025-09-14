import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { LoginRequest, LoginResponse, RegisterRequest, RegisterResponse, User } from '../models/auth.model';

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

  /**
   * Initialize authentication state on service creation
   */
  private initializeAuth(): void {
    const token = this.getToken();
    if (token) {
      const user = this.getUserFromToken();
      if (user) {
        this.isLoggedInSubject.next(true);
        this.currentUserSubject.next(user);
      } else {
        // Invalid token, remove it
        // this.logout();
      }
    }
  }

  /**
   * Register new user
   */
  register(registerData: RegisterRequest): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>(`${this.apiUrl}/register`, registerData)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Login user
   */
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
              console.log('✅ User logged in successfully:', user);
            }
          } else {
            console.warn('⚠️ No token received from the server!');
            throw new Error('No token received from server');
          }
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Get stored token
   */
  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  /**
   * Set token in storage
   */
  private setToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
  }

  /**
   * Get user data from token
   */
  getUserFromToken(): User | null {
    const token = this.getToken();
    if (!token) {
      return null;
    }

    try {
      const payload = token.split('.')[1];
      if (!payload) {
        console.error('❌ Invalid token format');
        return null;
      }
      
      const decodedPayload = JSON.parse(atob(payload));
      
      // Validate required user fields
      if (!decodedPayload._id || !decodedPayload.email) {
        console.error('❌ Token missing required user fields');
        return null;
      }
      
      return decodedPayload as User;
    } catch (error) {
      console.error('❌ Failed to decode token:', error);
      return null;
    }
  }

  /**
   * Check if user is logged in
   */
  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  /**
   * Get current user
   */
  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  /**
   * Logout user
   */
  logout(): void {
    localStorage.removeItem(this.tokenKey);
    this.isLoggedInSubject.next(false);
    this.currentUserSubject.next(null);
    console.log('✅ User logged out successfully');
  }

  /**
   * Check if token is expired
   */
  isTokenExpired(): boolean {
    const token = this.getToken();
    if (!token) {
      return true;
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expiry = payload.exp;
      
      if (!expiry) {
        // No expiry time in token, consider it as expired
        return true;
      }
      
      return Math.floor(new Date().getTime() / 1000) >= expiry;
    } catch (error) {
      console.error('❌ Error checking token expiry:', error);
      return true;
    }
  }

  /**
   * Refresh authentication state
   */
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

  /**
   * Handle HTTP errors
   */
  private handleError = (error: HttpErrorResponse): Observable<never> => {
    let errorMessage = 'An unknown error occurred';
    
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side error
      if (error.error?.message) {
        errorMessage = error.error.message;
      } else {
        switch (error.status) {
          case 400:
            errorMessage = 'Invalid request. Please check your input.';
            break;
          case 401:
            errorMessage = 'Invalid credentials. Please try again.';
            break;
          case 403:
            errorMessage = 'Access forbidden.';
            break;
          case 404:
            errorMessage = 'Service not found.';
            break;
          case 409:
            errorMessage = 'User already exists with this email.';
            break;
          case 500:
            errorMessage = 'Internal server error. Please try again later.';
            break;
          default:
            errorMessage = `Error ${error.status}: ${error.statusText}`;
        }
      }
    }

    console.error('AuthService Error:', errorMessage, error);
    return throwError(() => new Error(errorMessage));
  };
};
