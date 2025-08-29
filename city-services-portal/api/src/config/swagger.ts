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