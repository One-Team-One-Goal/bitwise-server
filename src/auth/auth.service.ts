import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class AuthService {
  private supabase: SupabaseClient;

  constructor(private configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL')!;
    const supabaseServiceKey = this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY')!;

    this.supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  async signup(signupDto: any) {
    return { message: 'Signup endpoint' };
  }

  async signin(signinDto: any) {
    return { message: 'Signin endpoint' };
  }

  // Validate token from frontend
  async validateToken(token: string) {
    try {
      const { data: { user }, error } = await this.supabase.auth.getUser(token);
      
      if (error || !user) {
        throw new UnauthorizedException('Invalid token');
      }

      return user;
    } catch (error) {
      throw new UnauthorizedException('Token validation failed');
    }
  }

  // Validate user by ID
  async validateUser(userId: string) {
    try {
      const { data: { user }, error } = await this.supabase.auth.admin.getUserById(userId);
      return error ? null : user;
    } catch (error) {
      return null;
    }
  }
}