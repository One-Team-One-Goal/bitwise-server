import { Controller, Post, Get, Param, UseGuards } from '@nestjs/common';
import { UserProgressService } from './user-progress.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('progress')
@UseGuards(JwtAuthGuard)
export class UserProgressController {
  constructor(private readonly userProgressService: UserProgressService) {}

  @Post('topic/:topicId/viewed')
  async markTopicViewed(
    @CurrentUser('id') userId: string,
    @Param('topicId') topicId: string
  ) {
    return this.userProgressService.markTopicViewed(userId, parseInt(topicId));
  }

  @Post('topic/:topicId/completed')
  async markTopicCompleted(
    @CurrentUser('id') userId: string,
    @Param('topicId') topicId: string
  ) {
    return this.userProgressService.markTopicCompleted(userId, parseInt(topicId));
  }

  @Get('lesson/:lessonId')
  async getLessonProgress(
    @CurrentUser('id') userId: string,
    @Param('lessonId') lessonId: string
  ) {
    return this.userProgressService.getUserLessonProgress(userId, parseInt(lessonId));
  }

  @Get('all')
  async getAllProgress(@CurrentUser('id') userId: string) {
    return this.userProgressService.getAllUserProgress(userId);
  }

  @Get('topics/lesson/:lessonId')
  async getTopicsForLesson(
    @CurrentUser('id') userId: string,
    @Param('lessonId') lessonId: string
  ) {
    return this.userProgressService.getUserTopicsForLesson(userId, parseInt(lessonId));
  }

  @Get('statistics')
  async getStatistics(@CurrentUser('id') userId: string) {
    return this.userProgressService.getUserStatistics(userId);
  }
}
