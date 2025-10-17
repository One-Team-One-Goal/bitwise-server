import { Module } from '@nestjs/common';
import { AssessmentController } from './assessment.controller';
import { AssessmentService } from './assessment.service';
import { AdaptiveModule } from '../adaptive/adaptive.module';
import { PrismaService } from 'prisma/prisma.service';

@Module({
  imports: [AdaptiveModule],
  controllers: [AssessmentController],
  providers: [AssessmentService, PrismaService],
  exports: [AssessmentService]
})
export class AssessmentModule {}