export interface Project {
  _id?: string;
  name: string;
  description?: string;
  workspace: string; // Always use string IDs to avoid circular dependencies
  owner: string; // Always use string IDs to avoid circular dependencies
  members?: string[]; // Always use string IDs to avoid circular dependencies
  status: 'active' | 'completed' | 'on-hold';
  isArchived: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

// For populated responses from backend
export interface ProjectPopulated {
  _id?: string;
  name: string;
  description?: string;
  workspace: {
    _id: string;
    name: string;
    description?: string;
  };
  owner: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  members?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  }[];
  status: 'active' | 'completed' | 'on-hold';
  isArchived: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ProjectCreateRequest {
  name: string;
  description?: string;
  workspace: string;
  owner: string;
  members?: string[];
  status?: 'active' | 'completed' | 'on-hold';
}

export interface ProjectUpdateRequest {
  name?: string;
  description?: string;
  members?: string[];
  status?: 'active' | 'completed' | 'on-hold';
}
