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
      '/api/v1/departments': {
        get: {
          tags: ['Departments'],
          summary: 'List departments',
          description: 'Get all departments with optional filtering',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'isActive', in: 'query', schema: { type: 'boolean' } }
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
      }
    }
  },
  apis: [], // We're defining everything inline above
};

export const swaggerSpec = swaggerJsdoc(options);