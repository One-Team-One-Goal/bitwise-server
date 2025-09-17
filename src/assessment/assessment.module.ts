import { Module } from '@nestjs/common';
import { AssessmentService } from './assessment.service';
import { AssessmentController } from './assessment.controller';
import { LessonsModule } from 'src/lessons/lessons.module';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [LessonsModule, AuthModule],
  controllers: [AssessmentController],
  providers: [AssessmentService],
})
export class AssessmentModule {}
