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

// Security and utility middlewares
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      imgSrc: ["'self'", "data:", "https://res.cloudinary.com"],
      connectSrc: ["'self'", process.env.CLIENT_URL || 'http://localhost:5173'],
    },
  },
}));

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '10kb' })); // Body limit for security
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());


// Prevent parameter pollution
app.use(hpp());

// CSRF Protection (Double Submit Cookie)
const csrfProtection = csurf({ cookie: { httpOnly: true, sameSite: 'strict', secure: process.env.NODE_ENV === 'production' } });

// Provide CSRF token route
app.get('/api/csrf-token', csrfProtection, (req, res) => {
  res.status(200).json({ csrfToken: req.csrfToken() });
});

// Apply CSRF to all API routes except public GET routes (or apply globally and manage exceptions)
// For simplicity in this platform, we apply it conditionally based on route or let it be global
// Wait, global CSRF breaks if frontend doesn't have it yet. Let's apply it globally but frontend needs update.
app.use('/api', csrfProtection);

import RedisStore from 'rate-limit-redis';
import { createClient } from 'redis';

// Note: Redis client should ideally be imported from a central config
const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});
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
