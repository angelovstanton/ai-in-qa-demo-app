# City Services Portal API

Comprehensive API for managing municipal service requests with role-based access control, advanced search capabilities, and performance tracking.

## Features

- 🔐 **JWT Authentication** with role-based access control (5 roles)
- 🔍 **Dual Search Endpoints** for simple and complex queries
- 📊 **Performance Metrics** and analytics dashboards
- 📎 **File Attachments** with drag-and-drop support
- 🗺️ **Geolocation Support** for service requests
- 📈 **Real-time Statistics** and aggregations
- 🏃 **Optimized Performance** with caching and indexing
- 📋 **Export Capabilities** (CSV, JSON, XLSX)

## Quick Start

```bash
# Install dependencies
npm install

# Generate Prisma client
npm run db:generate

# Apply database schema
npm run db:push

# Seed database with test data
npm run db:seed

# Start development server
npm run dev
```

The API will be available at `http://localhost:3001`

## API Documentation

Interactive API documentation is available at `http://localhost:3001/api-docs`

## Search API

The API provides two search endpoints to accommodate different use cases:

### GET /api/v1/service-requests/search

Simple search using query parameters. Ideal for:
- Bookmarkable URLs
- Browser history
- Simple filtering
- Direct linking

**Example:**
```bash
curl -X GET "http://localhost:3001/api/v1/service-requests/search?status=SUBMITTED,TRIAGED&priority=HIGH&keyword=water&page=1&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Query Parameters:**
- `status` - Filter by status (comma-separated for multiple)
- `priority` - Filter by priority (LOW, MEDIUM, HIGH, URGENT)
- `category` - Filter by category
- `department` - Filter by department slug
- `assignedTo` - Filter by assigned user ID
- `location` - Filter by location text
- `keyword` - Full-text search
- `createdFrom/To` - Date range for creation
- `updatedFrom/To` - Date range for updates
- `resolvedFrom/To` - Date range for resolution
- `page` - Page number (default: 1)
- `limit` - Results per page (max: 100, default: 10)
- `sortBy` - Sort field
- `sortOrder` - Sort direction (asc/desc)

### POST /api/v1/service-requests/search

Complex search with JSON body. Ideal for:
- Advanced filtering
- Complex date ranges
- Geolocation searches
- Bulk operations
- Aggregations

**Example:**
```bash
curl -X POST "http://localhost:3001/api/v1/service-requests/search" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "filters": {
      "status": ["SUBMITTED", "TRIAGED"],
      "priority": ["HIGH", "URGENT"],
      "keyword": "water",
      "geoLocation": {
        "latitude": 42.6977,
        "longitude": 23.3219,
        "radiusKm": 5
      },
      "reportingFilters": {
        "isEmergency": true,
        "minUpvotes": 5
      }
    },
    "pagination": {
      "page": 1,
      "limit": 20
    },
    "sorting": {
      "sortBy": "priority",
      "sortOrder": "desc"
    },
    "options": {
      "includeAggregations": true
    }
  }'
```

**Advanced Filters (POST only):**
- `complexDateRanges` - Multiple date criteria with AND/OR operators
- `customFields` - Dynamic field filtering
- `bulkIds` - Search within specific request IDs (max: 1000)
- `geoLocation` - Radius-based geographic search
- `workflowStage` - Current workflow position
- `citizenFilters` - Filter by citizen interactions (upvotes, comments)
- `reportingFilters` - Advanced analytics filters
- `textSearch` - Advanced text search with fuzzy matching

### Search Suggestions

Get autocomplete suggestions for search fields:

```bash
curl -X GET "http://localhost:3001/api/v1/service-requests/search/suggestions?field=category&query=water" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Export Search Results

Export search results in various formats (staff only):

```bash
curl -X POST "http://localhost:3001/api/v1/service-requests/search/export" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "filters": {
      "status": "RESOLVED"
    },
    "format": "csv"
  }'
```

Supported formats: `csv`, `json`, `xlsx`

## Authentication

All API endpoints (except `/health` and `/api-docs`) require JWT authentication.

### Login

