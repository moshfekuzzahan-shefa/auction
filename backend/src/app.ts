import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import { errorHandler } from './middleware/error.middleware';
import routes from './modules';

import hpp from 'hpp';
import csurf from 'csurf';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';


const app = express();

const isOriginAllowed = (origin: string | undefined): boolean => {
  if (!origin) return true; // Allow requests with no origin (mobile apps, Postman, curl)
  if (
    origin === process.env.CLIENT_URL ||
    origin.endsWith('.vercel.app') ||
    origin.includes('localhost') ||
    origin.includes('127.0.0.1')
  ) {
    return true;
  }
  return true; // Allow all valid origins in production
};

// Security and utility middlewares
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      imgSrc: ["'self'", "data:", "https://res.cloudinary.com"],
      connectSrc: ["'self'", "*"],
    },
  },
}));

app.use(cors({
  origin: (origin, callback) => {
    callback(null, isOriginAllowed(origin));
  },
  credentials: true,
}));
app.use(express.json({ limit: '10kb' })); // Body limit for security
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// Prevent parameter pollution
app.use(hpp());

// CSRF Protection (Double Submit Cookie)
const csrfProtection = csurf({ cookie: { httpOnly: true, sameSite: 'none', secure: true } });

// Provide CSRF token route
app.get('/api/csrf-token', csrfProtection, (req, res) => {
  res.status(200).json({ csrfToken: req.csrfToken() });
});

// Paths that do not require CSRF token validation (login, registration, public routes)
const csrfExcludedPaths = [
  '/auth/login',
  '/auth/register',
  '/player/register',
  '/csrf-token'
];

// Apply CSRF protection ONLY to state-modifying requests (POST, PUT, PATCH, DELETE) except auth/public
app.use('/api', (req, res, next) => {
  const isExcluded = csrfExcludedPaths.some(path => req.path.includes(path));
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method) && !isExcluded) {
    return csrfProtection(req, res, next);
  }
  next();
});

import RedisStore from 'rate-limit-redis';
import { createClient } from 'redis';

// Note: Redis client should ideally be imported from a central config
const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});
redisClient.on('error', (err) => console.error('Redis Client Error', err));
redisClient.connect().catch(console.error);

// Rate limiting setup with Redis
const limiter = rateLimit({
  store: new RedisStore({
    sendCommand: (...args: string[]) => redisClient.sendCommand(args),
  }),
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

// Mount main routing architecture
app.use('/api', routes);

// Mount OpenAPI documentation
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Global Error Handler
app.use(errorHandler);

export default app;
