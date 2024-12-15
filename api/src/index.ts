import * as dotenv from 'dotenv';
import express from 'express';
import session from 'express-session';
import cors from 'cors';
import passport from 'passport';
import authRoutes from './routes/auth.routes';
import { AuthService } from './services/auth.service';
import debug from 'debug';
import { logInfo, logError } from './utils/logger';
import { apiLogger } from './middleware/apiLogger.middleware';
import path from 'path';
import fs from 'fs';

// Enable debug logging in development
if (process.env.NODE_ENV !== 'production') {
  debug.enable('pcc:*');
}

// Load environment variables
dotenv.config();

logInfo('Starting server with environment configuration', {
  NODE_ENV: process.env.NODE_ENV,
  LOG_LEVEL: process.env.LOG_LEVEL,
  logsDirectory: path.join(process.cwd(), 'logs'),
  logsExist: fs.existsSync(path.join(process.cwd(), 'logs'))
});

const app = express();
const port = process.env.PORT || 3001;

// Session configuration
const sessionConfig = {
  secret: process.env.JWT_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: true,
  proxy: true,
  cookie: process.env.NODE_ENV === 'production' 
    ? {
        secure: true,
        sameSite: 'none' as const,
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000
      }
    : {
        secure: false,
        sameSite: 'lax' as const,
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000
      }
};

// In production, ensure cookies are secure
if (process.env.NODE_ENV === 'production') {
  sessionConfig.cookie.secure = true; // Require HTTPS
}

app.use(session(sessionConfig));

// Enable trust proxy for secure cookies behind reverse proxy
app.set('trust proxy', 1);

// Initialize authentication service
AuthService.getInstance();

// Middleware
const allowedOrigins = [
  'https://pilot-command-cluster-web.vercel.app',
  'http://localhost:3000'
];

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Authorization', 'Content-Type', 'Accept']
}));
app.use(express.json());
app.use(passport.initialize());
app.use(passport.session());

// Handle favicon.ico requests before other middleware
app.get('/favicon.ico', (_req, res) => res.status(404).end());

// Add API logger middleware to all routes
app.use(apiLogger);

// Routes
app.use('/auth', authRoutes);

// Basic health check route
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', message: 'Pilot Command Cluster API is running' });
});

// Start server
const startServer = async () => {
  try {
    const server = app.listen(port, () => {
      logInfo('Server started successfully', {
        environment: process.env.NODE_ENV,
        port: port,
        config: {
          allowedOrigins,
          eveCallbackUrl: process.env.EVE_CALLBACK_URL,
          frontendUrl: process.env.FRONTEND_URL
        }
      });
      logError('Server lifecycle event', { event: 'START', port, environment: process.env.NODE_ENV });
    });

    // Handle graceful shutdown
    const shutdown = (signal: string) => {
      console.log(`\n${signal} received. Starting graceful shutdown...`);
      
      server.close(() => {
        logInfo('Server stopped', {
          signal,
          environment: process.env.NODE_ENV
        });
        logError('Server lifecycle event', { event: 'STOP', signal, environment: process.env.NODE_ENV });
        process.exit(0);
      });
    };

    // Handle shutdown signals
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

  } catch (error) {
    logError('Failed to start server', error);
    process.exit(1);
  }
};

startServer(); 