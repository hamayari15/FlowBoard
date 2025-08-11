import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { catchError, switchMap, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  islogedInSubject: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  apiUrl = 'http://localhost:3000/userRouter';

  constructor(private http: HttpClient) {}

  register(registerData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, registerData);
  };

  login(loginData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, loginData).pipe(
      tap((res: any) => {
        if (res?.myToken) {
          localStorage.setItem('Token', res.myToken);
          console.log("✅ Token stored:", res.myToken);

          this.islogedInSubject.next(true);
        } else {
          console.warn("⚠️ No token received from the server!");
        }
      })
    )
  };

  isLoggedIn(): boolean {
    const Token = localStorage.getItem('Token')
    return !!Token
  }

};