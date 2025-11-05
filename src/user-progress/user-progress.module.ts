import { Module } from '@nestjs/common';
import { UserProgressController } from './user-progress.controller';
import { UserProgressService } from './user-progress.service';
import { PrismaModule } from 'prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [UserProgressController],
  providers: [UserProgressService],
  exports: [UserProgressService]
})
export class UserProgressModule {}
