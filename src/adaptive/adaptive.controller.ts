import { Controller, Get, Param } from '@nestjs/common';
import { AdaptiveService, UserSkillWithTopic } from './adaptive.service';

@Controller('adaptive')
export class AdaptiveController {
  constructor(private adaptiveService: AdaptiveService) {}

  /**
   * Get user's skill levels across all topics
   * GET /api/adaptive/skills/:userId
   */
  @Get('skills/:userId')
  async getUserSkills(@Param('userId') userId: string) {
    try {
      const skills = await this.adaptiveService.getUserSkills(userId);
      return {
        success: true,
        data: skills
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get adaptive recommendations for the user
   * GET /api/adaptive/recommendations/:userId
   */
  @Get('recommendations/:userId')
  async getRecommendations(@Param('userId') userId: string) {
    try {
      const recommendations = await this.adaptiveService.getAdaptiveRecommendations(userId);
      return {
        success: true,
        data: recommendations
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get user's learning analytics dashboard data
   * GET /api/adaptive/analytics/:userId
   */
  @Get('analytics/:userId')
  async getUserAnalytics(@Param('userId') userId: string) {
    try {
      const [skills, recommendations] = await Promise.all([
        this.adaptiveService.getUserSkills(userId),
        this.adaptiveService.getAdaptiveRecommendations(userId)
      ]);

      // Organize skills by lesson for better display
      const skillsByLesson = skills.reduce((acc, skill) => {
        const lessonId = skill.topic.lessonId;
        if (!acc[lessonId]) {
          acc[lessonId] = {
            lessonId,
            lessonTitle: skill.topic.lesson.title,
            skills: []
          };
        }
        acc[lessonId].skills.push({
          topicId: skill.topicId,
          topicTitle: skill.topic.title,
          mastery: skill.mastery,
          level: skill.level,
          attempts: skill.attempts,
          correct: skill.correct,
          accuracy: skill.attempts > 0 ? (skill.correct / skill.attempts) * 100 : 0
        });
        return acc;
      }, {});

      return {
        success: true,
        data: {
          overallMastery: recommendations.overallMastery,
          recommendedDifficulty: recommendations.recommendedDifficulty,
          skillsByLesson: Object.values(skillsByLesson),
          focusAreas: recommendations.focusTopics,
          reinforcementNeeded: recommendations.reinforcementNeeded,
          totalAttempts: skills.reduce((sum, skill) => sum + skill.attempts, 0),
          totalCorrect: skills.reduce((sum, skill) => sum + skill.correct, 0)
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get progress comparison data for charts
   * GET /api/adaptive/progress/:userId
   */
  @Get('progress/:userId')
  async getUserProgress(@Param('userId') userId: string) {
    try {
      const skills = await this.adaptiveService.getUserSkills(userId);
      
      // Create progress data for visualization
      const progressData = skills.map(skill => ({
        topicTitle: skill.topic.title,
        lessonTitle: skill.topic.lesson.title,
        mastery: Math.round(skill.mastery * 100),
        level: Math.round(skill.level * 100),
        attempts: skill.attempts,
        accuracy: skill.attempts > 0 ? Math.round((skill.correct / skill.attempts) * 100) : 0
      }));

      // Group by lesson for better chart organization
      const lessonProgress = progressData.reduce((acc, item) => {
        if (!acc[item.lessonTitle]) {
          acc[item.lessonTitle] = [];
        }
        acc[item.lessonTitle].push(item);
        return acc;
      }, {});

      return {
        success: true,
        data: {
          individual: progressData,
          byLesson: lessonProgress,
          summary: {
            avgMastery: Math.round(progressData.reduce((sum, item) => sum + item.mastery, 0) / progressData.length),
            avgLevel: Math.round(progressData.reduce((sum, item) => sum + item.level, 0) / progressData.length),
            totalAttempts: progressData.reduce((sum, item) => sum + item.attempts, 0),
            avgAccuracy: Math.round(progressData.reduce((sum, item) => sum + item.accuracy, 0) / progressData.length)
          }
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}