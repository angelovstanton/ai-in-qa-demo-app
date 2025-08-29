import apiClient from '../lib/api';

// Field Agent Service - Work Order interfaces
export interface WorkOrder {
  id: string;
  requestId: string;
  assignedAgentId: string;
  supervisorId?: string;
  priority: 'EMERGENCY' | 'HIGH' | 'NORMAL' | 'LOW';
  gpsLat?: number;
  gpsLng?: number;
  gpsAccuracy?: number;
  navigationLink?: string;
  estimatedTravelTime?: number;
  optimalRoute?: string;
  taskType: string;
  estimatedDuration: number;
  requiredSkills?: string;
  requiredTools?: string;
  safetyNotes?: string;
  status: 'ASSIGNED' | 'EN_ROUTE' | 'ON_SITE' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  checkInTime?: string;
  checkOutTime?: string;
  actualDuration?: number;
  completionNotes?: string;
  citizenSignature?: string;
  followUpRequired: boolean;
  nextVisitScheduled?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  request: {
    id: string;
    code: string;
    title: string;
    description: string;
    category: string;
    priority: string;
    status: string;
    streetAddress?: string;
    city?: string;
    postalCode?: string;
    locationText: string;
    landmark?: string;
    email?: string;
    phone?: string;
    department?: { id: string; name: string };
    attachments?: any[];
    creator?: {
      id: string;
      name: string;
      email: string;
      phone?: string;
      streetAddress?: string;
      city?: string;
      postalCode?: string;
    };
    comments?: any[];
  };
  assignedAgent?: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
  supervisor?: {
    id: string;
    name: string;
    email: string;
  };
  photos?: FieldPhoto[];
  timeTracking?: TimeTracking[];
  additionalIssues?: any[];
  partsUsed?: any[];
}

export interface FieldPhoto {
  id: string;
  photoType: 'BEFORE' | 'DURING' | 'AFTER' | 'ISSUE' | 'SAFETY';
  filename: string;
  size: number;
  caption?: string;
  timestamp: string;
  gpsLat?: number;
  gpsLng?: number;
  agent?: {
    id: string;
    name: string;
  };
}

export interface TimeTracking {
  id: string;
  workOrderId: string;
  agentId: string;
  timeType: 'TRAVEL' | 'SETUP' | 'WORK' | 'DOCUMENTATION' | 'BREAK';
  startTime: string;
  endTime?: string;
  duration?: number;
  notes?: string;
}

export interface AgentStatus {
  id: string;
  agentId: string;
  status: 'AVAILABLE' | 'BUSY' | 'BREAK' | 'OFF_DUTY' | 'EN_ROUTE';
  currentTaskId?: string;
  currentLocation?: { lat: number; lng: number };
  vehicleStatus?: 'IN_TRANSIT' | 'PARKED' | 'MAINTENANCE';
  estimatedAvailableTime?: string;
  lastUpdateTime: string;
  activeWorkOrder?: WorkOrder;
}

export interface DashboardData {
  todaysOrders: WorkOrder[];
  statistics: {
    total: number;
    byStatus: Record<string, number>;
    todayCompleted: number;
    todayWorkTimeMinutes: number;
  };
  recentActivity: TimeTracking[];
}

export interface WorkOrderFilters {
  status?: 'ASSIGNED' | 'EN_ROUTE' | 'ON_SITE' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  priority?: 'EMERGENCY' | 'HIGH' | 'NORMAL' | 'LOW';
  agentId?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'priority' | 'status' | 'estimatedDuration';
  sortOrder?: 'asc' | 'desc';
}

// Field Agent API Service
class FieldAgentService {
  // Work Orders
  async getWorkOrders(filters?: WorkOrderFilters) {
    const response = await apiClient.get('/field-agent/work-orders', { params: filters });
    return response.data;
  }

  async getWorkOrder(id: string) {
    const response = await apiClient.get(`/field-agent/work-orders/${id}`);
    return response.data;
  }

  async createWorkOrder(data: {
    requestId: string;
    assignedAgentId: string;
    priority?: 'EMERGENCY' | 'HIGH' | 'NORMAL' | 'LOW';
    taskType: string;
    estimatedDuration: number;
    requiredSkills?: string[];
    requiredTools?: string[];
    safetyNotes?: string;
    gpsLat?: number;
    gpsLng?: number;
    navigationLink?: string;
  }) {
    const response = await apiClient.post('/field-agent/work-orders', data);
    return response.data;
  }

  async updateWorkOrder(id: string, updates: {
    status?: 'ASSIGNED' | 'EN_ROUTE' | 'ON_SITE' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
    priority?: 'EMERGENCY' | 'HIGH' | 'NORMAL' | 'LOW';
    completionNotes?: string;
    citizenSignature?: string;
    followUpRequired?: boolean;
    nextVisitScheduled?: string;
    actualDuration?: number;
  }) {
    const response = await apiClient.patch(`/field-agent/work-orders/${id}`, updates);
    return response.data;
  }

