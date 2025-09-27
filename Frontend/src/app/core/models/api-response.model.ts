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

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}