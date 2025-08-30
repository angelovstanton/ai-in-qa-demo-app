# City Services Portal - Complete API Documentation

## Base URL
- Development: `http://localhost:3001`
- Production: `https://api.city-services.gov`

## Authentication
All protected endpoints require JWT Bearer token in Authorization header:
```
Authorization: Bearer <token>
```

## Response Format
All responses follow this structure:
```json
{
  "data": {}, // Response payload
  "correlationId": "req_1234567890_abcdef", // Request tracking ID
  "pagination": {} // Optional: For paginated endpoints
}
```

## Error Response Format
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {}, // Optional: Additional error information
    "correlationId": "req_1234567890_abcdef"
  }
}
```

## API Endpoints

### 🏥 Health & System

#### GET /health
Health check endpoint
- **Auth Required**: No
- **Response**: `{ ok: true, correlationId: string }`

---

### 🔐 Authentication

#### POST /api/v1/auth/register
Register a new user account
- **Auth Required**: No
- **Request Body**:
  ```json
  {
    "name": "string (2-100 chars)",
    "email": "email",
    "password": "string (min 6 chars)"
  }
  ```
- **Response**: `{ accessToken: string, user: User, correlationId: string }`

#### POST /api/v1/auth/login
User login
- **Auth Required**: No
- **Request Body**:
  ```json
  {
    "email": "email",
    "password": "string"
  }
  ```
- **Response**: `{ accessToken: string, user: User, correlationId: string }`

#### POST /api/v1/auth/token
Get access token (simplified for API testing)
- **Auth Required**: No
- **Request Body**: Same as login
- **Response**: `{ token: string }`

#### GET /api/v1/auth/me
Get current user profile
- **Auth Required**: Yes
- **Response**: `{ user: User, correlationId: string }`

#### PATCH /api/v1/auth/profile
Update user profile
- **Auth Required**: Yes
- **Request Body**:
  ```json
  {
    "firstName": "string (optional)",
    "lastName": "string (optional)",
    "phone": "string (optional)",
    "streetAddress": "string (optional)",
    "city": "string (optional)",
    "postalCode": "string (optional)"
  }
  ```
- **Response**: `{ user: User, correlationId: string }`

#### POST /api/v1/auth/change-password
Change user password
- **Auth Required**: Yes
- **Request Body**:
  ```json
  {
    "currentPassword": "string",
    "newPassword": "string (min 6 chars)"
  }
  ```
- **Response**: `{ success: boolean, correlationId: string }`

---

### 📋 Service Requests

#### GET /api/v1/requests
List service requests (filtered by user role)
- **Auth Required**: Yes
- **Query Parameters**:
  - `page`: integer (default: 1)
  - `pageSize`: integer (5-50, default: 20)
  - `status`: DRAFT | SUBMITTED | TRIAGED | IN_PROGRESS | WAITING_ON_CITIZEN | RESOLVED | CLOSED | REJECTED | REOPENED
  - `priority`: LOW | MEDIUM | HIGH | URGENT
  - `category`: string
  - `assignedTo`: uuid
  - `department`: string
  - `text`: string (search in title, description, code)
  - `showAll`: boolean (admin/supervisor only)
  - `sort`: field:direction (default: createdAt:desc)
- **Response**: `{ data: ServiceRequest[], pagination: Pagination, correlationId: string }`

#### POST /api/v1/requests
Create a new service request
- **Auth Required**: Yes (CITIZEN, CLERK roles)
- **Request Body**:
  ```json
  {
    "title": "string (5-120 chars)",
    "description": "string (min 30 chars)",
    "category": "string",
    "priority": "LOW | MEDIUM | HIGH | URGENT",
    "locationText": "string (required)",
    "streetAddress": "string",
    "city": "string",
    "postalCode": "string",
    "lat": "number",
    "lng": "number",
    "contactMethod": "EMAIL | PHONE | SMS",
    "email": "email",
    "phone": "string",
    "preferredDate": "datetime",
    "preferredTime": "string"
  }
  ```
- **Response**: `{ data: ServiceRequest, correlationId: string }`

#### GET /api/v1/requests/:id
Get service request details
- **Auth Required**: Yes
- **Response**: `{ data: ServiceRequest, correlationId: string }`

#### PATCH /api/v1/requests/:id
Update service request
- **Auth Required**: Yes (role-based permissions)
- **Headers**: `If-Match: version` (for optimistic locking)
- **Request Body**: Partial ServiceRequest object
- **Response**: `{ data: ServiceRequest, correlationId: string }`

#### POST /api/v1/requests/:id/status
Update request status
- **Auth Required**: Yes (CLERK, FIELD_AGENT, SUPERVISOR, ADMIN)
- **Request Body**:
  ```json
  {
    "action": "submit | triage | start | resolve | close | reject | reopen | wait_for_citizen",
    "reason": "string (optional)"
  }
  ```
- **Response**: `{ data: ServiceRequest, correlationId: string }`

#### POST /api/v1/requests/:id/comments
Add comment to request
- **Auth Required**: Yes
- **Request Body**:
  ```json
  {
    "content": "string",
    "visibility": "PUBLIC | INTERNAL"
  }
  ```
- **Response**: `{ data: Comment, correlationId: string }`

#### POST /api/v1/requests/:id/upvote
Upvote a request
- **Auth Required**: Yes
- **Response**: `{ data: { upvoteCount: number }, correlationId: string }`

#### DELETE /api/v1/requests/:id/upvote
Remove upvote from request
- **Auth Required**: Yes
- **Response**: `{ data: { upvoteCount: number }, correlationId: string }`

#### POST /api/v1/requests/:id/assign
Assign request to user
- **Auth Required**: Yes (CLERK, SUPERVISOR, ADMIN)
- **Request Body**:
  ```json
  {
    "assigneeId": "uuid"
  }
  ```
- **Response**: `{ data: ServiceRequest, correlationId: string }`

#### POST /api/v1/requests/bulk
Create multiple requests
- **Auth Required**: Yes (ADMIN, CLERK)
- **Request Body**:
  ```json
  {
    "requests": [/* array of request objects, max 100 */]
  }
  ```
- **Response**: `{ data: { created: ServiceRequest[], errors: any[] }, correlationId: string }`

#### DELETE /api/v1/requests/bulk
Delete multiple requests
- **Auth Required**: Yes (ADMIN only)
- **Request Body**:
  ```json
  {
    "ids": ["uuid1", "uuid2", ...]
  }
  ```
- **Response**: `{ data: { deleted: number }, correlationId: string }`

---

### 💬 Comments

#### GET /api/v1/comments
List comments with filtering
- **Auth Required**: Yes
- **Query Parameters**:
  - `requestId`: uuid
  - `userId`: uuid
  - `visibility`: PUBLIC | INTERNAL
  - `page`: integer (default: 1)
  - `size`: integer (default: 20)
  - `sort`: field:direction
- **Response**: `{ data: Comment[], pagination: Pagination, correlationId: string }`

#### GET /api/v1/comments/:id
Get specific comment
- **Auth Required**: Yes
- **Response**: `{ data: Comment, correlationId: string }`

#### PATCH /api/v1/comments/:id
Update comment
- **Auth Required**: Yes (author or admin)
- **Request Body**:
  ```json
  {
    "content": "string",
    "visibility": "PUBLIC | INTERNAL"
  }
  ```
- **Response**: `{ data: Comment, correlationId: string }`

#### DELETE /api/v1/comments/:id
Delete comment
- **Auth Required**: Yes (author or admin)
- **Response**: `{ data: { deleted: true }, correlationId: string }`

---

### 📎 Attachments

#### POST /api/v1/attachments/:requestId/attachments
Upload attachments to request
- **Auth Required**: Yes
- **Content-Type**: multipart/form-data
- **Form Data**: `files`: File[] (max 5 files, 5MB each)
- **Response**: `{ data: Attachment[], correlationId: string }`

#### GET /api/v1/attachments/:id/image
Get attachment image
- **Auth Required**: Yes
- **Response**: Binary image data with appropriate Content-Type

#### GET /api/v1/attachments/:requestId/attachments
List request attachments
- **Auth Required**: Yes
- **Response**: `{ data: Attachment[], correlationId: string }`

#### DELETE /api/v1/attachments/:id
Delete attachment
- **Auth Required**: Yes (owner or admin)
- **Response**: `{ data: { deleted: true }, correlationId: string }`

---

### 👥 Supervisor Management

#### GET /api/v1/supervisor/dashboard-summary
Get supervisor dashboard summary
- **Auth Required**: Yes (SUPERVISOR, ADMIN)
- **Response**: Complex dashboard data object

#### GET /api/v1/supervisor/department-metrics
Get department performance metrics
- **Auth Required**: Yes (SUPERVISOR, ADMIN)
- **Query Parameters**:
  - `departmentId`: uuid
  - `metricType`: avgResolutionTime | slaCompliance | firstCallResolution | satisfaction | requestVolume | escalationRate
  - `period`: daily | weekly | monthly | quarterly
  - `startDate`: datetime
  - `endDate`: datetime
  - `page`: integer
  - `size`: integer
  - `sort`: field:direction
- **Response**: `{ data: DepartmentMetrics[], pagination: Pagination, correlationId: string }`

#### GET /api/v1/supervisor/quality-reviews
List quality reviews
- **Auth Required**: Yes (SUPERVISOR, ADMIN)
- **Query Parameters**:
  - `requestId`: uuid
  - `reviewerId`: uuid
  - `reviewStatus`: PENDING | COMPLETED | ARCHIVED
  - `minQualityScore`: integer
  - `maxQualityScore`: integer
  - `page`: integer
  - `size`: integer
  - `sort`: field:direction
- **Response**: `{ data: QualityReview[], pagination: Pagination, correlationId: string }`

#### POST /api/v1/supervisor/quality-reviews
Create quality review
- **Auth Required**: Yes (SUPERVISOR, ADMIN)
- **Request Body**:
  ```json
  {
    "requestId": "uuid",
    "qualityScore": 1-10,
    "communicationScore": 1-10,
    "technicalAccuracyScore": 1-10,
    "timelinessScore": 1-10,
    "citizenSatisfactionScore": 1-10,
    "improvementSuggestions": "string",
    "followUpRequired": false,
    "calibrationSession": "string"
  }
  ```
- **Response**: `{ data: QualityReview, correlationId: string }`

#### PUT /api/v1/supervisor/quality-reviews/:id
Update quality review
- **Auth Required**: Yes (SUPERVISOR, ADMIN)
- **Request Body**: Partial QualityReview object
- **Response**: `{ data: QualityReview, correlationId: string }`

#### DELETE /api/v1/supervisor/quality-reviews/:id
Delete quality review
- **Auth Required**: Yes (SUPERVISOR, ADMIN)
- **Response**: `{ data: { deleted: true }, correlationId: string }`

#### POST /api/v1/supervisor/workload-assignments
Create workload assignment
- **Auth Required**: Yes (SUPERVISOR, ADMIN)
- **Request Body**:
  ```json
  {
    "requestId": "uuid",
    "assignedTo": "uuid",
    "assignedFrom": "uuid (optional)",
    "assignmentReason": "string",
    "estimatedEffort": "number",
    "skillsRequired": ["string"],
    "priorityWeight": 0-100
  }
  ```
- **Response**: `{ data: WorkloadAssignment, correlationId: string }`

#### GET /api/v1/supervisor/workload-assignments
List workload assignments
- **Auth Required**: Yes (SUPERVISOR, ADMIN)
- **Query Parameters**: Standard pagination and filtering
- **Response**: `{ data: WorkloadAssignment[], pagination: Pagination, correlationId: string }`

#### PUT /api/v1/supervisor/workload-assignments/:id
Update workload assignment
- **Auth Required**: Yes (SUPERVISOR, ADMIN)
- **Request Body**: Partial WorkloadAssignment object
- **Response**: `{ data: WorkloadAssignment, correlationId: string }`

#### GET /api/v1/supervisor/staff-performance
Get staff performance data
- **Auth Required**: Yes (SUPERVISOR, ADMIN)
- **Query Parameters**:
  - `userId`: uuid
  - `departmentId`: uuid
  - `performancePeriod`: string
  - `role`: CLERK | FIELD_AGENT | SUPERVISOR
  - `startDate`: datetime
  - `endDate`: datetime
  - `page`: integer
  - `size`: integer
  - `sort`: field:direction
- **Response**: `{ data: StaffPerformance[], pagination: Pagination, correlationId: string }`

#### PUT /api/v1/supervisor/staff-performance/:id/skills
Update staff skills assessment
- **Auth Required**: Yes (SUPERVISOR, ADMIN)
- **Request Body**:
  ```json
  {
    "communication": 1-10,
    "problemSolving": 1-10,
    "technical": 1-10,
    "teamwork": 1-10,
    "timeManagement": 1-10,
    "customerService": 1-10
  }
  ```
- **Response**: `{ data: StaffPerformance, correlationId: string }`

#### GET /api/v1/supervisor/performance-goals
List performance goals
- **Auth Required**: Yes (SUPERVISOR, ADMIN)
- **Query Parameters**:
  - `userId`: uuid
  - `status`: ACTIVE | ACHIEVED | MISSED | CANCELLED
  - `priority`: LOW | MEDIUM | HIGH
  - `dueSoon`: boolean
  - `page`: integer
  - `size`: integer
  - `sort`: field:direction
- **Response**: `{ data: PerformanceGoal[], pagination: Pagination, correlationId: string }`

#### POST /api/v1/supervisor/performance-goals
Create performance goal
- **Auth Required**: Yes (SUPERVISOR, ADMIN)
- **Request Body**:
  ```json
  {
    "userId": "uuid",
    "title": "string (5-200 chars)",
    "description": "string (10-1000 chars)",
    "targetValue": "number",
    "currentValue": 0,
    "unit": "string",
    "dueDate": "datetime",
    "status": "ACTIVE | PAUSED",
    "priority": "LOW | MEDIUM | HIGH"
  }
  ```
- **Response**: `{ data: PerformanceGoal, correlationId: string }`

#### PUT /api/v1/supervisor/performance-goals/:id
Update performance goal
- **Auth Required**: Yes (SUPERVISOR, ADMIN)
- **Request Body**: Partial PerformanceGoal object
- **Response**: `{ data: PerformanceGoal, correlationId: string }`

#### DELETE /api/v1/supervisor/performance-goals/:id
Delete performance goal
- **Auth Required**: Yes (SUPERVISOR, ADMIN)
- **Response**: `{ data: { deleted: true }, correlationId: string }`

---

### 🏢 Departments

#### GET /api/departments
List all departments with filtering and pagination
- **Auth Required**: No
- **Query Parameters**:
  - `name`: string (filter by name)
  - `slug`: string (filter by slug)
  - `search`: string (search in name and slug)
  - `page`: integer (default: 1)
  - `pageSize`: integer (default: 10)
  - `sortBy`: name | slug | id (default: name)
  - `sortOrder`: asc | desc (default: asc)
- **Response**: `{ data: Department[], pagination: Pagination, correlationId: string }`

#### GET /api/departments/:id
Get department by ID or slug
- **Auth Required**: No
- **Parameters**:
  - `id`: uuid or slug string
- **Response**: `{ data: Department, correlationId: string }`

#### POST /api/departments
Create new department
- **Auth Required**: Yes (ADMIN only)
- **Request Body**:
  ```json
  {
    "name": "string (2-100 chars)",
    "slug": "string (lowercase, numbers, hyphens only)"
  }
  ```
- **Response**: `{ data: Department, correlationId: string }`

#### PATCH /api/departments/:id
Update department
- **Auth Required**: Yes (ADMIN only)
- **Parameters**:
  - `id`: uuid or slug string
- **Request Body**: Partial Department object (name, slug)
- **Response**: `{ data: Department, correlationId: string }`

#### DELETE /api/departments/:id
Delete department
- **Auth Required**: Yes (ADMIN only)
- **Parameters**:
  - `id`: uuid or slug string
- **Response**: `{ data: { deleted: true }, correlationId: string }`

#### GET /api/departments/:id/statistics
Get department statistics
- **Auth Required**: No
- **Parameters**:
  - `id`: uuid or slug string
- **Response**: 
  ```json
  {
    "data": {
      "department": Department,
      "totalUsers": number,
      "usersByRole": { [role]: count },
      "totalRequests": number,
      "requestsByStatus": { [status]: count },
      "requestsByPriority": { [priority]: count },
      "avgResolutionTime": number,
      "avgResponseTime": number,
      "last30Days": {
        "requestsCreated": number,
        "requestsResolved": number,
        "avgResolutionTime": number
      }
    },
    "correlationId": string
  }
  ```

---

### 📊 Dashboard & Analytics

#### GET /api/v1/dashboard/overview
Get dashboard overview
- **Auth Required**: Yes (SUPERVISOR, ADMIN)
- **Query Parameters**:
  - `departmentId`: uuid
  - `period`: last7days | last30days | last90days | currentMonth | lastMonth | currentQuarter | lastQuarter | currentYear
- **Response**: Complex dashboard overview object

#### GET /api/v1/dashboard/charts/request-trends
Get request trend data
- **Auth Required**: Yes (SUPERVISOR, ADMIN)
- **Query Parameters**:
  - `departmentId`: uuid
  - `period`: string
  - `groupBy`: day | week | month
- **Response**: Chart data object

#### GET /api/v1/dashboard/charts/resolution-times
Get resolution time analytics
- **Auth Required**: Yes (SUPERVISOR, ADMIN)
- **Query Parameters**: Similar to request-trends
- **Response**: Resolution time chart data

#### GET /api/v1/dashboard/charts/staff-performance
Get staff performance comparisons
- **Auth Required**: Yes (SUPERVISOR, ADMIN)
- **Query Parameters**: Department and period filters
- **Response**: Staff performance chart data

#### POST /api/v1/dashboard/refresh
Refresh dashboard cache
- **Auth Required**: Yes (SUPERVISOR, ADMIN)
- **Response**: `{ data: { refreshed: true }, correlationId: string }`

---

### 📈 Metrics

#### POST /api/v1/metrics/calculate
Calculate department metrics
- **Auth Required**: Yes (ADMIN, SUPERVISOR)
- **Request Body**:
  ```json
  {
    "departmentId": "uuid",
    "metricType": "string",
    "period": "string",
    "startDate": "datetime",
    "endDate": "datetime"
  }
  ```
- **Response**: Calculated metrics object

#### GET /api/v1/metrics/historical
Get historical metrics
- **Auth Required**: Yes (ADMIN, SUPERVISOR)
- **Query Parameters**: Department, metric type, and date range
- **Response**: Historical metrics data

#### GET /api/v1/metrics/workloads
Get workload metrics
- **Auth Required**: Yes (ADMIN, SUPERVISOR)
- **Query Parameters**: Department and user filters
- **Response**: Workload distribution data

#### GET /api/v1/metrics/scheduler/status
Get metrics scheduler status
- **Auth Required**: Yes (ADMIN)
- **Response**: Scheduler status and job information

#### POST /api/v1/metrics/scheduler/control
Control metrics scheduler
- **Auth Required**: Yes (ADMIN)
- **Request Body**:
  ```json
  {
    "action": "start | stop | pause | resume",
    "jobId": "string (optional)"
  }
  ```
- **Response**: Updated scheduler status

---

### 🏆 Community Rankings

#### GET /api/v1/community/leaderboard
Get ranked users with filters
- **Auth Required**: No
- **Query Parameters**:
  - `period`: daily | weekly | monthly | yearly | all-time (default: monthly)
  - `category`: string (filter by request category)
  - `limit`: integer (1-100, default: 10)
  - `offset`: integer (default: 0)
  - `includeInactive`: boolean (default: false)
  - `startDate`: datetime (for custom date range)
  - `endDate`: datetime (for custom date range)
- **Response**: 
  ```json
  {
    "data": {
      "leaderboard": [LeaderboardEntry],
      "period": string,
      "periodStart": datetime,
      "periodEnd": datetime,
      "totalParticipants": number
    },
    "correlationId": string
  }
  ```

#### GET /api/v1/community/users/:userId/stats
Get specific user statistics
- **Auth Required**: No
- **Parameters**:
  - `userId`: uuid
- **Query Parameters**:
  - `period`: daily | weekly | monthly | yearly | all-time
  - `startDate`: datetime
  - `endDate`: datetime
- **Response**: `{ data: CommunityStats, correlationId: string }`

#### GET /api/v1/community/my-stats
Get current user's stats (authenticated)
- **Auth Required**: Yes
- **Query Parameters**: Same as user stats endpoint
- **Response**: `{ data: CommunityStats, correlationId: string }`

#### GET /api/v1/community/categories/:category/stats
Statistics by category
- **Auth Required**: No
- **Parameters**:
  - `category`: string
- **Query Parameters**:
  - `period`: daily | weekly | monthly | yearly | all-time
- **Response**: `{ data: CategoryStats, correlationId: string }`

#### GET /api/v1/community/trends
Trending statistics
- **Auth Required**: No
- **Query Parameters**:
  - `period`: daily | weekly | monthly (default: weekly)
  - `limit`: integer (default: 5)
- **Response**: 
  ```json
  {
    "data": {
      "trendingCategories": [{ category: string, count: number, growth: number }],
      "risingContributors": [LeaderboardEntry],
      "hotRequests": [ServiceRequest]
    },
    "correlationId": string
  }
  ```

#### GET /api/v1/community/summary
Community summary
- **Auth Required**: No
- **Query Parameters**:
  - `period`: daily | weekly | monthly | yearly | all-time
- **Response**: 
  ```json
  {
    "data": {
      "totalRequests": number,
      "totalApproved": number,
      "totalResolved": number,
      "totalComments": number,
      "totalUpvotes": number,
      "activeCitizens": number,
      "topCategories": [{ category: string, count: number }],
      "averageResolutionTime": number,
      "satisfactionRate": number
    },
    "correlationId": string
  }
  ```

#### GET /api/v1/community/achievements
List all achievements
- **Auth Required**: No
- **Response**: 
  ```json
  {
    "data": {
      "achievements": [
        {
          "id": string,
          "name": string,
          "description": string,
          "icon": string,
          "category": string,
          "points": number,
          "requirements": object
        }
      ]
    },
    "correlationId": string
  }
  ```

#### GET /api/v1/community/users/:userId/achievements
User's achievements
- **Auth Required**: No
- **Parameters**:
  - `userId`: uuid
- **Response**: 
  ```json
  {
    "data": {
      "achievements": [
        {
          "achievement": Achievement,
          "unlockedAt": datetime,
          "progress": number
        }
      ],
      "totalPoints": number,
      "level": number
    },
    "correlationId": string
  }
  ```

#### GET /api/v1/community/users/:userId/requests
User's requests
- **Auth Required**: No
- **Parameters**:
  - `userId`: uuid
- **Query Parameters**:
  - `status`: string
  - `category`: string
  - `page`: integer (default: 1)
  - `limit`: integer (default: 20)
- **Response**: `{ data: ServiceRequest[], pagination: Pagination, correlationId: string }`

#### GET /api/v1/community/statistics/overview
Community statistics overview
- **Auth Required**: No
- **Query Parameters**:
  - `period`: daily | weekly | monthly | yearly
  - `startDate`: datetime
  - `endDate`: datetime
- **Response**: Comprehensive statistics object with metrics, trends, and distributions

#### GET /api/v1/community/comments
Get community comments
- **Auth Required**: No
- **Query Parameters**:
  - `userId`: uuid
  - `requestId`: uuid
  - `visibility`: PUBLIC | INTERNAL
  - `page`: integer (default: 1)
  - `limit`: integer (default: 20)
  - `sort`: createdAt:desc | createdAt:asc
- **Response**: `{ data: Comment[], pagination: Pagination, correlationId: string }`

---

### 🏆 Rankings (Legacy)

#### GET /api/v1/rankings/users
Get user rankings
- **Auth Required**: Yes
- **Query Parameters**:
  - `timeframe`: week | month | quarter | year | all
  - `category`: string
  - `limit`: integer (default: 10)
- **Response**: User rankings with scores and badges

#### GET /api/v1/rankings/stats
Get ranking statistics
- **Auth Required**: Yes
- **Query Parameters**: Similar to user rankings
- **Response**: Aggregated ranking statistics

---

### 🔧 Admin

#### GET /api/v1/admin/flags
Get feature flags
- **Auth Required**: Yes (ADMIN)
- **Response**: `{ data: FeatureFlag[], correlationId: string }`

#### PATCH /api/v1/admin/flags/:key
Update feature flag
- **Auth Required**: Yes (ADMIN)
- **Request Body**:
  ```json
  {
    "enabled": true
  }
  ```
- **Response**: `{ data: FeatureFlag, correlationId: string }`

#### GET /api/v1/admin/stats
Get system statistics
- **Auth Required**: Yes (ADMIN)
- **Response**: System-wide statistics object

#### POST /api/v1/admin/seed
Seed database with test data
- **Auth Required**: Yes (ADMIN)
- **Request Body**:
  ```json
  {
    "resetData": false
  }
  ```
- **Response**: `{ data: { message: string }, correlationId: string }`

#### POST /api/v1/admin/reset
Reset database
- **Auth Required**: Yes (ADMIN)
- **Response**: `{ data: { message: string }, correlationId: string }`

#### DELETE /api/v1/admin/test-data
Delete test data
- **Auth Required**: Yes (ADMIN)
- **Response**: `{ data: { deletedCount: number }, correlationId: string }`

#### GET /api/v1/admin/test-data/validate
Validate test data integrity
- **Auth Required**: Yes (ADMIN)
- **Response**: `{ data: { isValid: boolean, issues: string[] }, correlationId: string }`

---

## Status Codes

- `200 OK` - Request successful
- `201 Created` - Resource created successfully
- `204 No Content` - Request successful, no content to return
- `400 Bad Request` - Invalid request parameters
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `409 Conflict` - Resource conflict (e.g., duplicate)
- `422 Unprocessable Entity` - Validation error
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Server error
- `503 Service Unavailable` - Service temporarily unavailable

## Rate Limiting

Different rate limits apply based on endpoint type:
- Authentication: 10 requests per 15 minutes
- Request creation: 5 requests per 5 minutes
- File uploads: 20 requests per 10 minutes
- General API: 10000 requests per 15 minutes

## Pagination

Paginated endpoints support these query parameters:
- `page`: Page number (1-based)
- `pageSize` or `size`: Items per page (usually 5-50)
- `sort`: Sort field and direction (e.g., `createdAt:desc`)

Response includes pagination object:
```json
{
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "totalCount": 150,
    "totalPages": 8,
    "hasNext": true,
    "hasPrev": false
  }
}
```

## WebSocket Events (Future)

Planned real-time events:
- `request.created` - New request created
- `request.updated` - Request updated
- `request.status.changed` - Status changed
- `comment.added` - New comment added
- `assignment.changed` - Request reassigned
- `metrics.updated` - Real-time metrics update