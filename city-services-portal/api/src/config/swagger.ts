import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'City Services Portal API',
      version: '1.0.0',
      description: 'API for managing city service requests and municipal services',
      contact: {
        name: 'API Support',
        email: 'api-support@cityservices.gov'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:3001',
        description: 'Development server',
      },
      {
        url: 'https://api.cityservices.gov',
        description: 'Production server',
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token obtained from /auth/login endpoint'
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
                  example: 'VALIDATION_ERROR',
                  description: 'Machine-readable error code'
                },
                message: {
                  type: 'string',
                  example: 'Invalid input data',
                  description: 'Human-readable error message'
                },
                details: {
                  type: 'object',
                  description: 'Additional error details (validation errors, etc.)'
                },
                correlationId: {
                  type: 'string',
                  example: 'req_1234567890_abc123',
                  description: 'Unique request identifier for debugging'
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
              format: 'uuid',
              example: '123e4567-e89b-12d3-a456-426614174000'
            },
            name: {
              type: 'string',
              example: 'John Doe'
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'john.doe@example.com'
            },
            role: {
              type: 'string',
              enum: ['CITIZEN', 'CLERK', 'FIELD_AGENT', 'SUPERVISOR', 'ADMIN'],
              example: 'CITIZEN'
            },
            firstName: { type: 'string', example: 'John' },
            lastName: { type: 'string', example: 'Doe' },
            phone: { type: 'string', example: '+1234567890' },
            alternatePhone: { type: 'string', example: '+0987654321' },
            streetAddress: { type: 'string', example: '123 Main St' },
            city: { type: 'string', example: 'Anytown' },
            postalCode: { type: 'string', example: '12345' },
            country: { type: 'string', example: 'USA' },
            preferredLanguage: { type: 'string', example: 'EN' },
            emailNotifications: { type: 'boolean', example: true },
            smsNotifications: { type: 'boolean', example: false }
          },
          required: ['id', 'name', 'email', 'role']
        },
        Department: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              example: '456e7890-e89b-12d3-a456-426614174000'
            },
            name: {
              type: 'string',
              example: 'Public Works'
            },
            slug: {
              type: 'string',
              example: 'public-works'
            }
          }
        },
        ServiceRequest: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              example: '789e1234-e89b-12d3-a456-426614174000'
            },
            code: {
              type: 'string',
              example: 'REQ-2024-123456',
              description: 'Unique human-readable request identifier'
            },
            title: {
              type: 'string',
              example: 'Pothole on Main Street',
              minLength: 5,
              maxLength: 120
            },
            description: {
              type: 'string',
              example: 'Large pothole causing vehicle damage',
              minLength: 30
            },
            category: {
              type: 'string',
              example: 'Roads & Infrastructure'
            },
            priority: {
              type: 'string',
              enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
              example: 'HIGH'
            },
            status: {
              type: 'string',
              enum: ['SUBMITTED', 'TRIAGED', 'IN_PROGRESS', 'WAITING_ON_CITIZEN', 'RESOLVED', 'CLOSED', 'REJECTED'],
              example: 'SUBMITTED'
            },
            locationText: {
              type: 'string',
              example: 'Main Street near City Hall'
            },
            streetAddress: { type: 'string', example: '123 Main Street' },
            city: { type: 'string', example: 'Anytown' },
            postalCode: { type: 'string', example: '12345' },
            contactMethod: {
              type: 'string',
              enum: ['EMAIL', 'PHONE', 'SMS', 'MAIL'],
              example: 'EMAIL'
            },
            email: { type: 'string', format: 'email' },
            phone: { type: 'string', example: '+1234567890' },
            severity: { type: 'integer', minimum: 1, maximum: 10, example: 7 },
            isEmergency: { type: 'boolean', example: false },
            isRecurring: { type: 'boolean', example: false },
            hasPermits: { type: 'boolean', example: false },
            estimatedValue: { type: 'number', example: 1500.50 },
            satisfactionRating: { type: 'integer', minimum: 1, maximum: 5 },
            upvotes: { type: 'integer', example: 5 },
            hasUserUpvoted: { type: 'boolean', example: false },
            comments: { 
              oneOf: [
                { type: 'integer', description: 'Count of comments' },
                { type: 'array', items: { $ref: '#/components/schemas/Comment' } }
              ]
            },
            creator: { $ref: '#/components/schemas/User' },
            assignee: { 
              allOf: [{ $ref: '#/components/schemas/User' }],
              nullable: true 
            },
            department: { 
              allOf: [{ $ref: '#/components/schemas/Department' }],
              nullable: true 
            },
            attachments: {
              type: 'array',
              items: { $ref: '#/components/schemas/Attachment' }
            },
            eventLogs: {
              type: 'array',
              items: { $ref: '#/components/schemas/EventLog' }
            },
            version: { type: 'integer', example: 1, description: 'Version for optimistic locking' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
            closedAt: { type: 'string', format: 'date-time', nullable: true }
          },
          required: ['id', 'code', 'title', 'description', 'category', 'priority', 'status', 'locationText', 'creator']
        },
        ServiceRequestCreate: {
          type: 'object',
          properties: {
            title: {
              type: 'string',
              minLength: 5,
              maxLength: 120,
              example: 'Pothole on Main Street'
            },
            description: {
              type: 'string',
              minLength: 30,
              example: 'Large pothole causing vehicle damage near intersection'
            },
            category: {
              type: 'string',
              example: 'Roads & Infrastructure'
            },
            priority: {
              type: 'string',
              enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
              default: 'MEDIUM'
            },
            locationText: {
              type: 'string',
              minLength: 1,
              example: 'Main Street near City Hall intersection'
            },
            streetAddress: { type: 'string', example: '123 Main Street' },
            city: { type: 'string', example: 'Anytown' },
            postalCode: { type: 'string', example: '12345' },
            contactMethod: {
              type: 'string',
              enum: ['EMAIL', 'PHONE', 'SMS', 'MAIL']
            },
            email: { type: 'string', format: 'email' },
            phone: { type: 'string', example: '+1234567890' },
            severity: { type: 'integer', minimum: 1, maximum: 10 },
            isEmergency: { type: 'boolean', default: false },
            isRecurring: { type: 'boolean', default: false },
            estimatedValue: { type: 'number', minimum: 0 }
          },
          required: ['title', 'description', 'category', 'locationText']
        },
        Comment: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              example: 'comment-123e4567-e89b-12d3'
            },
            requestId: { type: 'string', format: 'uuid' },
            body: {
              type: 'string',
              example: 'This issue has been resolved successfully.',
              minLength: 10,
              maxLength: 1000
            },
            visibility: {
              type: 'string',
              enum: ['PUBLIC', 'INTERNAL'],
              example: 'PUBLIC'
            },
            author: { $ref: '#/components/schemas/User' },
            createdAt: { type: 'string', format: 'date-time' }
          },
          required: ['id', 'requestId', 'body', 'visibility', 'author', 'createdAt']
        },
        Attachment: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              example: 'attach-123e4567-e89b-12d3'
            },
            requestId: { type: 'string', format: 'uuid' },
            filename: {
              type: 'string',
              example: 'pothole-photo.jpg'
            },
            mime: {
              type: 'string',
              example: 'image/jpeg'
            },
            size: {
              type: 'integer',
              example: 1024000,
              description: 'File size in bytes'
            },
            uploadedBy: { $ref: '#/components/schemas/User' },
            createdAt: { type: 'string', format: 'date-time' }
          },
          required: ['id', 'requestId', 'filename', 'mime', 'size', 'uploadedBy', 'createdAt']
        },
        EventLog: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              example: 'log-123e4567-e89b-12d3'
            },
            requestId: { type: 'string', format: 'uuid' },
            type: {
              type: 'string',
              example: 'STATUS_CHANGE',
              enum: ['STATUS_CHANGE', 'COMMENT_ADDED', 'UPVOTE', 'UPVOTE_REMOVED', 'ASSIGNMENT']
            },
            payload: {
              type: 'string',
              example: '{"action":"start","fromStatus":"TRIAGED","toStatus":"IN_PROGRESS"}',
              description: 'JSON string containing event details'
            },
            createdAt: { type: 'string', format: 'date-time' }
          },
          required: ['id', 'requestId', 'type', 'payload', 'createdAt']
        },
        UserRanking: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string', example: 'John Doe' },
            email: { type: 'string', format: 'email' },
            rank: { type: 'integer', example: 1 },
            badge: { 
              type: 'string', 
              enum: ['gold', 'silver', 'bronze'],
              nullable: true,
              example: 'gold'
            },
            approvedRequestsCount: { type: 'integer', example: 15 },
            totalRequestsCount: { type: 'integer', example: 18 },
            approvalRate: { type: 'number', example: 83.3 },
            averageRating: { type: 'number', example: 4.2 },
            joinedDate: { type: 'string', format: 'date-time' },
            lastRequestDate: { type: 'string', format: 'date-time', nullable: true }
          }
        },
        Pagination: {
          type: 'object',
          properties: {
            page: { type: 'integer', example: 1 },
            pageSize: { type: 'integer', example: 10 },
            totalCount: { type: 'integer', example: 25 },
            totalPages: { type: 'integer', example: 3 }
          },
          required: ['page', 'pageSize', 'totalCount', 'totalPages']
        }
      },
      parameters: {
        RequestId: {
          name: 'id',
          in: 'path',
          required: true,
          schema: {
            type: 'string',
            format: 'uuid'
          },
          description: 'Service request ID'
        },
        IfMatch: {
          name: 'If-Match',
          in: 'header',
          required: true,
          schema: {
            type: 'string'
          },
          description: 'Version number for optimistic locking'
        },
        IdempotencyKey: {
          name: 'Idempotency-Key',
          in: 'header',
          required: false,
          schema: {
            type: 'string',
            format: 'uuid'
          },
          description: 'Unique key to prevent duplicate operations'
        }
      },
      responses: {
        Unauthorized: {
          description: 'Unauthorized - missing or invalid token',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        },
        Forbidden: {
          description: 'Forbidden - insufficient permissions',
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
        ValidationError: {
          description: 'Validation error',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        },
        InternalError: {
          description: 'Internal server error',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        },
        Conflict: {
          description: 'Conflict - resource conflict or version mismatch',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        }
      }
    },
    paths: {
      '/health': {
        get: {
          summary: 'Health check endpoint',
          description: 'Returns the health status of the API',
          tags: ['Utility'],
          responses: {
            '200': {
              description: 'API is healthy',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      status: { type: 'string', example: 'healthy' },
                      timestamp: { type: 'string', format: 'date-time' },
                      service: { type: 'string', example: 'city-services-portal-api' }
                    }
                  }
                }
              }
            }
          }
        }
      },
      '/api/v1/auth/register': {
        post: {
          summary: 'Register a new user',
          description: 'Creates a new user account with CITIZEN role by default',
          tags: ['Authentication'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    name: {
                      type: 'string',
                      minLength: 2,
                      maxLength: 100,
                      example: 'John Doe'
                    },
                    email: {
                      type: 'string',
                      format: 'email',
                      example: 'john.doe@example.com'
                    },
                    password: {
                      type: 'string',
                      minLength: 6,
                      example: 'securepassword'
                    }
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
                      accessToken: {
                        type: 'string',
                        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
                      },
                      user: { $ref: '#/components/schemas/User' },
                      correlationId: {
                        type: 'string',
                        example: 'req_1234567890_abc123'
                      }
                    }
                  }
                }
              }
            },
            '400': { $ref: '#/components/responses/ValidationError' },
            '409': {
              description: 'User already exists',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            },
            '500': { $ref: '#/components/responses/InternalError' }
          }
        }
      },
      '/api/v1/auth/login': {
        post: {
          summary: 'Authenticate user',
          description: 'Login with email and password to receive JWT token',
          tags: ['Authentication'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    email: {
                      type: 'string',
                      format: 'email',
                      example: 'john.doe@example.com'
                    },
                    password: {
                      type: 'string',
                      example: 'securepassword'
                    }
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
                      accessToken: {
                        type: 'string',
                        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
                      },
                      user: { $ref: '#/components/schemas/User' },
                      correlationId: {
                        type: 'string',
                        example: 'req_1234567890_abc123'
                      }
                    }
                  }
                }
              }
            },
            '400': { $ref: '#/components/responses/ValidationError' },
            '401': {
              description: 'Invalid credentials',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            },
            '423': {
              description: 'Account locked',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            },
            '500': { $ref: '#/components/responses/InternalError' }
          }
        }
      },
      '/api/v1/auth/me': {
        get: {
          summary: 'Get current user profile',
          description: 'Retrieve the profile of the currently authenticated user',
          tags: ['Authentication'],
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
                      correlationId: {
                        type: 'string',
                        example: 'req_1234567890_abc123'
                      }
                    }
                  }
                }
              }
            },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '500': { $ref: '#/components/responses/InternalError' }
          }
        }
      },
      '/api/v1/requests': {
        get: {
          summary: 'List service requests',
          description: 'Get paginated list of service requests with filtering and sorting',
          tags: ['Service Requests'],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'status',
              in: 'query',
              description: 'Filter by status',
              schema: {
                type: 'string',
                enum: ['SUBMITTED', 'TRIAGED', 'IN_PROGRESS', 'WAITING_ON_CITIZEN', 'RESOLVED', 'CLOSED', 'REJECTED']
              }
            },
            {
              name: 'category',
              in: 'query',
              description: 'Filter by category',
              schema: { type: 'string' }
            },
            {
              name: 'priority',
              in: 'query',
              description: 'Filter by priority',
              schema: {
                type: 'string',
                enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT']
              }
            },
            {
              name: 'department',
              in: 'query',
              description: 'Filter by department',
              schema: { type: 'string' }
            },
            {
              name: 'assignedTo',
              in: 'query',
              description: 'Filter by assigned user ID',
              schema: { type: 'string', format: 'uuid' }
            },
            {
              name: 'text',
              in: 'query',
              description: 'Search in title and description',
              schema: { type: 'string' }
            },
            {
              name: 'page',
              in: 'query',
              description: 'Page number',
              schema: { type: 'integer', default: 1, minimum: 1 }
            },
            {
              name: 'size',
              in: 'query',
              description: 'Page size',
              schema: { type: 'integer', default: 20, minimum: 1, maximum: 100 }
            },
            {
              name: 'sort',
              in: 'query',
              description: 'Sort field:direction (e.g., createdAt:desc)',
              schema: { type: 'string', default: 'createdAt:desc' }
            }
          ],
          responses: {
            '200': {
              description: 'Service requests retrieved successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      data: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/ServiceRequest' }
                      },
                      pagination: { $ref: '#/components/schemas/Pagination' },
                      correlationId: {
                        type: 'string',
                        example: 'req_1234567890_abc123'
                      }
                    }
                  }
                }
              }
            },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '500': { $ref: '#/components/responses/InternalError' }
          }
        },
        post: {
          summary: 'Create service request',
          description: 'Create a new service request',
          tags: ['Service Requests'],
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ServiceRequestCreate' }
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
                      correlationId: {
                        type: 'string',
                        example: 'req_1234567890_abc123'
                      }
                    }
                  }
                }
              }
            },
            '400': { $ref: '#/components/responses/ValidationError' },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '500': { $ref: '#/components/responses/InternalError' }
          }
        }
      },
      '/api/v1/requests/{id}': {
        get: {
          summary: 'Get service request by ID',
          description: 'Retrieve a specific service request by its ID',
          tags: ['Service Requests'],
          security: [{ bearerAuth: [] }],
          parameters: [{ $ref: '#/components/parameters/RequestId' }],
          responses: {
            '200': {
              description: 'Service request retrieved successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      data: { $ref: '#/components/schemas/ServiceRequest' },
                      correlationId: {
                        type: 'string',
                        example: 'req_1234567890_abc123'
                      }
                    }
                  }
                }
              }
            },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '403': { $ref: '#/components/responses/Forbidden' },
            '404': { $ref: '#/components/responses/NotFound' },
            '500': { $ref: '#/components/responses/InternalError' }
          }
        },
        patch: {
          summary: 'Update service request',
          description: 'Update a service request (requires optimistic locking)',
          tags: ['Service Requests'],
          security: [{ bearerAuth: [] }],
          parameters: [
            { $ref: '#/components/parameters/RequestId' },
            { $ref: '#/components/parameters/IfMatch' }
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
                    category: { type: 'string' },
                    priority: {
                      type: 'string',
                      enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT']
                    },
                    locationText: { type: 'string', minLength: 1 }
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
                      correlationId: {
                        type: 'string',
                        example: 'req_1234567890_abc123'
                      }
                    }
                  }
                }
              }
            },
            '400': { $ref: '#/components/responses/ValidationError' },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '403': { $ref: '#/components/responses/Forbidden' },
            '404': { $ref: '#/components/responses/NotFound' },
            '409': { $ref: '#/components/responses/Conflict' },
            '500': { $ref: '#/components/responses/InternalError' }
          }
        }
      },
      '/api/v1/requests/{id}/status': {
        post: {
          summary: 'Change request status',
          description: 'Change the status of a service request using predefined actions',
          tags: ['Service Requests'],
          security: [{ bearerAuth: [] }],
          parameters: [{ $ref: '#/components/parameters/RequestId' }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    action: {
                      type: 'string',
                      enum: ['triage', 'start', 'wait_for_citizen', 'resolve', 'close', 'reject', 'reopen'],
                      example: 'triage'
                    },
                    reason: {
                      type: 'string',
                      minLength: 10,
                      example: 'Issue has been reviewed and assigned to appropriate department'
                    },
                    assignedTo: {
                      type: 'string',
                      format: 'uuid',
                      example: '123e4567-e89b-12d3-a456-426614174000'
                    }
                  },
                  required: ['action']
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'Status changed successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      data: {
                        type: 'object',
                        properties: {
                          id: { type: 'string', format: 'uuid' },
                          status: { type: 'string' },
                          version: { type: 'integer' },
                          updatedAt: { type: 'string', format: 'date-time' }
                        }
                      },
                      correlationId: {
                        type: 'string',
                        example: 'req_1234567890_abc123'
                      }
                    }
                  }
                }
              }
            },
            '400': { $ref: '#/components/responses/ValidationError' },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '403': { $ref: '#/components/responses/Forbidden' },
            '404': { $ref: '#/components/responses/NotFound' },
            '422': {
              description: 'Invalid status transition',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            },
            '500': { $ref: '#/components/responses/InternalError' }
          }
        }
      },
      '/api/v1/requests/{id}/comments': {
        post: {
          summary: 'Add comment to request',
          description: 'Add a comment to a service request',
          tags: ['Service Requests'],
          security: [{ bearerAuth: [] }],
          parameters: [{ $ref: '#/components/parameters/RequestId' }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    content: {
                      type: 'string',
                      minLength: 10,
                      maxLength: 1000,
                      example: 'This issue has been resolved successfully.'
                    },
                    visibility: {
                      type: 'string',
                      enum: ['PUBLIC', 'INTERNAL'],
                      default: 'PUBLIC',
                      example: 'PUBLIC'
                    }
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
                      correlationId: {
                        type: 'string',
                        example: 'req_1234567890_abc123'
                      }
                    }
                  }
                }
              }
            },
            '400': { $ref: '#/components/responses/ValidationError' },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '403': { $ref: '#/components/responses/Forbidden' },
            '404': { $ref: '#/components/responses/NotFound' },
            '500': { $ref: '#/components/responses/InternalError' }
          }
        }
      },
      '/api/v1/requests/{id}/upvote': {
        post: {
          summary: 'Upvote request',
          description: 'Add an upvote to a service request',
          tags: ['Service Requests'],
          security: [{ bearerAuth: [] }],
          parameters: [{ $ref: '#/components/parameters/RequestId' }],
          responses: {
            '200': {
              description: 'Upvote added successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      data: {
                        type: 'object',
                        properties: {
                          id: { type: 'string', format: 'uuid' },
                          upvotes: { type: 'integer' },
                          hasUserUpvoted: { type: 'boolean' }
                        }
                      },
                      correlationId: {
                        type: 'string',
                        example: 'req_1234567890_abc123'
                      }
                    }
                  }
                }
              }
            },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '404': { $ref: '#/components/responses/NotFound' },
            '500': { $ref: '#/components/responses/InternalError' }
          }
        },
        delete: {
          summary: 'Remove upvote',
          description: 'Remove an upvote from a service request',
          tags: ['Service Requests'],
          security: [{ bearerAuth: [] }],
          parameters: [{ $ref: '#/components/parameters/RequestId' }],
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
                          id: { type: 'string', format: 'uuid' },
                          upvotes: { type: 'integer' },
                          hasUserUpvoted: { type: 'boolean' }
                        }
                      },
                      correlationId: {
                        type: 'string',
                        example: 'req_1234567890_abc123'
                      }
                    }
                  }
                }
              }
            },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '404': { $ref: '#/components/responses/NotFound' },
            '500': { $ref: '#/components/responses/InternalError' }
          }
        }
      },
      '/api/v1/admin/users': {
        get: {
          summary: 'List all users',
          description: 'Get paginated list of users with filtering, sorting and search capabilities',
          tags: ['User Management'],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'role',
              in: 'query',
              description: 'Filter by user role',
              schema: {
                type: 'string',
                enum: ['CITIZEN', 'CLERK', 'FIELD_AGENT', 'SUPERVISOR', 'ADMIN']
              }
            },
            {
              name: 'department',
              in: 'query',
              description: 'Filter by department slug',
              schema: { type: 'string' }
            },
            {
              name: 'isActive',
              in: 'query',
              description: 'Filter by active status',
              schema: { type: 'boolean' }
            },
            {
              name: 'isTestUser',
              in: 'query',
              description: 'Filter by test user status',
              schema: { type: 'boolean' }
            },
            {
              name: 'search',
              in: 'query',
              description: 'Search in name, email, firstName, lastName',
              schema: { type: 'string' }
            },
            {
              name: 'page',
              in: 'query',
              description: 'Page number',
              schema: { type: 'integer', default: 1, minimum: 1 }
            },
            {
              name: 'size',
              in: 'query',
              description: 'Page size',
              schema: { type: 'integer', default: 20, minimum: 1, maximum: 100 }
            },
            {
              name: 'sort',
              in: 'query',
              description: 'Sort field:direction (e.g., createdAt:desc)',
              schema: { type: 'string', default: 'createdAt:desc' }
            }
          ],
          responses: {
            '200': {
              description: 'Users retrieved successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      data: {
                        type: 'array',
                        items: {
                          allOf: [
                            { $ref: '#/components/schemas/User' },
                            {
                              type: 'object',
                              properties: {
                                _count: {
                                  type: 'object',
                                  properties: {
                                    createdRequests: { type: 'integer' },
                                    assignedRequests: { type: 'integer' },
                                    comments: { type: 'integer' }
                                  }
                                }
                              }
                            }
                          ]
                        }
                      },
                      pagination: { $ref: '#/components/schemas/Pagination' },
                      correlationId: { type: 'string' }
                    }
                  }
                }
              }
            },
            '400': { $ref: '#/components/responses/ValidationError' },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '403': { $ref: '#/components/responses/Forbidden' },
            '500': { $ref: '#/components/responses/InternalError' }
          }
        },
        post: {
          summary: 'Create new user',
          description: 'Create a new user account with specified role and details',
          tags: ['User Management'],
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    name: { type: 'string', minLength: 2, maxLength: 100 },
                    email: { type: 'string', format: 'email' },
                    password: { type: 'string', minLength: 6, description: 'Optional - will generate if not provided' },
                    role: {
                      type: 'string',
                      enum: ['CITIZEN', 'CLERK', 'FIELD_AGENT', 'SUPERVISOR', 'ADMIN']
                    },
                    departmentId: { type: 'string', format: 'uuid' },
                    firstName: { type: 'string', minLength: 1, maxLength: 50 },
                    lastName: { type: 'string', minLength: 1, maxLength: 50 },
                    phone: { type: 'string' },
                    isTestUser: { type: 'boolean', default: true }
                  },
                  required: ['name', 'email', 'role']
                }
              }
            }
          },
          responses: {
            '201': {
              description: 'User created successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      data: {
                        allOf: [
                          { $ref: '#/components/schemas/User' },
                          {
                            type: 'object',
                            properties: {
                              generatedPassword: { type: 'string', description: 'Only present if password was generated' }
                            }
                          }
                        ]
                      },
                      correlationId: { type: 'string' }
                    }
                  }
                }
              }
            },
            '400': { $ref: '#/components/responses/ValidationError' },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '403': { $ref: '#/components/responses/Forbidden' },
            '409': {
              description: 'User already exists',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            },
            '500': { $ref: '#/components/responses/InternalError' }
          }
        }
      },
      '/api/v1/admin/users/bulk': {
        post: {
          summary: 'Bulk create users',
          description: 'Create multiple user accounts in a single request',
          tags: ['User Management'],
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    users: {
                      type: 'array',
                      minItems: 1,
                      maxItems: 100,
                      items: {
                        type: 'object',
                        properties: {
                          name: { type: 'string', minLength: 2, maxLength: 100 },
                          email: { type: 'string', format: 'email' },
                          password: { type: 'string', minLength: 6 },
                          role: {
                            type: 'string',
                            enum: ['CITIZEN', 'CLERK', 'FIELD_AGENT', 'SUPERVISOR', 'ADMIN']
                          },
                          departmentId: { type: 'string', format: 'uuid' },
                          firstName: { type: 'string' },
                          lastName: { type: 'string' },
                          phone: { type: 'string' },
                          isTestUser: { type: 'boolean', default: true }
                        },
                        required: ['name', 'email', 'role']
                      }
                    },
                    defaultPassword: { type: 'string', minLength: 6, description: 'Default password for users without specified password' }
                  },
                  required: ['users']
                }
              }
            }
          },
          responses: {
            '201': {
              description: 'Bulk user creation completed',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      data: {
                        type: 'object',
                        properties: {
                          created: {
                            type: 'array',
                            items: { $ref: '#/components/schemas/User' }
                          },
                          errors: {
                            type: 'array',
                            items: {
                              type: 'object',
                              properties: {
                                index: { type: 'integer' },
                                email: { type: 'string' },
                                error: { type: 'string' }
                              }
                            }
                          },
                          summary: {
                            type: 'object',
                            properties: {
                              total: { type: 'integer' },
                              created: { type: 'integer' },
                              failed: { type: 'integer' }
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
            '400': { $ref: '#/components/responses/ValidationError' },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '403': { $ref: '#/components/responses/Forbidden' },
            '500': { $ref: '#/components/responses/InternalError' }
          }
        }
      },
      '/api/v1/admin/users/{id}': {
        get: {
          summary: 'Get user details',
          description: 'Get detailed information about a specific user including request statistics',
          tags: ['User Management'],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string', format: 'uuid' },
              description: 'User ID'
            }
          ],
          responses: {
            '200': {
              description: 'User details retrieved successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      data: {
                        allOf: [
                          { $ref: '#/components/schemas/User' },
                          {
                            type: 'object',
                            properties: {
                              createdRequests: {
                                type: 'array',
                                items: {
                                  type: 'object',
                                  properties: {
                                    id: { type: 'string', format: 'uuid' },
                                    code: { type: 'string' },
                                    title: { type: 'string' },
                                    status: { type: 'string' },
                                    createdAt: { type: 'string', format: 'date-time' }
                                  }
                                }
                              },
                              assignedRequests: {
                                type: 'array',
                                items: {
                                  type: 'object',
                                  properties: {
                                    id: { type: 'string', format: 'uuid' },
                                    code: { type: 'string' },
                                    title: { type: 'string' },
                                    status: { type: 'string' },
                                    createdAt: { type: 'string', format: 'date-time' }
                                  }
                                }
                              },
                              _count: {
                                type: 'object',
                                properties: {
                                  createdRequests: { type: 'integer' },
                                  assignedRequests: { type: 'integer' },
                                  comments: { type: 'integer' },
                                  upvotes: { type: 'integer' }
                                }
                              }
                            }
                          }
                        ]
                      },
                      correlationId: { type: 'string' }
                    }
                  }
                }
              }
            },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '403': { $ref: '#/components/responses/Forbidden' },
            '404': { $ref: '#/components/responses/NotFound' },
            '500': { $ref: '#/components/responses/InternalError' }
          }
        },
        patch: {
          summary: 'Update user',
          description: 'Update user information and settings',
          tags: ['User Management'],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string', format: 'uuid' },
              description: 'User ID'
            }
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    name: { type: 'string', minLength: 2, maxLength: 100 },
                    email: { type: 'string', format: 'email' },
                    role: {
                      type: 'string',
                      enum: ['CITIZEN', 'CLERK', 'FIELD_AGENT', 'SUPERVISOR', 'ADMIN']
                    },
                    departmentId: { type: 'string', format: 'uuid', nullable: true },
                    firstName: { type: 'string', minLength: 1, maxLength: 50 },
                    lastName: { type: 'string', minLength: 1, maxLength: 50 },
                    phone: { type: 'string' },
                    isActive: { type: 'boolean' }
                  }
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'User updated successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      data: { $ref: '#/components/schemas/User' },
                      correlationId: { type: 'string' }
                    }
                  }
                }
              }
            },
            '400': { $ref: '#/components/responses/ValidationError' },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '403': { $ref: '#/components/responses/Forbidden' },
            '404': { $ref: '#/components/responses/NotFound' },
            '409': {
              description: 'Email already in use',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            },
            '500': { $ref: '#/components/responses/InternalError' }
          }
        },
        delete: {
          summary: 'Delete user',
          description: 'Soft delete a user by deactivating their account',
          tags: ['User Management'],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string', format: 'uuid' },
              description: 'User ID'
            }
          ],
          responses: {
            '200': {
              description: 'User deleted successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      message: { type: 'string' },
                      correlationId: { type: 'string' }
                    }
                  }
                }
              }
            },
            '400': {
              description: 'Cannot delete own account',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '403': { $ref: '#/components/responses/Forbidden' },
            '404': { $ref: '#/components/responses/NotFound' },
            '500': { $ref: '#/components/responses/InternalError' }
          }
        }
      },
      '/api/v1/admin/users/{id}/reset-password': {
        post: {
          summary: 'Reset user password',
          description: 'Reset a user password to a new value or generate a new one',
          tags: ['User Management'],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string', format: 'uuid' },
              description: 'User ID'
            }
          ],
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    password: { 
                      type: 'string', 
                      minLength: 6,
                      description: 'New password - if not provided, one will be generated'
                    }
                  }
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'Password reset successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      message: { type: 'string' },
                      newPassword: { 
                        type: 'string',
                        description: 'Only present if password was generated'
                      },
                      correlationId: { type: 'string' }
                    }
                  }
                }
              }
            },
            '400': { $ref: '#/components/responses/ValidationError' },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '403': { $ref: '#/components/responses/Forbidden' },
            '404': { $ref: '#/components/responses/NotFound' },
            '500': { $ref: '#/components/responses/InternalError' }
          }
        }
      },
      '/api/v1/admin/users/test-data': {
        delete: {
          summary: 'Clean up test users',
          description: 'Delete all test users and their associated data',
          tags: ['User Management'],
          security: [{ bearerAuth: [] }],
          responses: {
            '200': {
              description: 'Test data cleaned up successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      message: { type: 'string' },
                      deletedCount: { type: 'integer' },
                      correlationId: { type: 'string' }
                    }
                  }
                }
              }
            },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '403': { $ref: '#/components/responses/Forbidden' },
            '500': { $ref: '#/components/responses/InternalError' }
          }
        }
      },
      '/api/v1/admin/flags': {
        get: {
          summary: 'Get all feature flags',
          description: 'Retrieve all system feature flags and their current values',
          tags: ['Admin'],
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
                        additionalProperties: true,
                        example: {
                          'API_Random500': false,
                          'UI_WrongDefaultSort': false,
                          'API_SlowRequests': false,
                          'API_UploadIntermittentFail': false
                        },
                        description: 'Object containing feature flag names as keys and their boolean values'
                      },
                      correlationId: { type: 'string' }
                    }
                  }
                }
              }
            },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '403': { $ref: '#/components/responses/Forbidden' },
            '500': { $ref: '#/components/responses/InternalError' }
          }
        }
      },
      '/api/v1/admin/flags/{key}': {
        patch: {
          summary: 'Update feature flag',
          description: 'Update the value of a specific feature flag',
          tags: ['Admin'],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'key',
              in: 'path',
              required: true,
              schema: { type: 'string' },
              description: 'Feature flag key',
              example: 'API_Random500'
            }
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    value: {
                      description: 'New value for the feature flag',
                      example: true
                    }
                  },
                  required: ['value']
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
                          key: { type: 'string', example: 'API_Random500' },
                          value: { example: true },
                          allFlags: {
                            type: 'object',
                            additionalProperties: true,
                            description: 'All feature flags after update'
                          }
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
            '403': { $ref: '#/components/responses/Forbidden' },
            '500': { $ref: '#/components/responses/InternalError' }
          }
        }
      },
      '/api/v1/admin/seed': {
        post: {
          summary: 'Re-seed database',
          description: 'Trigger database reseeding with fresh test data',
          tags: ['Admin'],
          security: [{ bearerAuth: [] }],
          responses: {
            '200': {
              description: 'Database seeding initiated successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      data: {
                        type: 'object',
                        properties: {
                          message: { type: 'string', example: 'Database seeding initiated' },
                          status: { type: 'string', example: 'success' }
                        }
                      },
                      correlationId: { type: 'string' }
                    }
                  }
                }
              }
            },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '403': { $ref: '#/components/responses/Forbidden' },
            '500': { $ref: '#/components/responses/InternalError' }
          }
        }
      },
      '/api/v1/admin/reset': {
        post: {
          summary: 'Reset database',
          description: 'Trigger complete database reset and reseeding',
          tags: ['Admin'],
          security: [{ bearerAuth: [] }],
          responses: {
            '200': {
              description: 'Database reset initiated successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      data: {
                        type: 'object',
                        properties: {
                          message: { type: 'string', example: 'Database reset initiated' },
                          status: { type: 'string', example: 'success' }
                        }
                      },
                      correlationId: { type: 'string' }
                    }
                  }
                }
              }
            },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '403': { $ref: '#/components/responses/Forbidden' },
            '500': { $ref: '#/components/responses/InternalError' }
          }
        }
      },
      '/api/v1/requests/{id}/attachments': {
        post: {
          summary: 'Upload attachments to service request',
          description: 'Upload one or more image files (JPG, PNG, GIF) to a service request. Maximum 5 files, 1MB each.',
          tags: ['Attachments'],
          security: [{ bearerAuth: [] }],
          parameters: [{ $ref: '#/components/parameters/RequestId' }],
          requestBody: {
            required: true,
            content: {
              'multipart/form-data': {
                schema: {
                  type: 'object',
                  properties: {
                    files: {
                      type: 'array',
                      items: {
                        type: 'string',
                        format: 'binary'
                      },
                      maxItems: 5,
                      description: 'Image files (JPG, PNG, GIF) up to 1MB each'
                    }
                  },
                  required: ['files']
                }
              }
            }
          },
          responses: {
            '201': {
              description: 'Attachments uploaded successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      data: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/Attachment' }
                      },
                      correlationId: { type: 'string' }
                    }
                  }
                }
              }
            },
            '400': {
              description: 'File validation error',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/Error' },
                      {
                        type: 'object',
                        properties: {
                          error: {
                            properties: {
                              maxSize: { type: 'string', example: '1MB' }
                            }
                          }
                        }
                      }
                    ]
                  }
                }
              }
            },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '403': { $ref: '#/components/responses/Forbidden' },
            '404': { $ref: '#/components/responses/NotFound' },
            '500': { $ref: '#/components/responses/InternalError' }
          }
        },
        get: {
          summary: 'Get request attachments',
          description: 'Get all attachments for a specific service request',
          tags: ['Attachments'],
          security: [{ bearerAuth: [] }],
          parameters: [{ $ref: '#/components/parameters/RequestId' }],
          responses: {
            '200': {
              description: 'Attachments retrieved successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      data: {
                        type: 'array',
                        items: {
                          allOf: [
                            { $ref: '#/components/schemas/Attachment' },
                            {
                              type: 'object',
                              properties: {
                                url: { 
                                  type: 'string', 
                                  example: '/api/v1/attachments/123e4567-e89b-12d3-a456-426614174000/image'
                                }
                              }
                            }
                          ]
                        }
                      },
                      correlationId: { type: 'string' }
                    }
                  }
                }
              }
            },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '403': { $ref: '#/components/responses/Forbidden' },
            '404': { $ref: '#/components/responses/NotFound' },
            '500': { $ref: '#/components/responses/InternalError' }
          }
        }
      },
      '/api/v1/attachments/{id}/image': {
        get: {
          summary: 'Serve attachment image',
          description: 'Serve the actual image file data for an attachment',
          tags: ['Attachments'],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string', format: 'uuid' },
              description: 'Attachment ID'
            }
          ],
          responses: {
            '200': {
              description: 'Image file served successfully',
              content: {
                'image/jpeg': {
                  schema: {
                    type: 'string',
                    format: 'binary'
                  }
                },
                'image/png': {
                  schema: {
                    type: 'string',
                    format: 'binary'
                  }
                },
                'image/gif': {
                  schema: {
                    type: 'string',
                    format: 'binary'
                  }
                }
              },
              headers: {
                'Content-Type': {
                  schema: { type: 'string' },
                  description: 'MIME type of the image'
                },
                'Content-Length': {
                  schema: { type: 'integer' },
                  description: 'Size of the image in bytes'
                },
                'Cache-Control': {
                  schema: { type: 'string' },
                  description: 'Cache control header'
                },
                'ETag': {
                  schema: { type: 'string' },
                  description: 'Entity tag for caching'
                }
              }
            },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '403': { $ref: '#/components/responses/Forbidden' },
            '404': { $ref: '#/components/responses/NotFound' },
            '500': { $ref: '#/components/responses/InternalError' }
          }
        }
      },
      '/api/v1/attachments/test/{id}': {
        get: {
          summary: 'Test attachment endpoint',
          description: 'Test endpoint to verify attachment exists and check its metadata',
          tags: ['Attachments'],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string', format: 'uuid' },
              description: 'Attachment ID'
            }
          ],
          responses: {
            '200': {
              description: 'Attachment test data retrieved successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      id: { type: 'string', format: 'uuid' },
                      filename: { type: 'string' },
                      mime: { type: 'string' },
                      size: { type: 'integer' },
                      hasData: { type: 'boolean' },
                      dataSize: { type: 'integer' },
                      correlationId: { type: 'string' }
                    }
                  }
                }
              }
            },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '404': { $ref: '#/components/responses/NotFound' },
            '500': { $ref: '#/components/responses/InternalError' }
          }
        }
      },
      '/api/v1/rankings/users': {
        get: {
          summary: 'Get user rankings',
          description: 'Get ranked list of citizens based on their service request approval rates and activity',
          tags: ['Rankings'],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'timeframe',
              in: 'query',
              description: 'Time period for ranking calculation',
              schema: {
                type: 'string',
                enum: ['week', 'month', 'quarter', 'year', 'all'],
                default: 'all'
              }
            },
            {
              name: 'category',
              in: 'query',
              description: 'Filter by service request category',
              schema: { type: 'string' }
            }
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
                        items: { $ref: '#/components/schemas/UserRanking' },
                        maxItems: 50,
                        description: 'Top 50 ranked users'
                      },
                      correlationId: { type: 'string' }
                    }
                  }
                }
              }
            },
            '400': { $ref: '#/components/responses/ValidationError' },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '500': { $ref: '#/components/responses/InternalError' }
          }
        }
      },
      '/api/v1/rankings/stats': {
        get: {
          summary: 'Get ranking statistics',
          description: 'Get overall statistics for the ranking system including active citizens, approval rates, and growth metrics',
          tags: ['Rankings'],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'timeframe',
              in: 'query',
              description: 'Time period for statistics calculation',
              schema: {
                type: 'string',
                enum: ['week', 'month', 'quarter', 'year', 'all'],
                default: 'all'
              }
            },
            {
              name: 'category',
              in: 'query',
              description: 'Filter by service request category',
              schema: { type: 'string' }
            }
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
                          activeCitizens: {
                            type: 'integer',
                            example: 125,
                            description: 'Number of citizens with requests in the timeframe'
                          },
                          approvedRequests: {
                            type: 'integer',
                            example: 487,
                            description: 'Number of approved requests'
                          },
                          avgApprovalRate: {
                            type: 'number',
                            example: 78.5,
                            description: 'Average approval rate percentage'
                          },
                          topPerformerGrowth: {
                            type: 'number',
                            example: 12.3,
                            description: 'Growth rate percentage compared to previous period'
                          }
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
            '500': { $ref: '#/components/responses/InternalError' }
          }
        }
      },
      '/api/v1/departments': {
        get: {
          summary: 'List departments',
          description: 'Get paginated list of departments with filtering and search capabilities',
          tags: ['Department Management'],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'isActive',
              in: 'query',
              description: 'Filter by active status',
              schema: { type: 'boolean' }
            },
            {
              name: 'search',
              in: 'query',
              description: 'Search in name, slug, description',
              schema: { type: 'string' }
            },
            {
              name: 'page',
              in: 'query',
              description: 'Page number',
              schema: { type: 'integer', default: 1, minimum: 1 }
            },
            {
              name: 'size',
              in: 'query',
              description: 'Page size',
              schema: { type: 'integer', default: 20, minimum: 1, maximum: 100 }
            },
            {
              name: 'sort',
              in: 'query',
              description: 'Sort field:direction (e.g., name:asc)',
              schema: { type: 'string', default: 'name:asc' }
            }
          ],
          responses: {
            '200': {
              description: 'Departments retrieved successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      data: {
                        type: 'array',
                        items: {
                          allOf: [
                            { $ref: '#/components/schemas/Department' },
                            {
                              type: 'object',
                              properties: {
                                _count: {
                                  type: 'object',
                                  properties: {
                                    users: { type: 'integer' },
                                    serviceRequests: { type: 'integer' }
                                  }
                                }
                              }
                            }
                          ]
                        }
                      },
                      pagination: { $ref: '#/components/schemas/Pagination' },
                      correlationId: { type: 'string' }
                    }
                  }
                }
              }
            },
            '400': { $ref: '#/components/responses/ValidationError' },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '500': { $ref: '#/components/responses/InternalError' }
          }
        },
        post: {
          summary: 'Create department',
          description: 'Create a new department (Admin/Supervisor only)',
          tags: ['Department Management'],
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    name: { type: 'string', minLength: 2, maxLength: 100 },
                    slug: { 
                      type: 'string', 
                      minLength: 2, 
                      maxLength: 50,
                      pattern: '^[a-z0-9-]+$',
                      description: 'URL-friendly identifier (lowercase letters, numbers, hyphens only)'
                    },
                    description: { type: 'string', maxLength: 500 },
                    isActive: { type: 'boolean', default: true }
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
            '403': { $ref: '#/components/responses/Forbidden' },
            '409': {
              description: 'Department name or slug already exists',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            },
            '500': { $ref: '#/components/responses/InternalError' }
          }
        }
      },
      '/api/v1/departments/{id}': {
        get: {
          summary: 'Get department details',
          description: 'Get detailed information about a specific department including users and recent requests',
          tags: ['Department Management'],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string', format: 'uuid' },
              description: 'Department ID'
            }
          ],
          responses: {
            '200': {
              description: 'Department details retrieved successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      data: {
                        allOf: [
                          { $ref: '#/components/schemas/Department' },
                          {
                            type: 'object',
                            properties: {
                              users: {
                                type: 'array',
                                maxItems: 50,
                                items: {
                                  type: 'object',
                                  properties: {
                                    id: { type: 'string', format: 'uuid' },
                                    name: { type: 'string' },
                                    email: { type: 'string', format: 'email' },
                                    role: { type: 'string' },
                                    isActive: { type: 'boolean' },
                                    createdAt: { type: 'string', format: 'date-time' }
                                  }
                                }
                              },
                              serviceRequests: {
                                type: 'array',
                                maxItems: 20,
                                items: {
                                  type: 'object',
                                  properties: {
                                    id: { type: 'string', format: 'uuid' },
                                    code: { type: 'string' },
                                    title: { type: 'string' },
                                    status: { type: 'string' },
                                    priority: { type: 'string' },
                                    createdAt: { type: 'string', format: 'date-time' }
                                  }
                                }
                              },
                              _count: {
                                type: 'object',
                                properties: {
                                  users: { type: 'integer' },
                                  serviceRequests: { type: 'integer' }
                                }
                              }
                            }
                          }
                        ]
                      },
                      correlationId: { type: 'string' }
                    }
                  }
                }
              }
            },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '404': { $ref: '#/components/responses/NotFound' },
            '500': { $ref: '#/components/responses/InternalError' }
          }
        },
        patch: {
          summary: 'Update department',
          description: 'Update department information (Admin/Supervisor only)',
          tags: ['Department Management'],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string', format: 'uuid' },
              description: 'Department ID'
            }
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    name: { type: 'string', minLength: 2, maxLength: 100 },
                    slug: { 
                      type: 'string', 
                      minLength: 2, 
                      maxLength: 50,
                      pattern: '^[a-z0-9-]+$'
                    },
                    description: { type: 'string', maxLength: 500 },
                    isActive: { type: 'boolean' }
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
            '404': { $ref: '#/components/responses/NotFound' },
            '409': {
              description: 'Department name or slug conflict',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            },
            '500': { $ref: '#/components/responses/InternalError' }
          }
        },
        delete: {
          summary: 'Delete department',
          description: 'Soft delete a department (Admin only). Cannot delete departments with assigned users.',
          tags: ['Department Management'],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string', format: 'uuid' },
              description: 'Department ID'
            }
          ],
          responses: {
            '200': {
              description: 'Department deleted successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      message: { type: 'string' },
                      correlationId: { type: 'string' }
                    }
                  }
                }
              }
            },
            '400': {
              description: 'Department has assigned users',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/Error' },
                      {
                        type: 'object',
                        properties: {
                          userCount: { type: 'integer' }
                        }
                      }
                    ]
                  }
                }
              }
            },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '403': { $ref: '#/components/responses/Forbidden' },
            '404': { $ref: '#/components/responses/NotFound' },
            '500': { $ref: '#/components/responses/InternalError' }
          }
        }
      },
      '/api/v1/departments/{id}/users': {
        get: {
          summary: 'Get department users',
          description: 'Get all users assigned to a specific department (Admin/Supervisor only)',
          tags: ['Department Management'],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string', format: 'uuid' },
              description: 'Department ID'
            }
          ],
          responses: {
            '200': {
              description: 'Department users retrieved successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      data: {
                        type: 'object',
                        properties: {
                          department: {
                            type: 'object',
                            properties: {
                              id: { type: 'string', format: 'uuid' },
                              name: { type: 'string' },
                              slug: { type: 'string' }
                            }
                          },
                          users: {
                            type: 'array',
                            items: {
                              allOf: [
                                {
                                  type: 'object',
                                  properties: {
                                    id: { type: 'string', format: 'uuid' },
                                    name: { type: 'string' },
                                    email: { type: 'string', format: 'email' },
                                    role: { type: 'string' },
                                    firstName: { type: 'string' },
                                    lastName: { type: 'string' },
                                    isActive: { type: 'boolean' },
                                    createdAt: { type: 'string', format: 'date-time' }
                                  }
                                },
                                {
                                  type: 'object',
                                  properties: {
                                    _count: {
                                      type: 'object',
                                      properties: {
                                        createdRequests: { type: 'integer' },
                                        assignedRequests: { type: 'integer' }
                                      }
                                    }
                                  }
                                }
                              ]
                            }
                          },
                          userCount: { type: 'integer' }
                        }
                      },
                      correlationId: { type: 'string' }
                    }
                  }
                }
              }
            },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '403': { $ref: '#/components/responses/Forbidden' },
            '404': { $ref: '#/components/responses/NotFound' },
            '500': { $ref: '#/components/responses/InternalError' }
          }
        }
      },
      '/api/v1/admin/stats': {
        get: {
          summary: 'Get system statistics',
          description: 'Get comprehensive system statistics including users, requests, and engagement metrics',
          tags: ['Admin'],
          security: [{ bearerAuth: [] }],
          responses: {
            '200': {
              description: 'System statistics retrieved successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      data: {
                        type: 'object',
                        properties: {
                          users: {
                            type: 'object',
                            properties: {
                              total: { type: 'integer', example: 150 },
                              active: { type: 'integer', example: 142 },
                              test: { type: 'integer', example: 25 }
                            }
                          },
                          requests: {
                            type: 'object',
                            properties: {
                              total: { type: 'integer', example: 487 },
                              submitted: { type: 'integer', example: 45 },
                              inProgress: { type: 'integer', example: 78 },
                              resolved: { type: 'integer', example: 324 }
                            }
                          },
                          engagement: {
                            type: 'object',
                            properties: {
                              comments: { type: 'integer', example: 1205 },
                              attachments: { type: 'integer', example: 892 },
                              upvotes: { type: 'integer', example: 2134 }
                            }
                          },
                          system: {
                            type: 'object',
                            properties: {
                              departments: { type: 'integer', example: 8 }
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
            '401': { $ref: '#/components/responses/Unauthorized' },
            '403': { $ref: '#/components/responses/Forbidden' },
            '500': { $ref: '#/components/responses/InternalError' }
          }
        }
      },
      '/api/v1/admin/test-data': {
        delete: {
          summary: 'Clean up all test data',
          description: 'Delete all test data including users, requests, comments, attachments, and upvotes',
          tags: ['Admin'],
          security: [{ bearerAuth: [] }],
          responses: {
            '200': {
              description: 'Test data cleaned up successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      message: { type: 'string' },
                      data: {
                        type: 'object',
                        properties: {
                          deletedCounts: {
                            type: 'object',
                            properties: {
                              users: { type: 'integer' },
                              requests: { type: 'integer' },
                              comments: { type: 'integer' },
                              attachments: { type: 'integer' },
                              upvotes: { type: 'integer' }
                            }
                          },
                          totalOperations: { type: 'integer' }
                        }
                      },
                      correlationId: { type: 'string' }
                    }
                  }
                }
              }
            },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '403': { $ref: '#/components/responses/Forbidden' },
            '500': { $ref: '#/components/responses/InternalError' }
          }
        }
      },
      '/api/v1/admin/test-data/validate': {
        get: {
          summary: 'Validate test data integrity',
          description: 'Validate the integrity of test data and relationships in the database',
          tags: ['Admin'],
          security: [{ bearerAuth: [] }],
          responses: {
            '200': {
              description: 'Test data validation completed',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      data: {
                        type: 'object',
                        properties: {
                          users: {
                            type: 'object',
                            properties: {
                              total: { type: 'integer' },
                              test: { type: 'integer' },
                              active: { type: 'integer' },
                              withoutDepartments: { type: 'integer' }
                            }
                          },
                          requests: {
                            type: 'object',
                            properties: {
                              total: { type: 'integer' },
                              withoutCreator: { type: 'integer' },
                              withInvalidStatus: { type: 'integer' }
                            }
                          },
                          relationships: {
                            type: 'object',
                            properties: {
                              orphanedComments: { type: 'integer' },
                              orphanedAttachments: { type: 'integer' },
                              orphanedUpvotes: { type: 'integer' }
                            }
                          },
                          issues: {
                            type: 'array',
                            items: {
                              type: 'object',
                              properties: {
                                type: { type: 'string' },
                                severity: { type: 'string', enum: ['ERROR', 'WARNING'] },
                                message: { type: 'string' },
                                count: { type: 'integer' },
                                details: { type: 'array' }
                              }
                            }
                          },
                          summary: {
                            type: 'object',
                            properties: {
                              isValid: { type: 'boolean' },
                              totalIssues: { type: 'integer' },
                              errors: { type: 'integer' },
                              warnings: { type: 'integer' },
                              status: { type: 'string', enum: ['HEALTHY', 'WARNING', 'ERROR'] },
                              validatedAt: { type: 'string', format: 'date-time' }
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
            '401': { $ref: '#/components/responses/Unauthorized' },
            '403': { $ref: '#/components/responses/Forbidden' },
            '500': { $ref: '#/components/responses/InternalError' }
          }
        }
      },
      '/api/v1/auth/token': {
        post: {
          summary: 'Get API authentication token',
          description: 'Authenticate and get a bearer token for API testing and automation (optimized for API clients)',
          tags: ['Authentication'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    email: { type: 'string', format: 'email' },
                    password: { type: 'string' }
                  },
                  required: ['email', 'password']
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'Authentication successful',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      accessToken: { type: 'string', description: 'JWT bearer token' },
                      tokenType: { type: 'string', example: 'Bearer' },
                      expiresIn: { type: 'string', example: '24h' },
                      user: {
                        type: 'object',
                        properties: {
                          id: { type: 'string', format: 'uuid' },
                          email: { type: 'string', format: 'email' },
                          role: { type: 'string' },
                          name: { type: 'string' }
                        }
                      },
                      correlationId: { type: 'string' }
                    }
                  }
                }
              }
            },
            '400': { $ref: '#/components/responses/ValidationError' },
            '401': {
              description: 'Invalid credentials',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            },
            '423': {
              description: 'Account locked',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            },
            '500': { $ref: '#/components/responses/InternalError' }
          }
        }
      },
      '/api/v1/attachments/{id}': {
        delete: {
          summary: 'Delete attachment',
          description: 'Delete a file attachment. Can be deleted by uploader, request owner, or staff.',
          tags: ['Attachments'],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string', format: 'uuid' },
              description: 'Attachment ID'
            }
          ],
          responses: {
            '200': {
              description: 'Attachment deleted successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      message: { type: 'string' },
                      data: {
                        type: 'object',
                        properties: {
                          id: { type: 'string', format: 'uuid' },
                          filename: { type: 'string' },
                          requestId: { type: 'string', format: 'uuid' },
                          requestTitle: { type: 'string' }
                        }
                      },
                      correlationId: { type: 'string' }
                    }
                  }
                }
              }
            },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '403': {
              description: 'Forbidden - cannot delete attachment or request is closed',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            },
            '404': { $ref: '#/components/responses/NotFound' },
            '500': { $ref: '#/components/responses/InternalError' }
          }
        }
      },
      '/api/v1/requests/{id}/assign': {
        post: {
          summary: 'Assign request to user',
          description: 'Assign a service request to a specific user and department',
          tags: ['Service Requests'],
          security: [{ bearerAuth: [] }],
          parameters: [{ $ref: '#/components/parameters/RequestId' }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    assignedTo: { type: 'string', format: 'uuid', description: 'User ID to assign to' },
                    departmentId: { type: 'string', format: 'uuid', description: 'Department ID' }
                  },
                  required: ['assignedTo', 'departmentId']
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
            '400': {
              description: 'Invalid assignee or missing parameters',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '403': { $ref: '#/components/responses/Forbidden' },
            '404': { $ref: '#/components/responses/NotFound' },
            '500': { $ref: '#/components/responses/InternalError' }
          }
        }
      },
      '/api/v1/requests/bulk': {
        post: {
          summary: 'Create multiple requests',
          description: 'Create multiple service requests in a single operation (max 100)',
          tags: ['Service Requests'],
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
                      minItems: 1,
                      maxItems: 100,
                      items: { $ref: '#/components/schemas/CreateServiceRequest' }
                    }
                  },
                  required: ['requests']
                }
              }
            }
          },
          responses: {
            '201': {
              description: 'Bulk request creation completed',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      data: {
                        type: 'object',
                        properties: {
                          created: {
                            type: 'array',
                            items: { $ref: '#/components/schemas/ServiceRequest' }
                          },
                          errors: {
                            type: 'array',
                            items: {
                              type: 'object',
                              properties: {
                                index: { type: 'integer' },
                                error: { type: 'string' },
                                data: { type: 'object' }
                              }
                            }
                          },
                          summary: {
                            type: 'object',
                            properties: {
                              total: { type: 'integer' },
                              created: { type: 'integer' },
                              failed: { type: 'integer' }
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
            '400': { $ref: '#/components/responses/ValidationError' },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '403': { $ref: '#/components/responses/Forbidden' },
            '500': { $ref: '#/components/responses/InternalError' }
          }
        },
        delete: {
          summary: 'Delete multiple requests',
          description: 'Delete multiple service requests and their associated data (Admin only, max 100)',
          tags: ['Service Requests'],
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    requestIds: {
                      type: 'array',
                      minItems: 1,
                      maxItems: 100,
                      items: { type: 'string', format: 'uuid' }
                    }
                  },
                  required: ['requestIds']
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'Bulk deletion completed',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      message: { type: 'string' },
                      data: {
                        type: 'object',
                        properties: {
                          deletedCount: { type: 'integer' },
                          requestIds: {
                            type: 'array',
                            items: { type: 'string', format: 'uuid' }
                          }
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
            '403': { $ref: '#/components/responses/Forbidden' },
            '404': {
              description: 'Some requests not found',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            },
            '500': { $ref: '#/components/responses/InternalError' }
          }
        }
      },
      '/api/v1/departments/{id}/stats': {
        get: {
          summary: 'Get department statistics',
          description: 'Get comprehensive statistics for a specific department including performance metrics',
          tags: ['Department Management'],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string', format: 'uuid' },
              description: 'Department ID'
            }
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
                          department: {
                            type: 'object',
                            properties: {
                              id: { type: 'string', format: 'uuid' },
                              name: { type: 'string' },
                              slug: { type: 'string' }
                            }
                          },
                          users: {
                            type: 'object',
                            properties: {
                              total: { type: 'integer' },
                              active: { type: 'integer' },
                              inactive: { type: 'integer' }
                            }
                          },
                          requests: {
                            type: 'object',
                            properties: {
                              total: { type: 'integer' },
                              byStatus: {
                                type: 'object',
                                additionalProperties: { type: 'integer' }
                              }
                            }
                          },
                          performance: {
                            type: 'object',
                            properties: {
                              avgResolutionTimeHours: { type: 'number', nullable: true },
                              topPerformers: {
                                type: 'array',
                                items: {
                                  type: 'object',
                                  properties: {
                                    id: { type: 'string', format: 'uuid' },
                                    name: { type: 'string' },
                                    email: { type: 'string', format: 'email' },
                                    resolvedRequests: { type: 'integer' }
                                  }
                                }
                              }
                            }
                          },
                          generatedAt: { type: 'string', format: 'date-time' }
                        }
                      },
                      correlationId: { type: 'string' }
                    }
                  }
                }
              }
            },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '403': { $ref: '#/components/responses/Forbidden' },
            '404': { $ref: '#/components/responses/NotFound' },
            '500': { $ref: '#/components/responses/InternalError' }
          }
        }
      },
      '/api/v1/comments': {
        get: {
          summary: 'List comments',
          description: 'Get paginated list of comments with filtering and search capabilities',
          tags: ['Comments'],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'requestId',
              in: 'query',
              description: 'Filter by service request ID',
              schema: { type: 'string', format: 'uuid' }
            },
            {
              name: 'visibility',
              in: 'query',
              description: 'Filter by comment visibility',
              schema: { type: 'string', enum: ['PUBLIC', 'INTERNAL', 'ALL'], default: 'ALL' }
            },
            {
              name: 'authorId',
              in: 'query',
              description: 'Filter by author ID',
              schema: { type: 'string', format: 'uuid' }
            },
            {
              name: 'search',
              in: 'query',
              description: 'Search in comment content',
              schema: { type: 'string' }
            },
            {
              name: 'page',
              in: 'query',
              description: 'Page number',
              schema: { type: 'integer', default: 1, minimum: 1 }
            },
            {
              name: 'size',
              in: 'query',
              description: 'Page size',
              schema: { type: 'integer', default: 20, minimum: 1, maximum: 100 }
            },
            {
              name: 'sort',
              in: 'query',
              description: 'Sort field:direction',
              schema: { type: 'string', default: 'createdAt:desc' }
            }
          ],
          responses: {
            '200': {
              description: 'Comments retrieved successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      data: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/Comment' }
                      },
                      pagination: { $ref: '#/components/schemas/Pagination' },
                      correlationId: { type: 'string' }
                    }
                  }
                }
              }
            },
            '400': { $ref: '#/components/responses/ValidationError' },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '500': { $ref: '#/components/responses/InternalError' }
          }
        }
      },
      '/api/v1/comments/{id}': {
        get: {
          summary: 'Get comment details',
          description: 'Get detailed information about a specific comment',
          tags: ['Comments'],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string', format: 'uuid' },
              description: 'Comment ID'
            }
          ],
          responses: {
            '200': {
              description: 'Comment retrieved successfully',
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
            '401': { $ref: '#/components/responses/Unauthorized' },
            '403': { $ref: '#/components/responses/Forbidden' },
            '404': { $ref: '#/components/responses/NotFound' },
            '500': { $ref: '#/components/responses/InternalError' }
          }
        },
        patch: {
          summary: 'Update comment',
          description: 'Update comment content or visibility (within 15 minutes for regular users)',
          tags: ['Comments'],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string', format: 'uuid' },
              description: 'Comment ID'
            }
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    body: { type: 'string', minLength: 10, maxLength: 1000 },
                    visibility: { type: 'string', enum: ['PUBLIC', 'INTERNAL'] }
                  },
                  required: ['body']
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'Comment updated successfully',
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
            '403': {
              description: 'Forbidden - not comment author or edit time expired',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            },
            '404': { $ref: '#/components/responses/NotFound' },
            '500': { $ref: '#/components/responses/InternalError' }
          }
        },
        delete: {
          summary: 'Delete comment',
          description: 'Delete a comment (author, request owner, or staff only)',
          tags: ['Comments'],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string', format: 'uuid' },
              description: 'Comment ID'
            }
          ],
          responses: {
            '200': {
              description: 'Comment deleted successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      message: { type: 'string' },
                      data: {
                        type: 'object',
                        properties: {
                          id: { type: 'string', format: 'uuid' },
                          requestId: { type: 'string', format: 'uuid' },
                          requestTitle: { type: 'string' }
                        }
                      },
                      correlationId: { type: 'string' }
                    }
                  }
                }
              }
            },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '403': {
              description: 'Forbidden - cannot delete comment or request is closed',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            },
            '404': { $ref: '#/components/responses/NotFound' },
            '500': { $ref: '#/components/responses/InternalError' }
          }
        }
      }
    },
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication and profile management'
      },
      {
        name: 'Service Requests',
        description: 'Service request management and operations'
      },
      {
        name: 'Attachments',
        description: 'File upload and attachment management'
      },
      {
        name: 'Rankings',
        description: 'User rankings and statistics'
      },
      {
        name: 'User Management',
        description: 'Administrative user management operations'
      },
      {
        name: 'Department Management',
        description: 'Department management and organizational operations'
      },
      {
        name: 'Comments',
        description: 'Comment management and moderation operations'
      },
      {
        name: 'Admin',
        description: 'Administrative operations and feature flags'
      },
      {
        name: 'Utility',
        description: 'Utility endpoints for health checks and API information'
      }
    ]
  },
  apis: [], // We're defining everything inline above
};

export const swaggerSpec = swaggerJsdoc(options);