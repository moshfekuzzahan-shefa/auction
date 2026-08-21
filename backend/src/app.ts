import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import { errorHandler } from './middleware/error.middleware';
import routes from './modules';
import hpp from 'hpp';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';

const app = express();

// Trust reverse proxy (Render / Vercel) for rate-limiting & IP forwarding
app.set('trust proxy', 1);

// Server Request Timeout Safeguard (15 seconds max execution)
app.use((req, res, next) => {
  res.setTimeout(15000, () => {
    if (!res.headersSent) {
      res.status(504).json({
        success: false,
        message: 'Server Request Timeout: Operation took too long to respond.',
        timestamp: Date.now()
      });
    }
  });
  next();
});

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

// Enable gzip/brotli compression
app.use(compression());

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

// Lightweight Standalone Health Check Route (No DB / Redis Lock)
app.get('/api/health', (_req, res) => {
  res.status(200).json({ status: 'ok', server: 'auctionbyshefa', timestamp: Date.now(), uptime: Math.floor(process.uptime()) });
});

// Rate limiting setup using default MemoryStore for stability
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Exclude Critical Public & Socket Routes
    const path = req.originalUrl || req.url;
    if (path.startsWith('/api/public') || path.startsWith('/api/socket') || path.includes('/socket.io')) {
      return true;
    }
    return false;
  }
});

app.use('/api', apiLimiter);

// Mount main routing architecture
app.use('/api', routes);

// Mount OpenAPI documentation
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Global Error Handler
app.use(errorHandler);

export default app;
