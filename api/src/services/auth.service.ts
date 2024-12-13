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

  private constructor() {
    logAuth('Initializing AuthService');
    
    // Log environment configuration
    logAuth('Environment configuration:', {
      hasClientId: !!process.env.EVE_CLIENT_ID,
      hasClientSecret: !!process.env.EVE_CLIENT_SECRET,
      callbackUrl: process.env.EVE_CALLBACK_URL,
      nodeEnv: process.env.NODE_ENV
    });

    this.clientId = process.env.EVE_CLIENT_ID || '';
    this.clientSecret = process.env.EVE_CLIENT_SECRET || '';
    this.callbackUrl = process.env.EVE_CALLBACK_URL || '';
    this.jwtSecret = process.env.JWT_SECRET || 'default-secret';

    if (!this.clientId || !this.clientSecret || !this.callbackUrl) {
      const missing = [];
      if (!this.clientId) missing.push('EVE_CLIENT_ID');
      if (!this.clientSecret) missing.push('EVE_CLIENT_SECRET');
      if (!this.callbackUrl) missing.push('EVE_CALLBACK_URL');
      
      const error = `Missing required EVE Online SSO configuration: ${missing.join(', ')}`;
      logError(error);
      throw new Error(error);
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
        'esi-corporations.track_members.v1',
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
        'esi-characterstats.read.v1',
      ],
      state: true  // Enable CSRF protection
    }, async (accessToken: string, refreshToken: string, params: any, _profile: any, done: VerifyCallback) => {
      logVerify('Starting OAuth verification');
      try {
        // Updated verification endpoint
        logVerify('Making verification request to EVE SSO');
        const response = await axios.get('https://esi.evetech.net/verify/', {
          headers: { 
            'Authorization': `Bearer ${accessToken}`,
            'User-Agent': 'Pilot Command Cluster - Contact: your@email.com'
          }
        });

        logVerify('Received verification response:', {
          status: response.status,
          hasData: !!response.data
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
          stack: error.stack
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
    logAuth('Starting OAuth verification');
    
    try {
      logAuth('Making verification request to EVE SSO');
      // Verify the JWT token using the same secret used for generation
      const decoded = jwt.verify(token, this.jwtSecret);
      
      logAuth('Received verification response:', { 
        status: 200, 
        hasData: !!decoded 
      });

      if (decoded && typeof decoded === 'object') {
        logAuth('Verification successful for character:', {
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
} 