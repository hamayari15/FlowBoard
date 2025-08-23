import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  
  private tokenKey = 'Token';
  private apiUrl = 'http://localhost:3000/userRouter';

  private islogedInSubject = new BehaviorSubject<boolean>(false);
  isLoggedIn$ = this.islogedInSubject.asObservable();

  constructor(private http: HttpClient) {
    const token = this.getToken();
    this.islogedInSubject.next(!!token);
  }

  register(registerData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, registerData);
  }

  login(loginData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, loginData).pipe(
      tap((res: any) => {
        if (res?.myToken) {
          localStorage.setItem(this.tokenKey, res.myToken);
          console.log("✅ Token stored:", res.myToken);
          this.islogedInSubject.next(true);
        } else {
          console.warn("⚠️ No token received from the server!");
        }
      })
    );
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  getUserFromToken(): any | null {
    const token = this.getToken();
    if (token) {
      try {
        const payload = token.split('.')[1];
        return JSON.parse(atob(payload));
      } catch (err) {
        console.error("❌ Failed to decode token:", err);
        return null;
      }
    }
    return null;
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    this.islogedInSubject.next(false);
  }

};
