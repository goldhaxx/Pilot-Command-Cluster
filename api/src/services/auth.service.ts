import * as dotenv from 'dotenv';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import { Strategy as OAuth2Strategy, VerifyCallback } from 'passport-oauth2';
import passport from 'passport';
import debug from 'debug';
import { logApiCall, logError } from '../utils/logger';

// Create namespaced debuggers
const logAuth = debug('pcc:auth:verify');
const logDebugError = debug('pcc:auth:error');
const logVerify = debug('pcc:auth:verify');

// Load environment variables at the start
dotenv.config();

interface EveCharacterData {
  CharacterID: number;
  CharacterName: string;
  ExpiresOn: string;
  Scopes: string;
  TokenType: string;
  CharacterOwnerHash: string;
  IntellectualProperty: string;
}

export class AuthService {
  private static instance: AuthService;
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly callbackUrl: string;
  private readonly jwtSecret: string;
  private readonly frontendUrl: string;

  private constructor() {
    logAuth('Initializing AuthService');
    
    // Get environment variables
    this.clientId = process.env.EVE_CLIENT_ID || '';
    this.clientSecret = process.env.EVE_CLIENT_SECRET || '';
    this.callbackUrl = process.env.EVE_CALLBACK_URL || '';
    this.jwtSecret = process.env.JWT_SECRET || '';
    this.frontendUrl = process.env.FRONTEND_URL || '';

    // Log environment configuration
    logAuth('Environment configuration:', {
      hasClientId: !!this.clientId,
      hasClientSecret: !!this.clientSecret,
      callbackUrl: this.callbackUrl,
      frontendUrl: this.frontendUrl,
      nodeEnv: process.env.NODE_ENV
    });

    // Validate required environment variables
    const missing = [];
    if (!this.clientId) missing.push('EVE_CLIENT_ID');
    if (!this.clientSecret) missing.push('EVE_CLIENT_SECRET');
    if (!this.callbackUrl) missing.push('EVE_CALLBACK_URL');
    if (!this.jwtSecret) missing.push('JWT_SECRET');
    if (!this.frontendUrl) missing.push('FRONTEND_URL');
    
    if (missing.length > 0) {
      const error = `Missing required environment variables: ${missing.join(', ')}`;
      logError(error);
      throw new Error(error);
    }

    // Validate URLs
    try {
      new URL(this.callbackUrl);
      new URL(this.frontendUrl);
    } catch (error) {
      const urlError = 'Invalid URL format in environment variables';
      logError(urlError, { error, callbackUrl: this.callbackUrl, frontendUrl: this.frontendUrl });
      throw new Error(urlError);
    }

    this.configurePassport();
  }

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  private configurePassport() {
    logAuth('Configuring Passport OAuth2 strategy');
    
    logAuth('Using callback URL:', this.callbackUrl);
    logAuth('Using frontend URL:', this.frontendUrl);

    passport.use(new OAuth2Strategy({
      authorizationURL: 'https://login.eveonline.com/v2/oauth/authorize',
      tokenURL: 'https://login.eveonline.com/v2/oauth/token',
      clientID: this.clientId,
      clientSecret: this.clientSecret,
      callbackURL: this.callbackUrl,
      scope: [
        'publicData',
        'esi-calendar.read_calendar_events.v1',
        'esi-location.read_location.v1',
        'esi-location.read_ship_type.v1',
        'esi-skills.read_skills.v1',
        'esi-skills.read_skillqueue.v1',
        'esi-wallet.read_character_wallet.v1',
        'esi-wallet.read_corporation_wallet.v1',
        'esi-clones.read_clones.v1',
        'esi-characters.read_contacts.v1',
        'esi-universe.read_structures.v1',
        'esi-bookmarks.read_character_bookmarks.v1',
        'esi-killmails.read_killmails.v1',
        'esi-corporations.read_corporation_membership.v1',
        'esi-assets.read_assets.v1',
        'esi-fleets.read_fleet.v1',
        'esi-fittings.read_fittings.v1',
        'esi-corporations.read_structures.v1',
        'esi-characters.read_loyalty.v1',
        'esi-characters.read_opportunities.v1',
        'esi-characters.read_chat_channels.v1',
        'esi-characters.read_medals.v1',
        'esi-characters.read_standings.v1',
        'esi-characters.read_agents_research.v1',
        'esi-industry.read_character_jobs.v1',
        'esi-markets.read_character_orders.v1',
        'esi-characters.read_blueprints.v1',
        'esi-characters.read_corporation_roles.v1',
        'esi-location.read_online.v1',
        'esi-contracts.read_character_contracts.v1',
        'esi-clones.read_implants.v1',
        'esi-characters.read_fatigue.v1',
        'esi-killmails.read_corporation_killmails.v1',
        'esi-wallet.read_corporation_wallets.v1',
        'esi-characters.read_notifications.v1',
        'esi-corporations.read_divisions.v1',
        'esi-corporations.read_contacts.v1',
        'esi-assets.read_corporation_assets.v1',
        'esi-corporations.read_titles.v1',
        'esi-corporations.read_blueprints.v1',
        'esi-bookmarks.read_corporation_bookmarks.v1',
        'esi-contracts.read_corporation_contracts.v1',
        'esi-corporations.read_standings.v1',
        'esi-corporations.read_starbases.v1',
        'esi-industry.read_corporation_jobs.v1',
        'esi-markets.read_corporation_orders.v1',
        'esi-corporations.read_container_logs.v1',
        'esi-industry.read_character_mining.v1',
        'esi-industry.read_corporation_mining.v1',
        'esi-planets.read_customs_offices.v1',
        'esi-corporations.read_facilities.v1',
        'esi-corporations.read_medals.v1',
        'esi-characters.read_titles.v1',
        'esi-alliances.read_contacts.v1',
        'esi-characters.read_fw_stats.v1',
        'esi-corporations.read_fw_stats.v1',
        'esi-characterstats.read.v1'
      ],
      state: true,
      pkce: false,
      customHeaders: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Host': 'login.eveonline.com'
      },
    }, async (accessToken: string, refreshToken: string, params: any, _profile: any, done: VerifyCallback) => {
      logVerify('Starting OAuth verification with params:', {
        hasAccessToken: !!accessToken,
        hasRefreshToken: !!refreshToken,
        params: params
      });

      try {
        // Updated verification endpoint
        logVerify('Making verification request to ESI');
        const response = await axios.get('https://esi.evetech.net/verify/', {
          headers: { 
            'Authorization': `Bearer ${accessToken}`,
            'User-Agent': 'Pilot Command Cluster - Contact: your@email.com'
          }
        });

        logVerify('Received verification response:', {
          status: response.status,
          hasData: !!response.data,
          data: response.data
        });

        const characterData = response.data as EveCharacterData;
        const user = {
          id: characterData.CharacterID.toString(),
          characterId: characterData.CharacterID,
          characterName: characterData.CharacterName,
          accessToken,
          refreshToken,
          expiresIn: params.expires_in || 1200,
          tokenType: characterData.TokenType
        };

        logVerify('Verification successful for character:', {
          characterId: user.characterId,
          characterName: user.characterName,
          expiresIn: user.expiresIn
        });

        return done(null, user);
      } catch (error: any) {
        logDebugError('Verification failed:', {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data,
          stack: error.stack,
          headers: error.response?.headers
        });
        return done(error);
      }
    }));

