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
  }

  // login(loginData: any): Observable<any> {
  //   return this.http.post(`${this.apiUrl}/User/login`, loginData).pipe(
  //     catchError(err => {
  //       return this.http.post(`${this.apiUrl}/Admin/login`, loginData);
  //     }),
  //     tap((res: any) => {
  //       if (res && res.Token) {
  //         localStorage.setItem('Token', res.Token);
  //         localStorage.setItem('Role', res.Role);
  //         console.log("✅ Token stored:", res.Token);
  //         console.log("✅ Role stored:", res.Role);

  //         this.islogedInSubject.next(true);
  //         this.userSubject.next(this.getUser());
  //       } else {
  //         console.warn("⚠️ No token received from the server!");
  //       }
  //     })
  //   );
  // }

};