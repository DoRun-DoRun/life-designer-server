import path, { dirname } from 'path';
import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Life Designer',
      version: '1.0.0',
      description: 'API documentation for Life Designer',
    },
    servers: [
      {
        url: 'http://localhost:3000', // 서버 주소
        description: 'Local development server',
      },
      {
        url: 'http://43.202.173.71:3000', // 프로덕션 서버 주소
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT', // JWT 형식 사용
        },
      },
    },
    security: [
      {
        bearerAuth: [], // 모든 엔드포인트에 기본적으로 적용
      },
    ],
  },
  apis: [
    path.join(__dirname, './swagger/authentication.js'),
    path.join(__dirname, './swagger/users.js'),
    path.join(__dirname, './swagger/routines.js'),
    path.join(__dirname, './swagger/subRoutines.js'),
    path.join(__dirname, './swagger/statistics.js'),
  ],
};

const swaggerSpec = swaggerJSDoc(options);

export default (app) => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
};
