import debug from 'debug';
import { logErrorEvent, loggedFetch } from '../utils/logger';

const logAuth = debug('pcc:web:auth');

interface TokenData {
  token: string;
  expiresAt: number;
}

export class AuthService {
  private static instance: AuthService;
  private readonly baseUrl: string;
  private static token: string | null = null;
  private static eveAccessToken: TokenData | null = null;
  private static refreshToken: string | null = null;

  private constructor() {
    logAuth('Initializing AuthService');
    this.baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001';
    logAuth('Using API base URL:', this.baseUrl);
  }

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  public static verifyToken(token: string): Promise<any> {
    logAuth('Verifying token');
    return this.getInstance().verifyToken(token);
  }

  public static setToken(token: string, eveAccessToken: string, refreshToken: string, expiresIn: number = 1200): void {
    logAuth('Setting tokens');
    this.token = token;
    this.refreshToken = refreshToken;
    this.eveAccessToken = {
      token: eveAccessToken,
      expiresAt: Date.now() + (expiresIn * 1000)
    };
    localStorage.setItem('eve_auth_token', token);
    localStorage.setItem('eve_access_token', eveAccessToken);
    localStorage.setItem('eve_refresh_token', refreshToken);
    localStorage.setItem('eve_token_expires_at', this.eveAccessToken.expiresAt.toString());
  }

  public static clearToken(): void {
    logAuth('Clearing tokens');
    this.token = null;
    this.eveAccessToken = null;
    this.refreshToken = null;
    localStorage.removeItem('eve_auth_token');
    localStorage.removeItem('eve_access_token');
    localStorage.removeItem('eve_refresh_token');
    localStorage.removeItem('eve_token_expires_at');
  }

  public static initiateLogin(): void {
    logAuth('Initiating login via static method');
    try {
      // Save current path for post-login redirect
      const currentPath = window.location.pathname;
      if (currentPath !== '/login' && currentPath !== '/auth-callback') {
        sessionStorage.setItem('returnPath', currentPath);
      }
      
      this.getInstance().login();
    } catch (error) {
      logErrorEvent(error, {
        context: 'AuthService.initiateLogin',
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  }

  public static getLoginUrl(): string {
    return `${this.getInstance().baseUrl}/auth/login`;
  }

  public static isAuthenticated(): boolean {
    logAuth('Checking authentication status');
    return !!this.token || !!localStorage.getItem('eve_auth_token');
  }

  public static getToken(): string | null {
    logAuth('Getting stored token');
    return this.token || localStorage.getItem('eve_auth_token');
  }

  public static async getEveAccessToken(): Promise<string | null> {
    logAuth('Getting EVE access token');
    
    // Initialize token data from storage if not in memory
    if (!this.eveAccessToken) {
      const token = localStorage.getItem('eve_access_token');
      const expiresAt = localStorage.getItem('eve_token_expires_at');
      if (token && expiresAt) {
        this.eveAccessToken = {
          token,
          expiresAt: parseInt(expiresAt)
        };
      }
    }

    // If no token data exists, return null
    if (!this.eveAccessToken) {
      return null;
    }

    // Check if token is expired or will expire in the next minute
    const isExpiringSoon = this.eveAccessToken.expiresAt - Date.now() < 60000; // 1 minute
    if (isExpiringSoon) {
      logAuth('EVE access token is expired or expiring soon, attempting refresh');
      try {
        await this.refreshEveAccessToken();
      } catch (error) {
        logErrorEvent(error, { context: 'refreshing EVE access token' });
        this.clearToken(); // Clear tokens on refresh failure
        return null;
      }
    }

    return this.eveAccessToken.token;
  }

  private static async refreshEveAccessToken(): Promise<void> {
    const refreshToken = this.refreshToken || localStorage.getItem('eve_refresh_token');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await loggedFetch(`${this.getInstance().baseUrl}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken })
      });

      if (!response.ok) {
        throw new Error('Failed to refresh token');
      }

      const data = await response.json();
      this.eveAccessToken = {
        token: data.accessToken,
        expiresAt: Date.now() + (data.expiresIn * 1000)
      };
      localStorage.setItem('eve_access_token', data.accessToken);
      localStorage.setItem('eve_token_expires_at', this.eveAccessToken.expiresAt.toString());
      
      logAuth('Successfully refreshed EVE access token');
    } catch (error) {
      logErrorEvent(error, { context: 'refreshing EVE access token' });
      throw error;
    }
  }

  public async login(): Promise<void> {
    logAuth('Initiating login process');
    try {
      const loginUrl = AuthService.getLoginUrl();
      logAuth('Login URL:', loginUrl);
      
      // Log the redirect attempt
      logAuth('Redirecting to login URL', {
        type: 'login_redirect',
        url: loginUrl,
        timestamp: new Date().toISOString()
      });

      // Force a full page redirect
      window.location.replace(loginUrl);
    } catch (error) {
      logErrorEvent(error, {
        context: 'AuthService.login',
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  }

  public async handleCallback(code: string): Promise<any> {
    logAuth('Processing callback with code');
    try {
      const response = await loggedFetch(`${this.baseUrl}/auth/callback?code=${code}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      logAuth('Callback processed successfully');
      return data;
    } catch (error) {
      logErrorEvent(error, { context: 'callback processing' });
      throw error;
    }
  }

  public async verifyToken(token: string): Promise<any> {
    logAuth('Making token verification request');
    try {
      const url = `${this.baseUrl}/auth/verify`;
      logAuth('Verification URL:', url);
      logAuth('Token being verified:', token.substring(0, 20) + '...');

      const response = await loggedFetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        const error = new Error(errorData.message || 'Invalid token');
        logErrorEvent(error, {
          status: response.status,
          statusText: response.statusText,
          error: errorData,
          url: url
        });
        throw error;
      }

      const data = await response.json();
      logAuth('Token verification successful:', {
        characterId: data.characterId,
        characterName: data.characterName
      });

      return data;
    } catch (error) {
      logErrorEvent(error, {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }
} 