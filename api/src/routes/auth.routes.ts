import { Router, Request, Response } from 'express';
import passport from 'passport';
import { AuthService } from '../services/auth.service';
import { apiLogger } from '../middleware/apiLogger.middleware';
import { logApiCall, logError } from '../utils/logger';

const router = Router();
const authService = AuthService.getInstance();

// Apply logging middleware to all auth routes
router.use(apiLogger);

// Initialize EVE Online SSO authentication
router.get('/login', (req: Request, res: Response, next) => {
  const frontendUrl = process.env.FRONTEND_URL || 'https://pilot-command-cluster-web.vercel.app';
  
  return passport.authenticate('oauth2', {
    failureRedirect: `${frontendUrl}/login`,
    state: true
  })(req, res, next);
});

// Callback URL for EVE Online SSO
router.get('/callback', (req: Request, res: Response, next) => {
  const frontendUrl = process.env.FRONTEND_URL || 'https://pilot-command-cluster-web.vercel.app';
  
  passport.authenticate('oauth2', { 
    failureRedirect: `${frontendUrl}/login`,
    session: false
  }, (err, user) => {
    if (err || !user) {
      logError('Authentication failed', err);
      return res.redirect(`${frontendUrl}/login?error=Authentication failed`);
    }

    try {
      const token = authService.generateToken(user);
      const redirectUrl = new URL('/auth-callback', frontendUrl);
      redirectUrl.searchParams.append('token', token);
      redirectUrl.searchParams.append('eveAccessToken', user.accessToken);
      redirectUrl.searchParams.append('refreshToken', user.refreshToken);
      redirectUrl.searchParams.append('expiresIn', (user.expiresIn || 1200).toString());

      logApiCall('outgoing', {
        type: 'auth_callback_redirect',
        status: 'success',
        hasToken: !!token,
        hasEveAccessToken: !!user.accessToken,
        hasRefreshToken: !!user.refreshToken
      });

      return res.redirect(redirectUrl.toString());
    } catch (error) {
      logError('Failed to process authentication', error);
      return res.redirect(`${frontendUrl}/login?error=Failed to process authentication`);
    }
  })(req, res, next);
});

// Verify JWT token
router.get('/verify', (req: Request, res: Response) => {
  logApiCall('incoming', {
    type: 'verification_request',
    headers: req.headers,
    url: req.url
  });

  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    logError('No token provided in verification request', {
      headers: req.headers
    });
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = authService.verifyToken(token);
    logApiCall('outgoing', {
      type: 'verification_response',
      status: 'success',
      characterId: decoded.characterId,
      characterName: decoded.characterName
    });
    return res.json(decoded);
  } catch (error) {
    logError('Token verification failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      token: token.substring(0, 10) + '...',
      stack: error instanceof Error ? error.stack : undefined
    });
    return res.status(401).json({ 
      error: 'Invalid token',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Refresh access token
router.post('/refresh', async (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    logError('Refresh token missing from request');
    return res.status(400).json({ error: 'No refresh token provided' });
  }

  try {
    const { accessToken, expiresIn } = await authService.refreshToken(refreshToken);
    
    logApiCall('outgoing', {
      type: 'token_refresh',
      status: 'success',
      expiresIn
    });

    return res.json({ 
      accessToken,
      expiresIn
    });
  } catch (error) {
    logError('Token refresh failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return res.status(401).json({ error: 'Failed to refresh token' });
  }
});

export default router; 