    passport.serializeUser((user, done) => {
      done(null, user);
    });

    passport.deserializeUser((user, done) => {
      done(null, user as Express.User);
    });
  }

  public async refreshToken(refreshToken: string): Promise<{ accessToken: string, expiresIn: number }> {
    logAuth('Attempting to refresh token');
    try {
      const response = await axios.post('https://login.eveonline.com/v2/oauth/token', {
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: this.clientId,
        client_secret: this.clientSecret
      }, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Host': 'login.eveonline.com'
        }
      });

      logAuth('Token refresh successful');
      return {
        accessToken: response.data.access_token,
        expiresIn: response.data.expires_in
      };
    } catch (error: any) {
      logDebugError('Token refresh failed:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      logError('Token refresh failed', error);
      throw new Error('Failed to refresh token');
    }
  }

  public generateToken(user: any): string {
    const payload = {
      id: user.id,
      characterId: user.characterId,
      characterName: user.characterName,
      accessToken: user.accessToken
    };
    return jwt.sign(payload, this.jwtSecret, { expiresIn: '24h' });
  }

  public verifyToken(token: string): any {
    logAuth('Starting token verification');
    
    try {
      logAuth('Verifying JWT token');
      const decoded = jwt.verify(token, this.jwtSecret);
      
      logAuth('Token verification successful:', { 
        hasData: !!decoded 
      });

      if (decoded && typeof decoded === 'object') {
        logAuth('Token contains valid user data:', {
          characterId: decoded.characterId,
          characterName: decoded.characterName
        });
        
        logApiCall('outgoing', {
          service: 'auth',
          action: 'verify',
          status: 'success',
          data: {
            characterId: decoded.characterId,
            characterName: decoded.characterName
          }
        });

        return decoded;
      }

      throw new Error('Invalid token structure');
    } catch (error) {
      logDebugError('Token verification failed:', error);
      logError(error, {
        service: 'auth',
        action: 'verify',
        token: token.substring(0, 10) + '...'
      });
      throw error;
    }
  }

  public getFrontendUrl(): string {
    return this.frontendUrl;
  }
} 