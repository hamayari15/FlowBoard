import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class WorkspaceService {

  apiUrl = 'http://localhost:3000/workSpaceRouter';

  constructor(private http: HttpClient) {}

  addWorkSpace(workSpaceData: any) {
    return this.http.post(`${this.apiUrl}/Add`, workSpaceData)
  };

  getworkSpaces() {
    return this.http.get(`${this.apiUrl}/getAll`)
  };

};
