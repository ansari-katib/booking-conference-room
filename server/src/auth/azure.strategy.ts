import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { OIDCStrategy, IProfile, VerifyCallback } from 'passport-azure-ad';
import { AuthService } from './auth.service';
import type { Request } from 'express';

@Injectable()
export class AzureStrategy extends PassportStrategy(OIDCStrategy, 'azure') {
  constructor(private readonly authService: AuthService) {
    super({
      identityMetadata: `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID}/v2.0/.well-known/openid-configuration`,
      clientID: process.env.AZURE_CLIENT_ID ?? '',
      clientSecret: process.env.AZURE_CLIENT_SECRET ?? '',
      responseType: 'code',
      responseMode: 'form_post',
      redirectUrl:
        process.env.AZURE_REDIRECT_URI ??
        'http://localhost:5000/auth/azure/callback',
      allowHttpForRedirectUrl: process.env.NODE_ENV !== 'production',
      scope: ['openid', 'profile', 'email'],
      passReqToCallback: true,
    });
  }

  async validate(
    req: Request,
    profile: IProfile,
    done: VerifyCallback,
  ): Promise<void> {
    try {
      const user = await this.authService.findOrCreateAzureUser(profile);
      return done(null, user);
    } catch (error) {
      return done(error as Error, null);
    }
  }
}

