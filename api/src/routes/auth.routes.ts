import { Router, Request, Response } from 'express';
import passport from 'passport';
import { AuthService } from '../services/auth.service';
import { apiLogger } from '../middleware/apiLogger.middleware';
import { logApiCall, logError } from '../utils/logger';
import { AuthenticateOptions } from 'passport';

const router = Router();
const authService = AuthService.getInstance();

// Apply logging middleware to all auth routes
router.use(apiLogger);

// Initialize EVE Online SSO authentication
router.get('/login', (req: Request, res: Response, next) => {
  const frontendUrl = authService.getFrontendUrl();
  
  logApiCall('outgoing', {
    type: 'login_redirect',
    frontendUrl: frontendUrl
  });

  const authOptions: AuthenticateOptions = {
    failureRedirect: `${frontendUrl}/login`,
    state: 'true'
  };

  return passport.authenticate('oauth2', authOptions)(req, res, next);
});

// Callback URL for EVE Online SSO
router.get('/callback', (req: Request, res: Response, next) => {
  const frontendUrl = authService.getFrontendUrl();
  
  logApiCall('incoming', {
    type: 'auth_callback',
    query: req.query,
    headers: req.headers
  });

  passport.authenticate('oauth2', { 
    failureRedirect: `${frontendUrl}/login`,
    session: false
  }, (err: any, user: any) => {
    if (err) {
      const errorMessage = err.message || 'Authentication failed';
      logError('Authentication failed with error', {
        error: err.message,
        stack: err.stack,
        query: req.query
      });
      return res.redirect(`${frontendUrl}/login?error=${encodeURIComponent(errorMessage)}`);
    }
    
    if (!user) {
      logError('Authentication failed', new Error('No user returned from authentication'));
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
        hasRefreshToken: !!user.refreshToken,
        redirectUrl: redirectUrl.toString()
      });

      return res.redirect(redirectUrl.toString());
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to process authentication';
      logError('Failed to process authentication', {
        error,
        user: {
          id: user.id,
          characterId: user.characterId,
          characterName: user.characterName
        }
      });
      return res.redirect(`${frontendUrl}/login?error=${encodeURIComponent(errorMessage)}`);
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
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logError('Token verification failed', {
      error: errorMessage,
      token: token.substring(0, 10) + '...',
      stack: error instanceof Error ? error.stack : undefined
    });
    return res.status(401).json({ 
      error: 'Invalid token',
      message: errorMessage
    });
  }
});

// Refresh access token
router.post('/refresh', async (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    logError('Refresh token missing from request', new Error('No refresh token provided in request body'));
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
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logError('Token refresh failed', {
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined
    });
    return res.status(401).json({ error: 'Failed to refresh token', message: errorMessage });
  }
});

export default router; 