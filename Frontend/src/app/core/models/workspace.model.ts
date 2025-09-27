import { User } from './user.model';
import { ApiResponse, ApiError } from './api-response.model';

export interface Workspace {
  _id?: string;
  name: string;
  description?: string;
  owner: string; // Always use string ID to avoid circular dependencies
  members: string[]; // Always use string IDs to avoid circular dependencies
  createdAt?: Date;
  updatedAt?: Date;
}

// For populated responses from backend
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

// Re-export for backward compatibility
export { ApiResponse, ApiError };