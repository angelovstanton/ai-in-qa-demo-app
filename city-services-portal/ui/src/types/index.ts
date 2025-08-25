export interface User {
  id: string;
  name: string;
  email: string;
  role: 'CITIZEN' | 'CLERK' | 'FIELD_AGENT' | 'SUPERVISOR' | 'ADMIN';
  department?: {
    id: string;
    name: string;
    slug: string;
  };
}

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

export interface ServiceRequest {
  id: string;
  code: string;
  title: string;
  description: string;
  category: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'DRAFT' | 'SUBMITTED' | 'TRIAGED' | 'IN_PROGRESS' | 'WAITING_ON_CITIZEN' | 'RESOLVED' | 'CLOSED' | 'REJECTED';
  locationText: string;
  lat?: number;
  lng?: number;
  createdAt: string;
  updatedAt: string;
  version: number;
  creator: Pick<User, 'id' | 'name' | 'email'>;
  assignee?: Pick<User, 'id' | 'name' | 'email'>;
  department?: {
    id: string;
    name: string;
    slug: string;
  };
}

export interface ApiResponse<T> {
  data: T;
  correlationId: string;
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: any;
    correlationId: string;
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
  correlationId: string;
}