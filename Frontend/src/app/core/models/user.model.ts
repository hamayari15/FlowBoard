export interface User {
  _id: string;
  userName: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar?: {
    url: string;
    publicId: string;
  };
  isActive?: boolean;
  lastLogin?: Date;
  exp?: number; // JWT expiration, only present in token payload
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UserProfile extends User {
  // Additional fields that might be used for user profiles
  fullName?: string; // Computed property
}

export interface UserCreateRequest {
  userName: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  wsId?: string; // Optional workspace ID for invitation
}

export interface UserUpdateRequest {
  userName?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  avatar?: {
    url: string;
    publicId: string;
  };
}