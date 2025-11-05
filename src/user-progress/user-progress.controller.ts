import { Controller, Post, Get, Param, UseGuards } from '@nestjs/common';
import { UserProgressService } from './user-progress.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';

@Controller('progress')
@UseGuards(JwtAuthGuard)
export class UserProgressController {
  constructor(private readonly userProgressService: UserProgressService) {}

  @Post('topic/:topicId/viewed')
  async markTopicViewed(
    @GetUser('id') userId: string,
    @Param('topicId') topicId: string
  ) {
    return this.userProgressService.markTopicViewed(userId, parseInt(topicId));
  }

  @Post('topic/:topicId/completed')
  async markTopicCompleted(
    @GetUser('id') userId: string,
    @Param('topicId') topicId: string
  ) {
    return this.userProgressService.markTopicCompleted(userId, parseInt(topicId));
  }

  @Get('lesson/:lessonId')
  async getLessonProgress(
    @GetUser('id') userId: string,
    @Param('lessonId') lessonId: string
  ) {
    return this.userProgressService.getUserLessonProgress(userId, parseInt(lessonId));
  }

  @Get('all')
  async getAllProgress(@GetUser('id') userId: string) {
    return this.userProgressService.getAllUserProgress(userId);
  }

  @Get('topics/lesson/:lessonId')
  async getTopicsForLesson(
    @GetUser('id') userId: string,
    @Param('lessonId') lessonId: string
  ) {
    return this.userProgressService.getUserTopicsForLesson(userId, parseInt(lessonId));
  }

  @Get('statistics')
  async getStatistics(@GetUser('id') userId: string) {
    return this.userProgressService.getUserStatistics(userId);
  }
}
