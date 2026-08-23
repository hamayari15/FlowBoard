import { User } from './user.model';
import { ApiResponse, ApiError } from './api-response.model';

export interface Workspace {
  _id?: string;
  name: string;
  description?: string;
  owner: string;
  members: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface WorkspacePopulated {
  _id?: string;
  name: string;
  description?: string;
  owner: User;
  members: User[];
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

export { ApiResponse, ApiError };