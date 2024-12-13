import { Express } from 'express';

declare global {
  namespace Express {
    interface User {
      id: string;
      characterId: number;
      characterName: string;
      accessToken: string;
      refreshToken: string;
      expiresIn?: number;
      tokenType?: string;
    }
  }
} 