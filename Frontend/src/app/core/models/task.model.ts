export interface Task {
  _id?: string;
  title: string;
  description?: string;
  board: string; // Always use string ID to avoid circular dependencies
  status: string; // Column ID where the task belongs (e.g., 'to-do', 'in-progress', 'done')
  position: number;
  assignee?: string; // Always use string ID to avoid circular dependencies
  createdBy: string; // Always use string ID to avoid circular dependencies
  priority: 'low' | 'medium' | 'high';
  labels: string[];
  dueDate?: Date;
  attachments: TaskAttachment[];
  createdAt?: Date;
  updatedAt?: Date;
}

// For populated responses from backend
export interface TaskPopulated {
  _id?: string;
  title: string;
  description?: string;
  board: {
    _id: string;
    name: string;
    description?: string;
  };
  status: string; // Column ID where the task belongs
  position: number;
  assignee?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatar?: {
      url: string;
      publicId: string;
    };
  };
  createdBy: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatar?: {
      url: string;
      publicId: string;
    };
  };
  priority: 'low' | 'medium' | 'high';
  labels: string[];
  dueDate?: Date;
  attachments: TaskAttachment[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface TaskAttachment {
  url: string;
  publicId: string;
}

export interface TaskCreateRequest {
  title: string;
  description?: string;
  board: string;
  status?: string;
  position?: number;
  assignee?: string;
  createdBy?: string;
  priority?: 'low' | 'medium' | 'high';
  labels?: string[];
  dueDate?: Date;
  attachments?: TaskAttachment[];
}

export interface TaskUpdateRequest {
  title?: string;
  description?: string;
  status?: string;
  position?: number;
  assignee?: string;
  priority?: 'low' | 'medium' | 'high';
  labels?: string[];
  dueDate?: Date;
  attachments?: TaskAttachment[];
}