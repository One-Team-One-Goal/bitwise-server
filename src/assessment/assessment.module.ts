import { Module } from '@nestjs/common';
import { AssessmentService } from './assessment.service';
import { AssessmentController } from './assessment.controller';
import { LessonsModule } from 'src/lessons/lessons.module';

@Module({
  imports: [LessonsModule],
  controllers: [AssessmentController],
  providers: [AssessmentService],
})
export class AssessmentModule {}
