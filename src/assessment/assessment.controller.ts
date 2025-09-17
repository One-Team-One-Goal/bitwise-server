import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { ApiTags, ApiBody } from '@nestjs/swagger';
import { AssessmentService } from './assessment.service';

@ApiTags('assessment')
@Controller('assessment')
export class AssessmentController {
  constructor(private readonly assessmentService: AssessmentService) {}

  @Post('generate-practice')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        uid: { type: 'number', example: 1 }
      },
      required: ['uid']
    }
  })
  async generatePracticeAssessment() {
    return await this.assessmentService.generatePracticeAssessment();
  }

  @Post('start-practice')
@ApiBody({
  schema: {
    type: 'object',
    properties: {
      uid: { type: 'number', example: 1 }
    },
    required: ['uid']
  }
})
async startPractice(@Body('uid') uid: string) {
  return await this.assessmentService.startPracticeAttempt(uid);
}

@Post('submit-practice')
@ApiBody({
  schema: {
    type: 'object',
    properties: {
      attemptId: { type: 'number', example: 1 },
      responses: { type: 'object', example: { "0": "opt_a", "1": "opt_b" } }
    },
    required: ['attemptId', 'responses']
  }
})
async submitPractice(@Body() body: { attemptId: number, responses: any }) {
  return await this.assessmentService.savePracticeAttempt(body.attemptId, body.responses);
}

  @Get('attempts/:userId')
  async getUserAttempts(@Param('userId') userId: string) {
    return await this.assessmentService.getUserAttempts(userId);
  }

  @Get('attempt/:attemptId')
  async getAttempt(@Param('attemptId') attemptId: string) {
    return await this.assessmentService.getAttemptById(Number(attemptId));
  }
}