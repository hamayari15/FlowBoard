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
  }

  getWorkSpaces() {
    return this.http.get(`${this.apiUrl}/getAll`)
  }

  getWorkSpaceById(id: any) {
    return this.http.get(`${this.apiUrl}/getById/${id}`)
  }

  updateWoksSpace(id: any, newData: any) {
    return this.http.put(`${this.apiUrl}/Update/${id}`, newData)
  }

  deleteWorkSpace(id: any) {
    return this.http.delete(`${this.apiUrl}/Delete/${id}`)
  }

};
