import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'City Services Portal API',
      version: '1.0.0',
      description: 'API for managing city service requests and municipal services',
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
          responses: {
            '200': {
              description: 'API is healthy',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      ok: {
                        type: 'boolean',
                        example: true
                      },
                      correlationId: {
                        type: 'string',
                        format: 'uuid'
                      }
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
                      user: {
                        $ref: '#/components/schemas/User'
                      },
                      correlationId: {
                        type: 'string',
                        format: 'uuid'
                      }
                    }
                  }
                }
              }
            },
            '400': {
              description: 'Validation error',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/Error'
                  }
                }
              }
            },
            '409': {
              description: 'User already exists',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/Error'
                  }
                }
              }
            }
          }
        }
      },
      '/api/v1/auth/login': {
        post: {
          summary: 'User login',
          description: 'Authenticates user and returns access token',
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
                      user: {
                        $ref: '#/components/schemas/User'
                      },
                      correlationId: {
                        type: 'string',
                        format: 'uuid'
                      }
                    }
                  }
                }
              }
            },
            '401': {
              description: 'Invalid credentials',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/Error'
                  }
                }
              }
            }
          }
        }
      },
      '/api/v1/auth/me': {
        get: {
          summary: 'Get current user profile',
          description: 'Returns the authenticated user\'s profile information',
          security: [
            {
              bearerAuth: []
            }
          ],
          responses: {
            '200': {
              description: 'User profile retrieved successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      user: {
                        allOf: [
                          {
                            $ref: '#/components/schemas/User'
                          },
                          {
                            type: 'object',
                            properties: {
                              department: {
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
                                  }
                                }
                              }
                            }
                          }
                        ]
                      },
                      correlationId: {
                        type: 'string',
                        format: 'uuid'
                      }
                    }
                  }
                }
              }
            },
            '401': {
              description: 'Unauthorized - missing or invalid token',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/Error'
                  }
                }
              }
            }
          }
        }
      }
    }
  },
  apis: [], // We're defining everything inline above
};

export const swaggerSpec = swaggerJsdoc(options);