import { Controller, Post, Get, Body, Param, ParseIntPipe } from '@nestjs/common';
import { AssessmentService } from './assessment.service';
import { AdaptiveService } from '../adaptive/adaptive.service';

@Controller('assessment')
export class AssessmentController {
  constructor(
    private assessmentService: AssessmentService,
    private adaptiveService: AdaptiveService
  ) {}

  /**
   * Start an adaptive practice assessment
   * POST /api/assessment/start-adaptive-practice
   */
  @Post('start-adaptive-practice')
  async startAdaptivePractice(@Body() body: { uid: string }) {
    try {
      const result = await this.assessmentService.startAdaptivePracticeAttempt(body.uid);
      
      // Double-check that questions is an array before returning
      if (!result.questions || !Array.isArray(result.questions)) {
        console.error('Result questions is not an array:', result.questions);
        return {
          success: false,
          error: 'Failed to generate valid assessment questions. Please try again.'
        };
      }
      
      return {
        success: true,
        data: result
      };
    } catch (error) {
      console.error('Error in startAdaptivePractice controller:', error);
      return {
        success: false,
        error: error.message || 'Failed to start adaptive assessment. Please try again.'
      };
    }
  }

  /**
   * Submit an adaptive practice assessment
   * POST /api/assessment/submit-adaptive-practice
   */
  @Post('submit-adaptive-practice')
  async submitAdaptivePractice(@Body() body: { attemptId: number; responses: any }) {
    try {
      const result = await this.assessmentService.saveAdaptivePracticeAttempt(
        body.attemptId, 
        body.responses
      );
      return {
        success: true,
        data: result
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get a specific attempt by ID
   * GET /api/assessment/attempt/:attemptId
   */
  @Get('attempt/:attemptId')
  async getAttempt(@Param('attemptId', ParseIntPipe) attemptId: number) {
    try {
      const attempt = await this.assessmentService.getAttemptById(attemptId);
      if (!attempt) {
        return {
          success: false,
          error: 'Attempt not found'
        };
      }
      return {
        success: true,
        data: attempt
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get user's assessment history
   * GET /api/assessment/history/:userId
   */
  @Get('history/:userId')
  async getUserHistory(@Param('userId') userId: string) {
    try {
      const attempts = await this.assessmentService.getUserAttempts(userId);
      return {
        success: true,
        data: attempts
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get user statistics and analytics
   * GET /api/assessment/statistics/:userId
   */
  @Get('statistics/:userId')
  async getUserStatistics(@Param('userId') userId: string) {
    try {
      const statistics = await this.assessmentService.getUserStatistics(userId);
      return {
        success: true,
        data: statistics
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}