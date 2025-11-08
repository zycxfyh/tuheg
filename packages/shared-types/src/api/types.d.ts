export interface ApiResponse<T = unknown> {
  data: T
  message?: string
  status: number
  timestamp?: string
}
export interface ApiError {
  message: string
  code?: string
  status: number
  details?: Record<string, unknown>
  timestamp?: string
}
export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}
export interface PaginationParams {
  page?: number
  pageSize?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}
//# sourceMappingURL=types.d.ts.map
