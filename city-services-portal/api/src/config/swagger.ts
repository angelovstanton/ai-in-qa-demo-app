import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'City Services Portal API',
      version: '1.0.0',
      description: 'Comprehensive API for managing city service requests, staff performance, and municipal services with role-based access control',
    },
    servers: [
      {
        url: 'http://localhost:3001',
        description: 'Development server',
      },
    ],
    tags: [
      { name: 'Authentication', description: 'User authentication and registration' },
      { name: 'Service Requests', description: 'Service request management' },
      { name: 'Staff Management', description: 'Staff account creation and management' },
      { name: 'Role Management', description: 'User role assignment and management' },
      { name: 'Permission Management', description: 'Role permissions and access control' },
      { name: 'Admin', description: 'Administrative operations' },
      { name: 'Supervisor', description: 'Supervisor functionality' },
      { name: 'Field Agent', description: 'Field agent operations' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'object',
              properties: {
                code: {
                  type: 'string',
                  example: 'VALIDATION_ERROR'
                },
                message: {
                  type: 'string',
                  example: 'Invalid input data'
                },
                details: {
                  type: 'object',
                  description: 'Additional error details'
                },
                correlationId: {
                  type: 'string',
                  format: 'uuid',
                  example: '123e4567-e89b-12d3-a456-426614174000'
                }
              },
              required: ['code', 'message', 'correlationId']
            }
          }
        },
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid'
            },
            name: {
              type: 'string'
            },
            email: {
              type: 'string',
              format: 'email'
            },
            role: {
              type: 'string',
              enum: ['CITIZEN', 'CLERK', 'FIELD_AGENT', 'SUPERVISOR', 'ADMIN']
            },
            firstName: {
              type: 'string'
            },
            lastName: {
              type: 'string'
            },
            phone: {
              type: 'string'
            },
            department: {
              $ref: '#/components/schemas/Department'
            }
          }
        },
        Department: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid'
            },
            name: {
              type: 'string'
            },
            slug: {
              type: 'string'
            },
            description: {
              type: 'string'
            },
            isActive: {
              type: 'boolean'
            }
          }
        },
        ServiceRequest: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid'
            },
            code: {
              type: 'string',
              example: 'REQ-2024-001'
            },
            title: {
              type: 'string'
            },
            description: {
              type: 'string'
            },
            category: {
              type: 'string'
            },
            priority: {
              type: 'string',
              enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT']
            },
            status: {
              type: 'string',
              enum: ['DRAFT', 'SUBMITTED', 'IN_REVIEW', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'CANCELLED']
            },
            streetAddress: {
              type: 'string'
            },
            city: {
              type: 'string'
            },
            postalCode: {
              type: 'string'
            },
            locationText: {
              type: 'string'
            },
            latitude: {
              type: 'number'
            },
            longitude: {
              type: 'number'
            },
            contactMethod: {
              type: 'string',
              enum: ['EMAIL', 'PHONE', 'SMS']
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time'
            },
            user: {
              $ref: '#/components/schemas/User'
            },
            assignedTo: {
              $ref: '#/components/schemas/User'
            },
            department: {
              $ref: '#/components/schemas/Department'
            },
            upvotes: {
              type: 'integer'
            },
            comments: {
              type: 'integer'
            }
          }
        },
        Comment: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid'
            },
            content: {
              type: 'string'
            },
            isPublic: {
              type: 'boolean'
            },
            isInternal: {
              type: 'boolean'
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            },
            user: {
              $ref: '#/components/schemas/User'
            }
          }
        },
        QualityReview: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid'
            },
            requestId: {
              type: 'string',
              format: 'uuid'
            },
            qualityScore: {
              type: 'number',
              minimum: 1,
              maximum: 10
            },
            communicationScore: {
              type: 'number',
              minimum: 1,
              maximum: 10
            },
            technicalAccuracyScore: {
              type: 'number',
              minimum: 1,
              maximum: 10
            },
            timelinessScore: {
              type: 'number',
              minimum: 1,
              maximum: 10
            },
            citizenSatisfactionScore: {
              type: 'number',
              minimum: 1,
              maximum: 10
            },
            improvementSuggestions: {
              type: 'string'
            },
            followUpRequired: {
              type: 'boolean'
            },
            reviewStatus: {
              type: 'string',
              enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED']
            }
          }
        },
        PerformanceGoal: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid'
            },
            userId: {
              type: 'string',
              format: 'uuid'
            },
            title: {
              type: 'string'
            },
            description: {
              type: 'string'
            },
            targetValue: {
              type: 'number'
            },
            currentValue: {
              type: 'number'
            },
            unit: {
              type: 'string'
            },
            dueDate: {
              type: 'string',
              format: 'date-time'
            },
            status: {
              type: 'string',
              enum: ['ACTIVE', 'ACHIEVED', 'MISSED', 'PAUSED']
            },
            priority: {
              type: 'string',
              enum: ['LOW', 'MEDIUM', 'HIGH']
            }
          }
        },
        Pagination: {
          type: 'object',
          properties: {
            page: {
              type: 'integer'
            },
            totalPages: {
              type: 'integer'
            },
            totalCount: {
              type: 'integer'
            },
            hasNext: {
              type: 'boolean'
            },
            hasPrev: {
              type: 'boolean'
            }
          }
        },
        Attachment: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid'
            },
            filename: {
              type: 'string'
            },
            originalName: {
              type: 'string'
            },
            mime: {
              type: 'string'
            },
            size: {
              type: 'integer'
            },
            requestId: {
              type: 'string',
              format: 'uuid'
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        WorkloadAssignment: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid'
            },
            requestId: {
              type: 'string',
              format: 'uuid'
            },
            assignedTo: {
              type: 'string',
              format: 'uuid'
            },
            assignedFrom: {
              type: 'string',
              format: 'uuid'
            },
            assignedBy: {
              type: 'string',
              format: 'uuid'
            },
            assignmentReason: {
              type: 'string'
            },
            estimatedEffort: {
              type: 'number'
            },
            skillsRequired: {
              type: 'array',
              items: {
                type: 'string'
              }
            },
            priorityWeight: {
              type: 'number'
            },
            isActive: {
              type: 'boolean'
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        StaffPerformance: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid'
            },
            userId: {
              type: 'string',
              format: 'uuid'
            },
            departmentId: {
              type: 'string',
              format: 'uuid'
            },
            performancePeriod: {
              type: 'string'
            },
            completedRequests: {
              type: 'integer'
            },
            averageHandlingTime: {
              type: 'number'
            },
            qualityScore: {
              type: 'number'
            },
            productivityScore: {
              type: 'number'
            },
            citizenSatisfactionRating: {
              type: 'number'
            },
            user: {
              $ref: '#/components/schemas/User'
            },
            department: {
              $ref: '#/components/schemas/Department'
            }
          }
        },
        FeatureFlag: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid'
            },
            key: {
              type: 'string'
            },
            enabled: {
              type: 'boolean'
            },
            description: {
              type: 'string'
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        FieldWorkOrder: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid'
            },
            requestId: {
              type: 'string',
              format: 'uuid'
            },
            assignedAgentId: {
              type: 'string',
              format: 'uuid'
            },
            supervisorId: {
              type: 'string',
              format: 'uuid'
            },
            priority: {
              type: 'string',
              enum: ['EMERGENCY', 'HIGH', 'NORMAL', 'LOW']
            },
            taskType: {
              type: 'string',
              example: 'Street Light Repair'
            },
            status: {
              type: 'string',
              enum: ['ASSIGNED', 'EN_ROUTE', 'ON_SITE', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']
            },
            estimatedDuration: {
              type: 'integer',
              description: 'Estimated duration in minutes'
            },
            actualDuration: {
              type: 'integer',
              description: 'Actual duration in minutes'
            },
            gpsLat: {
              type: 'number',
              format: 'double'
            },
            gpsLng: {
              type: 'number',
              format: 'double'
            },
            navigationLink: {
              type: 'string',
              format: 'uri'
            },
            checkInTime: {
              type: 'string',
              format: 'date-time'
            },
            checkOutTime: {
              type: 'string',
              format: 'date-time'
            },
            completionNotes: {
              type: 'string'
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            },
            request: {
              $ref: '#/components/schemas/ServiceRequest'
            },
            assignedAgent: {
              $ref: '#/components/schemas/User'
            }
          }
        },
        AgentStatus: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid'
            },
            agentId: {
              type: 'string',
              format: 'uuid'
            },
            status: {
              type: 'string',
              enum: ['AVAILABLE', 'BUSY', 'BREAK', 'OFF_DUTY', 'EN_ROUTE']
            },
            currentTaskId: {
              type: 'string',
              format: 'uuid',
              nullable: true
            },
            currentLocation: {
              type: 'object',
              properties: {
                lat: { type: 'number' },
                lng: { type: 'number' },
                accuracy: { type: 'number' }
              }
            },
            vehicleStatus: {
              type: 'string',
              enum: ['IN_TRANSIT', 'PARKED', 'MAINTENANCE'],
              nullable: true
            },
            lastUpdateTime: {
              type: 'string',
              format: 'date-time'
            },
            activeWorkOrder: {
              $ref: '#/components/schemas/FieldWorkOrder'
            }
          }
        },
        AgentTimeTracking: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid'
            },
            workOrderId: {
              type: 'string',
              format: 'uuid'
            },
            agentId: {
              type: 'string',
              format: 'uuid'
            },
            timeType: {
              type: 'string',
              enum: ['TRAVEL', 'SETUP', 'WORK', 'DOCUMENTATION', 'BREAK']
            },
            startTime: {
              type: 'string',
              format: 'date-time'
            },
            endTime: {
              type: 'string',
              format: 'date-time',
              nullable: true
            },
            duration: {
              type: 'integer',
              description: 'Duration in minutes',
              nullable: true
            },
            notes: {
              type: 'string',
              nullable: true
            },
            workOrder: {
              $ref: '#/components/schemas/FieldWorkOrder'
            }
          }
        },
        FieldPhoto: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid'
            },
            workOrderId: {
              type: 'string',
              format: 'uuid'
            },
            agentId: {
              type: 'string',
              format: 'uuid'
            },
            photoType: {
              type: 'string',
              enum: ['BEFORE', 'DURING', 'AFTER', 'ISSUE', 'SAFETY']
            },
            filename: {
              type: 'string'
            },
            caption: {
              type: 'string',
              nullable: true
            },
            gpsLat: {
              type: 'number',
              format: 'double',
              nullable: true
            },
            gpsLng: {
              type: 'number',
              format: 'double',
              nullable: true
            },
            timestamp: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        LeaderboardEntry: {
          type: 'object',
          properties: {
            rank: {
              type: 'integer'
            },
            userId: {
              type: 'string',
              format: 'uuid'
            },
            userName: {
              type: 'string'
            },
            overallScore: {
              type: 'number'
            },
            contributionScore: {
              type: 'number'
            },
            engagementScore: {
              type: 'number'
            },
            qualityScore: {
              type: 'number'
            },
            requestsSubmitted: {
              type: 'integer'
            },
            requestsApproved: {
              type: 'integer'
            },
            commentsPosted: {
              type: 'integer'
            },
            upvotesReceived: {
              type: 'integer'
            },
            badges: {
              type: 'array',
              items: {
                type: 'object'
              }
            },
            change: {
              type: 'integer',
              description: 'Rank change from previous period'
            }
          }
        },
        CommunityStats: {
          type: 'object',
          properties: {
            period: {
              type: 'string',
              enum: ['daily', 'weekly', 'monthly', 'yearly', 'all-time']
            },
            periodStart: {
              type: 'string',
              format: 'date-time'
            },
            periodEnd: {
              type: 'string',
              format: 'date-time'
            },
            requestsSubmitted: {
              type: 'integer'
            },
            requestsApproved: {
              type: 'integer'
            },
            requestsResolved: {
              type: 'integer'
            },
            commentsPosted: {
              type: 'integer'
            },
            upvotesReceived: {
              type: 'integer'
            },
            upvotesGiven: {
              type: 'integer'
            },
            contributionScore: {
              type: 'number'
            },
            engagementScore: {
              type: 'number'
            },
            qualityScore: {
              type: 'number'
            },
            overallScore: {
              type: 'number'
            },
            rank: {
              type: 'integer'
            }
          }
        },
        CategoryStats: {
          type: 'object',
          properties: {
            category: {
              type: 'string'
            },
            totalRequests: {
              type: 'integer'
            },
            approvedRequests: {
              type: 'integer'
            },
            averageResolutionTime: {
              type: 'number'
            },
            topContributors: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/LeaderboardEntry'
              }
            },
            trends: {
              type: 'array',
              items: {
                type: 'object'
              }
            }
          }
        }
      },
      responses: {
        ValidationError: {
          description: 'Validation error',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        },
        Unauthorized: {
          description: 'Authentication required',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        },
        Forbidden: {
          description: 'Insufficient permissions',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        },
        NotFound: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        },
        Conflict: {
          description: 'Resource conflict',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        }
      }
    },
    paths: {
      // Health Check
      '/health': {
        get: {
          tags: ['System'],
          summary: 'Health check endpoint',
          description: 'Returns the health status of the API',
          responses: {
            '200': {
              description: 'API is healthy',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      ok: { type: 'boolean', example: true },
                      correlationId: { type: 'string', format: 'uuid' }
                    }
                  }
                }
              }
            }
          }
        }
      },

      // Authentication Endpoints
      '/api/v1/auth/register': {
        post: {
          tags: ['Authentication'],
          summary: 'Register a new user',
          description: 'Creates a new user account with CITIZEN role by default',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    name: { type: 'string', minLength: 2, maxLength: 100, example: 'John Doe' },
                    email: { type: 'string', format: 'email', example: 'john.doe@example.com' },
                    password: { type: 'string', minLength: 6, example: 'password123' }
                  },
                  required: ['name', 'email', 'password']
                }
              }
            }
          },
          responses: {
            '201': {
              description: 'User registered successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      accessToken: { type: 'string' },
                      user: { $ref: '#/components/schemas/User' },
                      correlationId: { type: 'string' }
                    }
                  }
                }
              }
            },
            '400': { $ref: '#/components/responses/ValidationError' },
            '409': { $ref: '#/components/responses/Conflict' }
          }
        }
      },
      '/api/v1/auth/login': {
        post: {
          tags: ['Authentication'],
          summary: 'User login',
          description: 'Authenticates user and returns access token',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    email: { type: 'string', format: 'email', example: 'john.doe@example.com' },
                    password: { type: 'string', example: 'password123' }
                  },
                  required: ['email', 'password']
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'Login successful',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      accessToken: { type: 'string' },
                      user: { $ref: '#/components/schemas/User' },
                      correlationId: { type: 'string' }
                    }
                  }
                }
              }
            },
            '401': { $ref: '#/components/responses/Unauthorized' }
          }
        }
      },
      '/api/v1/auth/me': {
        get: {
          tags: ['Authentication'],
          summary: 'Get current user profile',
          description: 'Returns the authenticated user profile with department info',
          security: [{ bearerAuth: [] }],
          responses: {
            '200': {
              description: 'User profile retrieved successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      user: { $ref: '#/components/schemas/User' },
                      correlationId: { type: 'string' }
                    }
                  }
                }
              }
            },
            '401': { $ref: '#/components/responses/Unauthorized' }
          }
        }
      },
      '/api/v1/auth/profile': {
        patch: {
          tags: ['Authentication'],
          summary: 'Update user profile',
          description: 'Updates user profile fields',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    firstName: { type: 'string' },
                    lastName: { type: 'string' },
                    phone: { type: 'string' }
                  }
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'Profile updated successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      user: { $ref: '#/components/schemas/User' },
                      correlationId: { type: 'string' }
                    }
                  }
                }
              }
            },
            '400': { $ref: '#/components/responses/ValidationError' },
            '401': { $ref: '#/components/responses/Unauthorized' }
          }
        }
      },

      // Service Requests
      '/api/v1/requests': {
        get: {
          tags: ['Service Requests'],
          summary: 'List service requests',
          description: 'Get paginated list of service requests with filtering and sorting',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
            { name: 'pageSize', in: 'query', schema: { type: 'integer', default: 20 } },
            { name: 'status', in: 'query', schema: { type: 'string', enum: ['DRAFT', 'SUBMITTED', 'IN_REVIEW', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'CANCELLED'] } },
            { name: 'category', in: 'query', schema: { type: 'string' } },
            { name: 'priority', in: 'query', schema: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] } },
            { name: 'search', in: 'query', schema: { type: 'string' }, description: 'Search in title and description' },
            { name: 'sort', in: 'query', schema: { type: 'string', default: 'createdAt:desc' } }
          ],
          responses: {
            '200': {
              description: 'Service requests retrieved successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      data: { type: 'array', items: { $ref: '#/components/schemas/ServiceRequest' } },
                      pagination: { $ref: '#/components/schemas/Pagination' },
                      correlationId: { type: 'string' }
                    }
                  }
                }
              }
            },
            '401': { $ref: '#/components/responses/Unauthorized' }
          }
        },
        post: {
          tags: ['Service Requests'],
          summary: 'Create service request',
          description: 'Create a new service request (Citizens and Clerks only)',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    title: { type: 'string', minLength: 5, maxLength: 120 },
                    description: { type: 'string', minLength: 30 },
                    category: { type: 'string' },
                    priority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'], default: 'MEDIUM' },
                    locationText: { type: 'string', minLength: 1 },
                    streetAddress: { type: 'string' },
                    city: { type: 'string' },
                    postalCode: { type: 'string' },
                    latitude: { type: 'number' },
                    longitude: { type: 'number' },
                    contactMethod: { type: 'string', enum: ['EMAIL', 'PHONE', 'SMS'] },
                    email: { type: 'string', format: 'email' },
                    phone: { type: 'string' }
                  },
                  required: ['title', 'description', 'category', 'locationText']
                }
              }
            }
          },
          responses: {
            '201': {
              description: 'Service request created successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      data: { $ref: '#/components/schemas/ServiceRequest' },
                      correlationId: { type: 'string' }
                    }
                  }
                }
              }
            },
            '400': { $ref: '#/components/responses/ValidationError' },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '403': { $ref: '#/components/responses/Forbidden' }
          }
        }
      },
      '/api/v1/requests/{id}': {
        get: {
          tags: ['Service Requests'],
          summary: 'Get service request details',
          description: 'Get detailed information about a specific service request',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
          ],
          responses: {
            '200': {
              description: 'Service request retrieved successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      data: { $ref: '#/components/schemas/ServiceRequest' },
                      correlationId: { type: 'string' }
                    }
                  }
                }
              }
            },
            '404': { $ref: '#/components/responses/NotFound' },
            '401': { $ref: '#/components/responses/Unauthorized' }
          }
        },
        patch: {
          tags: ['Service Requests'],
          summary: 'Update service request',
          description: 'Update service request fields (role-based permissions apply)',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
            { name: 'If-Match', in: 'header', required: false, schema: { type: 'string' }, description: 'Version for optimistic locking' }
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    title: { type: 'string', minLength: 5, maxLength: 120 },
                    description: { type: 'string', minLength: 30 },
                    priority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] },
                    locationText: { type: 'string' },
                    streetAddress: { type: 'string' },
                    city: { type: 'string' },
                    postalCode: { type: 'string' },
                    preferredDate: { type: 'string', format: 'date-time' },
                    preferredTime: { type: 'string' }
                  }
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'Service request updated successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      data: { $ref: '#/components/schemas/ServiceRequest' },
                      correlationId: { type: 'string' }
                    }
                  }
                }
              }
            },
            '400': { $ref: '#/components/responses/ValidationError' },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '403': { $ref: '#/components/responses/Forbidden' },
            '404': { $ref: '#/components/responses/NotFound' }
          }
        }
      },
      '/api/v1/requests/{id}/status': {
        post: {
          tags: ['Service Requests'],
          summary: 'Update request status',
          description: 'Change the status of a service request using state machine validation',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    action: { type: 'string', enum: ['SUBMIT', 'START_REVIEW', 'APPROVE', 'REJECT', 'START_WORK', 'RESOLVE', 'CLOSE', 'CANCEL'] },
                    comment: { type: 'string', description: 'Optional comment explaining the status change' }
                  },
                  required: ['action']
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'Status updated successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      data: { $ref: '#/components/schemas/ServiceRequest' },
                      correlationId: { type: 'string' }
                    }
                  }
                }
              }
            },
            '400': { $ref: '#/components/responses/ValidationError' },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '403': { $ref: '#/components/responses/Forbidden' }
          }
        }
      },
      '/api/v1/requests/{id}/comments': {
        post: {
          tags: ['Service Requests'],
          summary: 'Add comment to request',
          description: 'Add a public or internal comment to a service request',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    content: { type: 'string', minLength: 1 },
                    visibility: { type: 'string', enum: ['PUBLIC', 'INTERNAL'], default: 'PUBLIC' }
                  },
                  required: ['content']
                }
              }
            }
          },
          responses: {
            '201': {
              description: 'Comment added successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      data: { $ref: '#/components/schemas/Comment' },
                      correlationId: { type: 'string' }
                    }
                  }
                }
              }
            },
            '400': { $ref: '#/components/responses/ValidationError' },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '404': { $ref: '#/components/responses/NotFound' }
          }
        }
      },
      '/api/v1/requests/{id}/upvote': {
        post: {
          tags: ['Service Requests'],
          summary: 'Upvote request',
          description: 'Add upvote to a service request',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
          ],
          responses: {
            '200': {
              description: 'Request upvoted successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      data: { 
                        type: 'object',
                        properties: {
                          upvoteCount: { type: 'integer' }
                        }
                      },
                      correlationId: { type: 'string' }
                    }
                  }
                }
              }
            },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '404': { $ref: '#/components/responses/NotFound' }
          }
        },
        delete: {
          tags: ['Service Requests'],
          summary: 'Remove upvote',
          description: 'Remove upvote from a service request',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
          ],
          responses: {
            '200': {
              description: 'Upvote removed successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      data: { 
                        type: 'object',
                        properties: {
                          upvoteCount: { type: 'integer' }
                        }
                      },
                      correlationId: { type: 'string' }
                    }
                  }
                }
              }
            },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '404': { $ref: '#/components/responses/NotFound' }
          }
        }
      },
      '/api/v1/requests/{id}/assign': {
        post: {
          tags: ['Service Requests'],
          summary: 'Assign request',
          description: 'Assign or reassign a service request to a user',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    assigneeId: { type: 'string', format: 'uuid' }
                  },
                  required: ['assigneeId']
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'Request assigned successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      data: { $ref: '#/components/schemas/ServiceRequest' },
                      correlationId: { type: 'string' }
                    }
                  }
                }
              }
            },
            '400': { $ref: '#/components/responses/ValidationError' },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '403': { $ref: '#/components/responses/Forbidden' },
            '404': { $ref: '#/components/responses/NotFound' }
          }
        }
      },
      '/api/v1/requests/bulk': {
        post: {
          tags: ['Service Requests'],
          summary: 'Bulk create requests',
          description: 'Create multiple service requests in one operation',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    requests: {
                      type: 'array',
                      maxItems: 100,
                      items: {
                        type: 'object',
                        properties: {
                          title: { type: 'string', minLength: 5, maxLength: 120 },
                          description: { type: 'string', minLength: 30 },
                          category: { type: 'string' },
                          priority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] },
                          locationText: { type: 'string' }
                        },
                        required: ['title', 'description', 'category', 'locationText']
                      }
                    }
                  },
                  required: ['requests']
                }
              }
            }
          },
          responses: {
            '201': {
              description: 'Bulk requests created',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      data: {
                        type: 'object',
                        properties: {
                          created: { type: 'array', items: { $ref: '#/components/schemas/ServiceRequest' } },
                          errors: { type: 'array', items: { type: 'object' } }
                        }
                      },
                      correlationId: { type: 'string' }
                    }
                  }
                }
              }
            },
            '400': { $ref: '#/components/responses/ValidationError' },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '403': { $ref: '#/components/responses/Forbidden' }
          }
        },
        delete: {
          tags: ['Service Requests'],
          summary: 'Bulk delete requests',
          description: 'Delete multiple service requests (Admin only)',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    ids: { type: 'array', items: { type: 'string', format: 'uuid' } }
                  },
                  required: ['ids']
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'Requests deleted successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      data: {
                        type: 'object',
                        properties: {
                          deleted: { type: 'integer' }
                        }
                      },
                      correlationId: { type: 'string' }
                    }
                  }
                }
              }
            },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '403': { $ref: '#/components/responses/Forbidden' }
          }
        }
      },

      // Supervisor Endpoints
      '/api/v1/supervisor/staff-performance': {
        get: {
          tags: ['Supervisor'],
          summary: 'Get staff performance data',
          description: 'Retrieve performance metrics for department staff members',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
            { name: 'size', in: 'query', schema: { type: 'integer', default: 20 } },
            { name: 'performancePeriod', in: 'query', schema: { type: 'string', enum: ['current', 'last_month', 'last_quarter'] } },
            { name: 'sort', in: 'query', schema: { type: 'string', default: 'qualityScore:desc' } }
          ],
          responses: {
            '200': {
              description: 'Staff performance data retrieved successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      data: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            id: { type: 'string' },
                            user: { $ref: '#/components/schemas/User' },
                            averageHandlingTime: { type: 'number' },
                            completedRequests: { type: 'integer' },
                            qualityScore: { type: 'number' },
                            citizenSatisfactionRating: { type: 'number' },
                            productivityScore: { type: 'number' }
                          }
                        }
                      },
                      pagination: { $ref: '#/components/schemas/Pagination' },
                      correlationId: { type: 'string' }
                    }
                  }
                }
              }
            },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '403': { $ref: '#/components/responses/Forbidden' }
          }
        }
      },
      '/api/v1/supervisor/quality-reviews': {
        get: {
          tags: ['Supervisor'],
          summary: 'List quality reviews',
          description: 'Get paginated list of quality reviews with filtering',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
            { name: 'size', in: 'query', schema: { type: 'integer', default: 10 } },
            { name: 'reviewStatus', in: 'query', schema: { type: 'string', enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED'] } }
          ],
          responses: {
            '200': {
              description: 'Quality reviews retrieved successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      data: { type: 'array', items: { $ref: '#/components/schemas/QualityReview' } },
                      pagination: { $ref: '#/components/schemas/Pagination' },
                      correlationId: { type: 'string' }
                    }
                  }
                }
              }
            },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '403': { $ref: '#/components/responses/Forbidden' }
          }
        },
        post: {
          tags: ['Supervisor'],
          summary: 'Create quality review',
          description: 'Create a new quality review for a service request',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    requestId: { type: 'string', format: 'uuid' },
                    qualityScore: { type: 'number', minimum: 1, maximum: 10 },
                    communicationScore: { type: 'number', minimum: 1, maximum: 10 },
                    technicalAccuracyScore: { type: 'number', minimum: 1, maximum: 10 },
                    timelinessScore: { type: 'number', minimum: 1, maximum: 10 },
                    citizenSatisfactionScore: { type: 'number', minimum: 1, maximum: 10 },
                    improvementSuggestions: { type: 'string' },
                    followUpRequired: { type: 'boolean', default: false },
                    calibrationSession: { type: 'string' }
                  },
                  required: ['requestId', 'qualityScore', 'communicationScore', 'technicalAccuracyScore', 'timelinessScore', 'citizenSatisfactionScore']
                }
              }
            }
          },
          responses: {
            '201': {
              description: 'Quality review created successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      data: { $ref: '#/components/schemas/QualityReview' },
                      correlationId: { type: 'string' }
                    }
                  }
                }
              }
            },
            '400': { $ref: '#/components/responses/ValidationError' },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '403': { $ref: '#/components/responses/Forbidden' }
          }
        }
      },
      '/api/v1/supervisor/performance-goals': {
        get: {
          tags: ['Supervisor'],
          summary: 'List performance goals',
          description: 'Get paginated list of performance goals with filtering',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
            { name: 'pageSize', in: 'query', schema: { type: 'integer', default: 10 } },
            { name: 'status', in: 'query', schema: { type: 'string', enum: ['ACTIVE', 'ACHIEVED', 'MISSED', 'PAUSED'] } },
            { name: 'priority', in: 'query', schema: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH'] } }
          ],
          responses: {
            '200': {
              description: 'Performance goals retrieved successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      data: { type: 'array', items: { $ref: '#/components/schemas/PerformanceGoal' } },
                      pagination: { $ref: '#/components/schemas/Pagination' },
                      correlationId: { type: 'string' }
                    }
                  }
                }
              }
            },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '403': { $ref: '#/components/responses/Forbidden' }
          }
        },
        post: {
          tags: ['Supervisor'],
          summary: 'Create performance goal',
          description: 'Create a new performance goal for a staff member',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    userId: { type: 'string', format: 'uuid' },
                    title: { type: 'string', minLength: 5, maxLength: 200 },
                    description: { type: 'string', minLength: 10, maxLength: 1000 },
                    targetValue: { type: 'number' },
                    currentValue: { type: 'number', default: 0 },
                    unit: { type: 'string', default: 'count' },
                    dueDate: { type: 'string', format: 'date-time' },
                    priority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH'], default: 'MEDIUM' },
                    status: { type: 'string', enum: ['ACTIVE', 'PAUSED'], default: 'ACTIVE' }
                  },
                  required: ['userId', 'title', 'description', 'dueDate']
                }
              }
            }
          },
          responses: {
            '201': {
              description: 'Performance goal created successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      data: { $ref: '#/components/schemas/PerformanceGoal' },
                      correlationId: { type: 'string' }
                    }
                  }
                }
              }
            },
            '400': { $ref: '#/components/responses/ValidationError' },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '403': { $ref: '#/components/responses/Forbidden' }
          }
        }
      },
      '/api/v1/supervisor/performance-goals/{id}': {
        put: {
          tags: ['Supervisor'],
          summary: 'Update performance goal',
          description: 'Update an existing performance goal',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    title: { type: 'string', minLength: 5, maxLength: 200 },
                    description: { type: 'string', minLength: 10, maxLength: 1000 },
                    targetValue: { type: 'number' },
                    currentValue: { type: 'number' },
                    unit: { type: 'string' },
                    dueDate: { type: 'string', format: 'date-time' },
                    priority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH'] },
                    status: { type: 'string', enum: ['ACTIVE', 'ACHIEVED', 'MISSED', 'PAUSED'] }
                  }
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'Performance goal updated successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      data: { $ref: '#/components/schemas/PerformanceGoal' },
                      correlationId: { type: 'string' }
                    }
                  }
                }
              }
            },
            '400': { $ref: '#/components/responses/ValidationError' },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '403': { $ref: '#/components/responses/Forbidden' },
            '404': { $ref: '#/components/responses/NotFound' }
          }
        }
      },
      '/api/v1/supervisor/department-metrics': {
        get: {
          tags: ['Supervisor'],
          summary: 'Get department metrics',
          description: 'Retrieve department performance metrics with filtering and time periods',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
            { name: 'size', in: 'query', schema: { type: 'integer', default: 20 } },
            { name: 'metricType', in: 'query', schema: { type: 'string', enum: ['avgResolutionTime', 'slaCompliance', 'firstCallResolution', 'satisfaction', 'requestVolume', 'escalationRate'] } },
            { name: 'period', in: 'query', schema: { type: 'string', enum: ['daily', 'weekly', 'monthly', 'quarterly'] } }
          ],
          responses: {
            '200': {
              description: 'Department metrics retrieved successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      data: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            id: { type: 'string' },
                            metricType: { type: 'string' },
                            value: { type: 'number' },
                            period: { type: 'string' },
                            periodStart: { type: 'string', format: 'date-time' },
                            periodEnd: { type: 'string', format: 'date-time' },
                            department: { $ref: '#/components/schemas/Department' }
                          }
                        }
                      },
                      pagination: { $ref: '#/components/schemas/Pagination' },
                      correlationId: { type: 'string' }
                    }
                  }
                }
              }
            },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '403': { $ref: '#/components/responses/Forbidden' }
          }
        }
      },

      // Admin Endpoints
      '/api/v1/admin/flags': {
        get: {
          tags: ['Admin'],
          summary: 'Get feature flags',
          description: 'Retrieve all feature flags configuration',
          security: [{ bearerAuth: [] }],
          responses: {
            '200': {
              description: 'Feature flags retrieved successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      data: {
                        type: 'object',
                        additionalProperties: {
                          type: 'object',
                          properties: {
                            enabled: { type: 'boolean' },
                            description: { type: 'string' }
                          }
                        }
                      },
                      correlationId: { type: 'string' }
                    }
                  }
                }
              }
            },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '403': { $ref: '#/components/responses/Forbidden' }
          }
        }
      },
      '/api/v1/admin/flags/{key}': {
        patch: {
          tags: ['Admin'],
          summary: 'Update feature flag',
          description: 'Enable or disable a specific feature flag',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'key', in: 'path', required: true, schema: { type: 'string' } }
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    enabled: { type: 'boolean' }
                  },
                  required: ['enabled']
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'Feature flag updated successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      data: {
                        type: 'object',
                        properties: {
                          key: { type: 'string' },
                          enabled: { type: 'boolean' }
                        }
                      },
                      correlationId: { type: 'string' }
                    }
                  }
                }
              }
            },
            '400': { $ref: '#/components/responses/ValidationError' },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '403': { $ref: '#/components/responses/Forbidden' }
          }
        }
      },

      // Departments
      '/api/departments': {
        get: {
          tags: ['Departments'],
          summary: 'List all departments',
          description: 'Get all departments with filtering and pagination',
          parameters: [
            { name: 'name', in: 'query', schema: { type: 'string' }, description: 'Filter by department name' },
            { name: 'slug', in: 'query', schema: { type: 'string' }, description: 'Filter by department slug' },
            { name: 'search', in: 'query', schema: { type: 'string' }, description: 'Search in name and slug' },
            { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
            { name: 'pageSize', in: 'query', schema: { type: 'integer', default: 10 } },
            { name: 'sortBy', in: 'query', schema: { type: 'string', enum: ['name', 'slug', 'id'], default: 'name' } },
            { name: 'sortOrder', in: 'query', schema: { type: 'string', enum: ['asc', 'desc'], default: 'asc' } }
          ],
          responses: {
            '200': {
              description: 'Departments retrieved successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      data: { type: 'array', items: { $ref: '#/components/schemas/Department' } },
                      pagination: { $ref: '#/components/schemas/Pagination' },
                      correlationId: { type: 'string' }
                    }
                  }
                }
              }
            }
          }
        },
        post: {
          tags: ['Departments'],
          summary: 'Create new department',
          description: 'Create a new department (Admin only)',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    name: { type: 'string', minLength: 2, maxLength: 100 },
                    slug: { type: 'string', pattern: '^[a-z0-9-]+$' }
                  },
                  required: ['name', 'slug']
                }
              }
            }
          },
          responses: {
            '201': {
              description: 'Department created successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      data: { $ref: '#/components/schemas/Department' },
                      correlationId: { type: 'string' }
                    }
                  }
                }
              }
            },
            '400': { $ref: '#/components/responses/ValidationError' },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '403': { $ref: '#/components/responses/Forbidden' }
          }
        }
      },
      '/api/departments/{id}': {
        get: {
          tags: ['Departments'],
          summary: 'Get department by ID or slug',
          description: 'Get detailed information about a specific department',
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'Department ID (UUID) or slug' }
          ],
          responses: {
            '200': {
              description: 'Department retrieved successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      data: { $ref: '#/components/schemas/Department' },
                      correlationId: { type: 'string' }
                    }
                  }
                }
              }
            },
            '404': { $ref: '#/components/responses/NotFound' }
          }
        },
        patch: {
          tags: ['Departments'],
          summary: 'Update department',
          description: 'Update department information (Admin only)',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'Department ID (UUID) or slug' }
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    name: { type: 'string', minLength: 2, maxLength: 100 },
                    slug: { type: 'string', pattern: '^[a-z0-9-]+$' }
                  }
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'Department updated successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      data: { $ref: '#/components/schemas/Department' },
                      correlationId: { type: 'string' }
                    }
                  }
                }
              }
            },
            '400': { $ref: '#/components/responses/ValidationError' },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '403': { $ref: '#/components/responses/Forbidden' },
            '404': { $ref: '#/components/responses/NotFound' }
          }
        },
        delete: {
          tags: ['Departments'],
          summary: 'Delete department',
          description: 'Delete a department (Admin only)',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'Department ID (UUID) or slug' }
          ],
          responses: {
            '200': {
              description: 'Department deleted successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      data: { type: 'object', properties: { deleted: { type: 'boolean' } } },
                      correlationId: { type: 'string' }
                    }
                  }
                }
              }
            },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '403': { $ref: '#/components/responses/Forbidden' },
            '404': { $ref: '#/components/responses/NotFound' }
          }
        }
      },
      '/api/departments/{id}/statistics': {
        get: {
          tags: ['Departments'],
          summary: 'Get department statistics',
          description: 'Get comprehensive statistics for a specific department',
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'Department ID (UUID) or slug' }
          ],
          responses: {
            '200': {
              description: 'Department statistics retrieved successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      data: {
                        type: 'object',
                        properties: {
                          department: { $ref: '#/components/schemas/Department' },
                          totalUsers: { type: 'integer' },
                          usersByRole: { type: 'object' },
                          totalRequests: { type: 'integer' },
                          requestsByStatus: { type: 'object' },
                          requestsByPriority: { type: 'object' },
                          avgResolutionTime: { type: 'number' },
                          avgResponseTime: { type: 'number' },
                          last30Days: {
                            type: 'object',
                            properties: {
                              requestsCreated: { type: 'integer' },
                              requestsResolved: { type: 'integer' },
                              avgResolutionTime: { type: 'number' }
                            }
                          }
                        }
                      },
                      correlationId: { type: 'string' }
                    }
                  }
                }
              }
            },
            '404': { $ref: '#/components/responses/NotFound' }
          }
        }
      },

      // Community
      '/api/v1/community/leaderboard': {
        get: {
          tags: ['Community'],
          summary: 'Get community leaderboard',
          description: 'Retrieve ranked users with filtering and period options',
          parameters: [
            { name: 'period', in: 'query', schema: { type: 'string', enum: ['daily', 'weekly', 'monthly', 'yearly', 'all-time'], default: 'monthly' } },
            { name: 'category', in: 'query', schema: { type: 'string' }, description: 'Filter by request category' },
            { name: 'limit', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 100, default: 10 } },
            { name: 'offset', in: 'query', schema: { type: 'integer', default: 0 } },
            { name: 'includeInactive', in: 'query', schema: { type: 'boolean', default: false } },
            { name: 'startDate', in: 'query', schema: { type: 'string', format: 'date-time' } },
            { name: 'endDate', in: 'query', schema: { type: 'string', format: 'date-time' } }
          ],
          responses: {
            '200': {
              description: 'Leaderboard retrieved successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      data: {
                        type: 'object',
                        properties: {
                          leaderboard: { type: 'array', items: { $ref: '#/components/schemas/LeaderboardEntry' } },
                          period: { type: 'string' },
                          periodStart: { type: 'string', format: 'date-time' },
                          periodEnd: { type: 'string', format: 'date-time' },
                          totalParticipants: { type: 'integer' }
                        }
                      },
                      correlationId: { type: 'string' }
                    }
                  }
                }
              }
            }
          }
        }
      },
      '/api/v1/community/users/{userId}/stats': {
        get: {
          tags: ['Community'],
          summary: 'Get user community statistics',
          description: 'Retrieve detailed statistics for a specific user',
          parameters: [
            { name: 'userId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
            { name: 'period', in: 'query', schema: { type: 'string', enum: ['daily', 'weekly', 'monthly', 'yearly', 'all-time'] } },
            { name: 'startDate', in: 'query', schema: { type: 'string', format: 'date-time' } },
            { name: 'endDate', in: 'query', schema: { type: 'string', format: 'date-time' } }
          ],
          responses: {
            '200': {
              description: 'User statistics retrieved successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      data: { $ref: '#/components/schemas/CommunityStats' },
                      correlationId: { type: 'string' }
                    }
                  }
                }
              }
            },
            '404': { $ref: '#/components/responses/NotFound' }
          }
        }
      },
      '/api/v1/community/my-stats': {
        get: {
          tags: ['Community'],
          summary: 'Get my community statistics',
          description: 'Get community statistics for the authenticated user',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'period', in: 'query', schema: { type: 'string', enum: ['daily', 'weekly', 'monthly', 'yearly', 'all-time'] } },
            { name: 'startDate', in: 'query', schema: { type: 'string', format: 'date-time' } },
            { name: 'endDate', in: 'query', schema: { type: 'string', format: 'date-time' } }
          ],
          responses: {
            '200': {
              description: 'User statistics retrieved successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      data: { $ref: '#/components/schemas/CommunityStats' },
                      correlationId: { type: 'string' }
                    }
                  }
                }
              }
            },
            '401': { $ref: '#/components/responses/Unauthorized' }
          }
        }
      },
      '/api/v1/community/categories/{category}/stats': {
        get: {
          tags: ['Community'],
          summary: 'Get category statistics',
          description: 'Get community statistics for a specific category',
          parameters: [
            { name: 'category', in: 'path', required: true, schema: { type: 'string' } },
            { name: 'period', in: 'query', schema: { type: 'string', enum: ['daily', 'weekly', 'monthly', 'yearly', 'all-time'] } }
          ],
          responses: {
            '200': {
              description: 'Category statistics retrieved successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      data: { $ref: '#/components/schemas/CategoryStats' },
                      correlationId: { type: 'string' }
                    }
                  }
                }
              }
            }
          }
        }
      },
      '/api/v1/community/trends': {
        get: {
          tags: ['Community'],
          summary: 'Get community trends',
          description: 'Get trending categories, contributors, and requests',
          parameters: [
            { name: 'period', in: 'query', schema: { type: 'string', enum: ['daily', 'weekly', 'monthly'], default: 'weekly' } },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 5 } }
          ],
          responses: {
            '200': {
              description: 'Trends retrieved successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      data: {
                        type: 'object',
                        properties: {
                          trendingCategories: { type: 'array', items: { type: 'object' } },
                          risingContributors: { type: 'array', items: { $ref: '#/components/schemas/LeaderboardEntry' } },
                          hotRequests: { type: 'array', items: { $ref: '#/components/schemas/ServiceRequest' } }
                        }
                      },
                      correlationId: { type: 'string' }
                    }
                  }
                }
              }
            }
          }
        }
      },
      '/api/v1/community/summary': {
        get: {
          tags: ['Community'],
          summary: 'Get community summary',
          description: 'Get overall community statistics and summary',
          parameters: [
            { name: 'period', in: 'query', schema: { type: 'string', enum: ['daily', 'weekly', 'monthly', 'yearly', 'all-time'] } }
          ],
          responses: {
            '200': {
              description: 'Community summary retrieved successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      data: {
                        type: 'object',
                        properties: {
                          totalRequests: { type: 'integer' },
                          totalApproved: { type: 'integer' },
                          totalResolved: { type: 'integer' },
                          totalComments: { type: 'integer' },
                          totalUpvotes: { type: 'integer' },
                          activeCitizens: { type: 'integer' },
                          topCategories: { type: 'array', items: { type: 'object' } },
                          averageResolutionTime: { type: 'number' },
                          satisfactionRate: { type: 'number' }
                        }
                      },
                      correlationId: { type: 'string' }
                    }
                  }
                }
              }
            }
          }
        }
      },
      '/api/v1/community/achievements': {
        get: {
          tags: ['Community'],
          summary: 'List all achievements',
          description: 'Get list of all available achievements',
          responses: {
            '200': {
              description: 'Achievements retrieved successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      data: {
                        type: 'object',
                        properties: {
                          achievements: {
                            type: 'array',
                            items: {
                              type: 'object',
                              properties: {
                                id: { type: 'string' },
                                name: { type: 'string' },
                                description: { type: 'string' },
                                icon: { type: 'string' },
                                category: { type: 'string' },
                                points: { type: 'integer' },
                                requirements: { type: 'object' }
                              }
                            }
                          }
                        }
                      },
                      correlationId: { type: 'string' }
                    }
                  }
                }
              }
            }
          }
        }
      },
      '/api/v1/community/users/{userId}/achievements': {
        get: {
          tags: ['Community'],
          summary: 'Get user achievements',
          description: 'Get achievements for a specific user',
          parameters: [
            { name: 'userId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
          ],
          responses: {
            '200': {
              description: 'User achievements retrieved successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      data: {
                        type: 'object',
                        properties: {
                          achievements: { type: 'array', items: { type: 'object' } },
                          totalPoints: { type: 'integer' },
                          level: { type: 'integer' }
                        }
                      },
                      correlationId: { type: 'string' }
                    }
                  }
                }
              }
            },
            '404': { $ref: '#/components/responses/NotFound' }
          }
        }
      },
      '/api/v1/community/statistics/overview': {
        get: {
          tags: ['Community'],
          summary: 'Get community statistics overview',
          description: 'Get comprehensive community statistics overview',
          parameters: [
            { name: 'period', in: 'query', schema: { type: 'string', enum: ['daily', 'weekly', 'monthly', 'yearly'] } },
            { name: 'startDate', in: 'query', schema: { type: 'string', format: 'date-time' } },
            { name: 'endDate', in: 'query', schema: { type: 'string', format: 'date-time' } }
          ],
          responses: {
            '200': {
              description: 'Statistics overview retrieved successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      data: { type: 'object' },
                      correlationId: { type: 'string' }
                    }
                  }
                }
              }
            }
          }
        }
      },

      // Rankings
      '/api/v1/rankings/users': {
        get: {
          tags: ['Rankings'],
          summary: 'Get user rankings',
          description: 'Retrieve user rankings based on performance metrics',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'timeframe', in: 'query', schema: { type: 'string', enum: ['week', 'month', 'quarter', 'year', 'all'], default: 'month' } },
            { name: 'category', in: 'query', schema: { type: 'string' } },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } }
          ],
          responses: {
            '200': {
              description: 'User rankings retrieved successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      data: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            user: { $ref: '#/components/schemas/User' },
                            rank: { type: 'integer' },
                            score: { type: 'number' },
                            totalRequests: { type: 'integer' },
                            approvalRate: { type: 'number' },
                            badge: { type: 'string', enum: ['GOLD', 'SILVER', 'BRONZE'] }
                          }
                        }
                      },
                      correlationId: { type: 'string' }
                    }
                  }
                }
              }
            },
            '401': { $ref: '#/components/responses/Unauthorized' }
          }
        }
      },
      '/api/v1/rankings/stats': {
        get: {
          tags: ['Rankings'],
          summary: 'Get ranking statistics',
          description: 'Retrieve overall ranking statistics',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'timeframe', in: 'query', schema: { type: 'string', enum: ['week', 'month', 'quarter', 'year', 'all'], default: 'month' } },
            { name: 'category', in: 'query', schema: { type: 'string' } }
          ],
          responses: {
            '200': {
              description: 'Ranking statistics retrieved successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      data: {
                        type: 'object',
                        properties: {
                          activeCitizens: { type: 'integer' },
                          approvedRequests: { type: 'integer' },
                          avgApprovalRate: { type: 'number' },
                          topPerformerGrowth: { type: 'number' }
                        }
                      },
                      correlationId: { type: 'string' }
                    }
                  }
                }
              }
            },
            '401': { $ref: '#/components/responses/Unauthorized' }
          }
        }
      },

      // Field Agent Endpoints
      '/api/v1/field-agent/dashboard': {
        get: {
          tags: ['Field Agent'],
          summary: 'Get field agent dashboard',
          description: 'Retrieve dashboard data for the authenticated field agent including today\'s work orders, statistics, and recent activity',
          security: [{ bearerAuth: [] }],
          responses: {
            '200': {
              description: 'Dashboard data retrieved successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      data: {
                        type: 'object',
                        properties: {
                          todaysOrders: {
                            type: 'array',
                            items: { $ref: '#/components/schemas/FieldWorkOrder' }
                          },
                          statistics: {
                            type: 'object',
                            properties: {
                              total: { type: 'integer' },
                              byStatus: {
                                type: 'object',
                                additionalProperties: { type: 'integer' }
                              },
                              todayCompleted: { type: 'integer' },
                              todayWorkTimeMinutes: { type: 'integer' }
                            }
                          },
                          recentActivity: {
                            type: 'array',
                            items: { $ref: '#/components/schemas/AgentTimeTracking' }
                          }
                        }
                      },
                      correlationId: { type: 'string' }
                    }
                  }
                }
              }
            },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '403': { $ref: '#/components/responses/Forbidden' }
          }
        }
      },
      '/api/v1/field-agent/work-orders': {
        get: {
          tags: ['Field Agent'],
          summary: 'Get work orders',
          description: 'Retrieve paginated list of work orders for the authenticated field agent',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
            { name: 'status', in: 'query', schema: { type: 'string', enum: ['ASSIGNED', 'EN_ROUTE', 'ON_SITE', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'] } },
            { name: 'priority', in: 'query', schema: { type: 'string', enum: ['EMERGENCY', 'HIGH', 'NORMAL', 'LOW'] } },
            { name: 'sortBy', in: 'query', schema: { type: 'string', enum: ['createdAt', 'priority', 'status', 'estimatedDuration'], default: 'createdAt' } },
            { name: 'sortOrder', in: 'query', schema: { type: 'string', enum: ['asc', 'desc'], default: 'desc' } }
          ],
          responses: {
            '200': {
              description: 'Work orders retrieved successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      data: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/FieldWorkOrder' }
                      },
                      pagination: { $ref: '#/components/schemas/Pagination' },
                      correlationId: { type: 'string' }
                    }
                  }
                }
              }
            },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '403': { $ref: '#/components/responses/Forbidden' }
          }
        }
      },
      '/api/v1/field-agent/work-orders/{id}': {
        get: {
          tags: ['Field Agent'],
          summary: 'Get work order details',
          description: 'Retrieve detailed information about a specific work order',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
          ],
          responses: {
            '200': {
              description: 'Work order retrieved successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      data: { $ref: '#/components/schemas/FieldWorkOrder' },
                      correlationId: { type: 'string' }
                    }
                  }
                }
              }
            },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '403': { $ref: '#/components/responses/Forbidden' },
            '404': { $ref: '#/components/responses/NotFound' }
          }
        },
        patch: {
          tags: ['Field Agent'],
          summary: 'Update work order',
          description: 'Update work order status, completion notes, and other fields',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: {
                      type: 'string',
                      enum: ['ASSIGNED', 'EN_ROUTE', 'ON_SITE', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']
                    },
                    completionNotes: { type: 'string' },
                    followUpRequired: { type: 'boolean' },
                    actualDuration: { type: 'integer' }
                  }
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'Work order updated successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      data: { $ref: '#/components/schemas/FieldWorkOrder' },
                      correlationId: { type: 'string' }
                    }
                  }
                }
              }
            },
            '400': { $ref: '#/components/responses/ValidationError' },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '403': { $ref: '#/components/responses/Forbidden' },
            '404': { $ref: '#/components/responses/NotFound' }
          }
        }
      },
      '/api/v1/agent-status/current': {
        get: {
          tags: ['Field Agent'],
          summary: 'Get current agent status',
          description: 'Retrieve the current status of the authenticated field agent',
          security: [{ bearerAuth: [] }],
          responses: {
            '200': {
              description: 'Agent status retrieved successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      data: { $ref: '#/components/schemas/AgentStatus' },
                      correlationId: { type: 'string' }
                    }
                  }
                }
              }
            },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '403': { $ref: '#/components/responses/Forbidden' }
          }
        }
      },
      '/api/v1/agent-status': {
        put: {
          tags: ['Field Agent'],
          summary: 'Update agent status',
          description: 'Update the status of the authenticated field agent',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: {
                      type: 'string',
                      enum: ['AVAILABLE', 'BUSY', 'BREAK', 'OFF_DUTY', 'EN_ROUTE']
                    },
                    currentTaskId: { type: 'string', format: 'uuid', nullable: true },
                    currentLocation: {
                      type: 'object',
                      properties: {
                        lat: { type: 'number' },
                        lng: { type: 'number' }
                      }
                    },
                    vehicleStatus: {
                      type: 'string',
                      enum: ['IN_TRANSIT', 'PARKED', 'MAINTENANCE'],
                      nullable: true
                    }
                  },
                  required: ['status']
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'Agent status updated successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      data: { $ref: '#/components/schemas/AgentStatus' },
                      correlationId: { type: 'string' }
                    }
                  }
                }
              }
            },
            '400': { $ref: '#/components/responses/ValidationError' },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '403': { $ref: '#/components/responses/Forbidden' }
          }
        }
      },
      '/api/v1/time-tracking/active': {
        get: {
          tags: ['Field Agent'],
          summary: 'Get active time tracking',
          description: 'Retrieve currently active time tracking session for the authenticated field agent',
          security: [{ bearerAuth: [] }],
          responses: {
            '200': {
              description: 'Active time tracking retrieved successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      data: { $ref: '#/components/schemas/AgentTimeTracking' },
                      correlationId: { type: 'string' }
                    }
                  }
                }
              }
            },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '403': { $ref: '#/components/responses/Forbidden' }
          }
        }
      },
      '/api/v1/time-tracking/start': {
        post: {
          tags: ['Field Agent'],
          summary: 'Start time tracking',
          description: 'Start a new time tracking session for a work order',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    workOrderId: { type: 'string', format: 'uuid' },
                    timeType: {
                      type: 'string',
                      enum: ['TRAVEL', 'SETUP', 'WORK', 'DOCUMENTATION', 'BREAK']
                    },
                    notes: { type: 'string' }
                  },
                  required: ['workOrderId', 'timeType']
                }
              }
            }
          },
          responses: {
            '201': {
              description: 'Time tracking started successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      data: { $ref: '#/components/schemas/AgentTimeTracking' },
                      correlationId: { type: 'string' }
                    }
                  }
                }
              }
            },
            '400': { $ref: '#/components/responses/ValidationError' },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '403': { $ref: '#/components/responses/Forbidden' }
          }
        }
      },
      '/api/v1/time-tracking/{id}/end': {
        post: {
          tags: ['Field Agent'],
          summary: 'End time tracking',
          description: 'End an active time tracking session',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
          ],
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    notes: { type: 'string' }
                  }
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'Time tracking ended successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      data: { $ref: '#/components/schemas/AgentTimeTracking' },
                      correlationId: { type: 'string' }
                    }
                  }
                }
              }
            },
            '400': { $ref: '#/components/responses/ValidationError' },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '403': { $ref: '#/components/responses/Forbidden' },
            '404': { $ref: '#/components/responses/NotFound' }
          }
        }
      }
    }
  },
  apis: ['./src/docs/*.yaml', './src/routes/*.ts'], // Include external API documentation files
};

export const swaggerSpec = swaggerJsdoc(options);