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
  
  // Date fields
  dateOfRequest: string;
  
  // Location fields
  streetAddress?: string;
  city?: string;
  postalCode?: string;
  locationText: string;
  landmark?: string;
  accessInstructions?: string;
  lat?: number;
  lng?: number;
  
  // Contact fields
  contactMethod?: 'EMAIL' | 'PHONE' | 'SMS';
  alternatePhone?: string;
  bestTimeToContact?: string;
  
  // Issue details
  issueType?: string;
  severity?: number; // 1-10 scale
  isRecurring?: boolean;
  isEmergency?: boolean;
  hasPermits?: boolean;
  
  // Service impact
  affectedServices?: string[]; // Will be parsed from JSON string
  estimatedValue?: number;
  
  // Additional contacts
  additionalContacts?: Array<{
    name: string;
    phone: string;
    relationship: string;
  }>;
  
  // User experience
  satisfactionRating?: number; // 1-5 scale
  formComments?: string; // Additional comments from form (renamed to avoid conflict)
  
  // Legal and preferences
  agreesToTerms?: boolean;
  wantsUpdates?: boolean;
  
  // Scheduled service
  preferredDate?: string;
  preferredTime?: string;
  
  // System fields
  createdAt: string;
  updatedAt: string;
  version: number;
  closedAt?: string;
  creator: Pick<User, 'id' | 'name' | 'email'>;
  assignee?: Pick<User, 'id' | 'name' | 'email'>;
  department?: {
    id: string;
    name: string;
    slug: string;
  };
  
  // Legacy/computed fields
  upvotes?: number; // Number of upvotes for the request
  comments?: { // Comments associated with the request
    id: string;
    body: string;
    author: {
      id: string;
      name: string;
      email: string;
    };
    visibility: string;
    createdAt: string;
  }[]; // Corrected to an array of objects
  resolvedStatus?: boolean; // Whether the request is resolved
  correspondenceHistory?: { // History of correspondence related to the request
    message: string;
    date: string;
  }[];
  attachments?: { // Attachments associated with the request
    id: string;
    filename: string;
    fileSize: number;
    createdAt: string;
  }[]; // Corrected to an array of objects
  eventLogs?: { // Event logs for the request
    id: string;
    type: string;
    payload: string;
    createdAt: string;
  }[]; // Corrected to an array of objects
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