  async checkIn(workOrderId: string, location: { lat: number; lng: number; accuracy?: number }) {
    const response = await apiClient.post(`/field-agent/work-orders/${workOrderId}/check-in`, location);
    return response.data;
  }

  async checkOut(workOrderId: string) {
    const response = await apiClient.post(`/field-agent/work-orders/${workOrderId}/check-out`);
    return response.data;
  }

  async getDashboard() {
    const response = await apiClient.get('/field-agent/dashboard');
    return response.data;
  }

  // Time Tracking
  async startTimeTracking(data: {
    workOrderId: string;
    timeType: 'TRAVEL' | 'SETUP' | 'WORK' | 'DOCUMENTATION' | 'BREAK';
    notes?: string;
  }) {
    const response = await apiClient.post('/time-tracking/start', data);
    return response.data;
  }

  async endTimeTracking(id: string, notes?: string) {
    const response = await apiClient.post(`/time-tracking/${id}/end`, { notes });
    return response.data;
  }

  async getActiveTimeTracking() {
    const response = await apiClient.get('/time-tracking/active');
    return response.data;
  }

  async getTimeReport(filters?: {
    agentId?: string;
    workOrderId?: string;
    dateFrom?: string;
    dateTo?: string;
    timeType?: 'TRAVEL' | 'SETUP' | 'WORK' | 'DOCUMENTATION' | 'BREAK';
  }) {
    const response = await apiClient.get('/time-tracking/report', { params: filters });
    return response.data;
  }

  async getProductivityMetrics(agentId?: string) {
    const response = await apiClient.get('/time-tracking/productivity', { 
      params: agentId ? { agentId } : undefined 
    });
    return response.data;
  }

  // Field Photos
  async uploadPhotos(workOrderId: string, files: File[], data: {
    photoType: 'BEFORE' | 'DURING' | 'AFTER' | 'ISSUE' | 'SAFETY';
    caption?: string;
    gpsLat?: number;
    gpsLng?: number;
  }) {
    const formData = new FormData();
    files.forEach(file => formData.append('photos', file));
    formData.append('workOrderId', workOrderId);
    formData.append('photoType', data.photoType);
    if (data.caption) formData.append('caption', data.caption);
    if (data.gpsLat) formData.append('gpsLat', data.gpsLat.toString());
    if (data.gpsLng) formData.append('gpsLng', data.gpsLng.toString());

    const response = await apiClient.post('/field-photos/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  }

  async getWorkOrderPhotos(workOrderId: string) {
    const response = await apiClient.get(`/field-photos/work-order/${workOrderId}`);
    return response.data;
  }

  async getPhotoUrl(photoId: string) {
    return `${apiClient.defaults.baseURL}/field-photos/${photoId}`;
  }

  async updatePhoto(id: string, updates: {
    caption?: string;
    photoType?: 'BEFORE' | 'DURING' | 'AFTER' | 'ISSUE' | 'SAFETY';
  }) {
    const response = await apiClient.patch(`/field-photos/${id}`, updates);
    return response.data;
  }

  async deletePhoto(id: string) {
    const response = await apiClient.delete(`/field-photos/${id}`);
    return response.data;
  }

  // Agent Status
  async getCurrentStatus() {
    const response = await apiClient.get('/agent-status/current');
    return response.data;
  }

  async updateStatus(updates: {
    status: 'AVAILABLE' | 'BUSY' | 'BREAK' | 'OFF_DUTY' | 'EN_ROUTE';
    currentTaskId?: string | null;
    currentLocation?: { lat: number; lng: number };
    vehicleStatus?: 'IN_TRANSIT' | 'PARKED' | 'MAINTENANCE' | null;
    estimatedAvailableTime?: string | null;
  }) {
    const response = await apiClient.put('/agent-status', updates);
    return response.data;
  }

  async updateLocation(location: {
    lat: number;
    lng: number;
    accuracy?: number;
    speed?: number;
    heading?: number;
  }) {
    const response = await apiClient.post('/agent-status/location', location);
    return response.data;
  }

  async quickCheckIn() {
    const response = await apiClient.post('/agent-status/check-in');
    return response.data;
  }

  async quickCheckOut() {
    const response = await apiClient.post('/agent-status/check-out');
    return response.data;
  }

  async getTeamStatus(filters?: {
    departmentId?: string;
    status?: 'AVAILABLE' | 'BUSY' | 'BREAK' | 'OFF_DUTY' | 'EN_ROUTE';
    includeLocation?: boolean;
  }) {
    const response = await apiClient.get('/agent-status/team', { params: filters });
    return response.data;
  }

  async getAgentAvailability(skills?: string, location?: string) {
    const response = await apiClient.get('/agent-status/availability', {
      params: { skills, location }
    });
    return response.data;
  }
}

export default new FieldAgentService();