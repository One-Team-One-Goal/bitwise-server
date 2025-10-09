import { Module } from '@nestjs/common';
import { AdaptiveController } from './adaptive.controller';
import { AdaptiveService } from './adaptive.service';
import { PrismaService } from 'prisma/prisma.service';

@Module({
  controllers: [AdaptiveController],
  providers: [AdaptiveService, PrismaService],
  exports: [AdaptiveService],
})
export class AdaptiveModule {}