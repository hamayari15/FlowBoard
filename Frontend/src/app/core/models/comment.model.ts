export interface Comment {
  _id?: string;
  content: string;
  task: string; // Always use string ID to avoid circular dependencies
  author: string; // Always use string ID to avoid circular dependencies
  isEdited: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

// For populated responses from backend
export interface CommentPopulated {
  _id?: string;
  content: string;
  task: {
    _id: string;
    title: string;
  };
  author: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  isEdited: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CommentCreateRequest {
  content: string;
  task: string;
}

export interface CommentUpdateRequest {
  content: string;
}