export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export interface PaginatedResult<T> {
  success: boolean;
  total: number;
  page: number;
  limit: number;
  total_pages: number;
  data: T[];
}
