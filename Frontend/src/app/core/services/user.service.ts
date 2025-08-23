import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  constructor() { }

  getToken(): string | null {
    return localStorage.getItem('Token');
  }

  public getUser(): any {
    const token = this.getToken();

    if (token) {
      try {
        const payload = token.split('.')[1];
        return JSON.parse(atob(payload));
      } catch (err) {
        console.error("❌ Failed to decode token:", err);
        return null;
      }
    } else {
      return null;
    }
  }

};
