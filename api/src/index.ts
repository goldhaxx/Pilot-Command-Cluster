import * as dotenv from 'dotenv';
import express from 'express';
import session from 'express-session';
import cors from 'cors';
import passport from 'passport';
import authRoutes from './routes/auth.routes';
import { AuthService } from './services/auth.service';
import debug from 'debug';

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
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'];
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = `The CORS policy for this site does not allow access from the specified Origin: ${origin}`;
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Authorization', 'Content-Type', 'Accept']
}));
app.use(express.json());
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use('/auth', authRoutes);

// Basic health check route
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', message: 'Pilot Command Cluster API is running' });
});

// Start server
const startServer = async () => {
  try {
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
      console.log(`EVE Online SSO callback URL: ${process.env.EVE_CALLBACK_URL}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer(); 