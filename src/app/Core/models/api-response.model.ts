export interface ApiResponse<T> {
  success: true;
  status: number;
  message: string;
  data: T;
}

export type ApiErrorCode =
  | 'BAD_REQUEST'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'VALIDATION_ERROR'
  | 'INTERNAL_ERROR';

export interface ApiErrorDetail {
  field?: string;
  message?: string;
  type?: string;
  value?: unknown;
}

export interface ApiErrorResponse {
  success: false;
  status: number;
  message: string;
  code: ApiErrorCode;
  errors: ApiErrorDetail[] | ApiErrorDetail | Record<string, unknown> | null;
}

export const getApiErrorMessage = (error: unknown, fallback: string): string => {
  if (error instanceof Error && error.message.trim()) return error.message;
  if (!error || typeof error !== 'object' || !('error' in error)) return fallback;
  const response = error.error;
  if (!response || typeof response !== 'object') return fallback;

  if ('errors' in response && Array.isArray(response.errors)) {
    const detail = response.errors.find(
      (item): item is ApiErrorDetail =>
        !!item && typeof item === 'object' && 'message' in item && typeof item.message === 'string',
    );
    if (detail?.message) return detail.message;
  }

  if ('message' in response && typeof response.message === 'string' && response.message.trim()) {
    return response.message;
  }

  return fallback;
};

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: Pagination;
}
