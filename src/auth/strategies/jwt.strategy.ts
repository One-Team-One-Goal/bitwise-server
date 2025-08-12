import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
        private configService: ConfigService,
        private authService: AuthService,
    ) {
        const jwtSecret = configService.get<string>('JWT_SECRET');
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey: jwtSecret!,
            ignoreExpiration: false,
            algorithms: ['HS256'],
        });
    }

    async validate(payload: any) {
        try {
            const user = await this.authService.validateUser(payload.sub)

            if (!user) {
                throw new UnauthorizedException();
            }

            return {
                id: payload.sub,
                email: payload.email,
                metadata: payload.user_metadata || {},
            }
        } catch (error) {
            throw new UnauthorizedException();
        }
    }
}