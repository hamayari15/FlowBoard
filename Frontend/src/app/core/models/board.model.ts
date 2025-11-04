export interface Board {
  _id?: string;
  name: string;
  description?: string;
  project: string; // Always use string ID to avoid circular dependencies
  columns: BoardColumn[];
  // Sprint functionality
  startDate?: Date;
  endDate?: Date;
  goal?: string;
  status?: 'planning' | 'active' | 'completed' | 'archived';
  createdAt?: Date;
  updatedAt?: Date;
}

// For populated responses from backend
export interface BoardPopulated {
  _id?: string;
  name: string;
  description?: string;
  project: {
    _id: string;
    name: string;
    description?: string;
  };
  columns: BoardColumn[];
  // Sprint functionality
  startDate?: Date;
  endDate?: Date;
  goal?: string;
  status?: 'planning' | 'active' | 'completed' | 'archived';
  createdAt?: Date;
  updatedAt?: Date;
}

export interface BoardColumn {
  name: string;
  order: number;
}

export function getColumnId(column: BoardColumn): string {
  return column.name.toLowerCase().replace(/\s+/g, '-');
}

export interface BoardCreateRequest {
  name: string;
  description?: string;
  project: string;
  columns?: BoardColumn[];
  startDate?: Date;
  endDate?: Date;
  goal?: string;
  status?: 'planning' | 'active' | 'completed' | 'archived';
}

export interface BoardUpdateRequest {
  name?: string;
  description?: string;
  columns?: BoardColumn[];
  startDate?: Date;
  endDate?: Date;
  goal?: string;
  status?: 'planning' | 'active' | 'completed' | 'archived';
}

export interface SprintStats {
  total: number;
  toDo: number;
  inProgress: number;
  inReview: number;
  done: number;
  overdue: number;
  sprint: Board;
}