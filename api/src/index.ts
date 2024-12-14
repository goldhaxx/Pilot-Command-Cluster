import * as dotenv from 'dotenv';
import express from 'express';
import session from 'express-session';
import cors from 'cors';
import passport from 'passport';
import authRoutes from './routes/auth.routes';
import { AuthService } from './services/auth.service';
import debug from 'debug';
import { logger } from './utils/logger';
import { apiLogger } from './middleware/apiLogger.middleware';

// Enable debug logging in development
if (process.env.NODE_ENV !== 'production') {
  debug.enable('pcc:*');
}

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Session configuration
app.use(session({
  secret: process.env.JWT_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'none'
  },
  proxy: true // Trust the reverse proxy
}));

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
      const serverInfo = {
        event: 'SERVER_START',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        port: port,
        config: {
          allowedOrigins,
          eveCallbackUrl: process.env.EVE_CALLBACK_URL,
          frontendUrl: process.env.FRONTEND_URL,
          nodeEnv: process.env.NODE_ENV
        }
      };

      // Log server start
      logger.info('Server started successfully', serverInfo);
      console.log(`Server is running on port ${port}`);
      console.log(`EVE Online SSO callback URL: ${process.env.EVE_CALLBACK_URL}`);
    });

    // Handle graceful shutdown
    const shutdown = (signal: string) => {
      console.log(`\n${signal} received. Starting graceful shutdown...`);
      
      server.close(() => {
        const shutdownInfo = {
          event: 'SERVER_STOP',
          timestamp: new Date().toISOString(),
          environment: process.env.NODE_ENV,
          signal: signal,
          message: 'Server shutdown completed'
        };

        // Log server stop
        logger.info('Server stopped', shutdownInfo);
        
        process.exit(0);
      });
    };

    // Handle shutdown signals
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

  } catch (error) {
    const errorInfo = {
      event: 'SERVER_START_ERROR',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      port: port,
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name
      } : error
    };

    logger.error('Failed to start server', errorInfo);
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer(); 