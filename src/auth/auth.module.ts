import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { ConfigModule } from '@nestjs/config';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
@Module({
  controllers: [AuthController],
  providers: [AuthService, JwtAuthGuard],
  imports: [ConfigModule],
  exports: [AuthService, JwtAuthGuard]
})
export class AuthModule {}
