import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'University Football Platform API',
      version: '1.0.0',
      description: 'API documentation for the University Football Platform backend services.',
    },
    servers: [
      {
        url: 'http://localhost:5000/api',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'accessToken',
        },
      },
    },
    security: [
      {
        cookieAuth: [],
      },
    ],
  },
  apis: ['./src/modules/**/*.routes.ts', './src/modules/**/*.controller.ts'], // Path to the API docs
};

export const swaggerSpec = swaggerJsdoc(options);