```bash
curl -X POST "http://localhost:3001/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

### Demo Accounts

| Role | Email | Password | Description |
|------|-------|----------|-------------|
| Citizen | john@example.com | password123 | Submit and track requests |
| Clerk | mary.clerk@city.gov | password123 | Process requests |
| Supervisor | supervisor1@city.gov | password123 | Staff management |
| Field Agent | agent1@city.gov | password123 | Field operations |
| Admin | admin@city.gov | password123 | System administration |

## Role-Based Access Control

### Search Permissions

- **Citizens**: Can only search their own requests (unless `showAll=true` for public data)
- **Staff**: Can search all requests within their department
- **Supervisors**: Can search across multiple departments
- **Admins**: Full search access across all data

### Export Permissions

- **Citizens**: No export access
- **Staff**: Can export data within their access scope
- **Admins**: Full export capabilities

## Performance Optimization

### Caching

- Search results are cached for 5 minutes
- Cache key generated from filters, pagination, and user ID
- Automatic cache cleanup for expired entries
- Admin endpoint to clear cache: `DELETE /api/v1/service-requests/search/cache`

### Database Optimization

- Indexed fields for fast searching
- Optimized query building
- Pagination to limit result sets
- Field selection to reduce payload size

### Rate Limiting

- 10,000 requests per 15 minutes per IP
- Complex queries may have additional throttling

## Response Format

### Standard Response

```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "totalCount": 100,
    "totalPages": 10
  },
  "filters": {...},
  "aggregations": {
    "byStatus": {...},
    "byPriority": {...},
    "byCategory": {...},
    "byDepartment": {...}
  },
  "metadata": {
    "searchDuration": 45,
    "cached": false,
    "queryComplexity": "simple"
  },
  "correlationId": "req_1234567890_abc123"
}
```

### Error Response

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid search parameters",
    "details": [...],
    "correlationId": "req_1234567890_abc123"
  }
}
```

## Feature Flags

The API supports feature flags for testing and gradual rollout:

- `API_Random500` - 5% random server errors
- `UI_WrongDefaultSort` - Wrong default sorting
- `API_SlowRequests` - 10% slow responses
- `API_UploadIntermittentFail` - Upload failures

Access feature flags at `/admin/flags` (admin only)

## Database Management

```bash
# View database in browser
npm run db:studio

# Reset and reseed database
npm run db:reset

# Generate Prisma types
npm run db:generate

# Apply schema changes
npm run db:push
```

## Development

```bash
# Development with hot reload
npm run dev

# Build for production
npm run build

# Run production server
npm start

# Run tests
npm test

# Lint code
npm run lint
```

## Environment Variables

```env
# Server
PORT=3001
NODE_ENV=development

# Database
DATABASE_URL="file:./dev.db"

# JWT
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_DIR=./uploads
```

## API Endpoints

### Service Requests
- `GET /api/v1/requests` - List requests
- `POST /api/v1/requests` - Create request
- `GET /api/v1/requests/:id` - Get request details
- `PATCH /api/v1/requests/:id` - Update request
- `POST /api/v1/requests/:id/status` - Change status
- `POST /api/v1/requests/:id/comments` - Add comment
- `POST /api/v1/requests/:id/upvote` - Toggle upvote
- `POST /api/v1/requests/:id/assign` - Assign request

### Search
- `GET /api/v1/service-requests/search` - Simple search
- `POST /api/v1/service-requests/search` - Complex search
- `GET /api/v1/service-requests/search/suggestions` - Search suggestions
- `POST /api/v1/service-requests/search/export` - Export results
- `DELETE /api/v1/service-requests/search/cache` - Clear cache

### Attachments
- `POST /api/v1/requests/:id/attachments` - Upload attachment
- `GET /api/v1/attachments/:id` - Download attachment
- `DELETE /api/v1/attachments/:id` - Delete attachment

### Departments
- `GET /api/v1/departments` - List departments
- `GET /api/v1/departments/:id/staff` - Get department staff
- `GET /api/v1/departments/:id/metrics` - Get department metrics

### Metrics & Analytics
- `GET /api/v1/metrics/summary` - Overall metrics
- `GET /api/v1/supervisor/performance` - Staff performance
- `GET /api/v1/dashboard/stats` - Dashboard statistics
- `GET /api/v1/rankings` - Service rankings

### Administration
- `GET /api/v1/admin/flags` - Feature flags
- `POST /api/v1/admin/flags` - Update flags
- `GET /api/v1/admin/system-health` - System health
- `POST /api/v1/admin/seed` - Seed test data

## Troubleshooting

### Common Issues

1. **Database locked error**
   - Solution: Close Prisma Studio or other database connections

2. **JWT token expired**
   - Solution: Login again to get a new token

3. **CORS errors**
   - Solution: Check the CORS configuration in server.ts

4. **File upload failures**
   - Solution: Check file size limits and upload directory permissions

5. **Search performance issues**
   - Solution: Clear cache, check database indexes

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests
5. Submit a pull request

## License

MIT

## Support

For issues and questions, please create an issue in the GitHub repository.