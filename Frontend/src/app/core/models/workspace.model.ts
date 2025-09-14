export interface Workspace {
  _id?: string;
  name: string;
  description?: string;
  owner: User;
  members: User[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface WorkspaceCreateRequest {
  name: string;
  description?: string;
  owner: string;
  members?: string[];
}

export interface WorkspaceUpdateRequest {
  name?: string;
  description?: string;
  members?: string[];
}

export interface ApiResponse<T> {
  data?: T;
  message: string;
  status: number;
}

export interface ApiError {
  message: string;
  error?: any;
  status?: number;
}