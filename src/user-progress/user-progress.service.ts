import { Injectable } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class UserProgressService {
  constructor(private prisma: PrismaService) {}

  /**
   * Mark a topic as viewed (called when user opens topic page)
   */
  async markTopicViewed(userId: string, topicId: number) {
    // Check if user topic record exists
    const existingUserTopic = await this.prisma.userTopic.findUnique({
      where: { userId_topicId: { userId, topicId } }
    });

    const updatePayload: Record<string, any> = {
      lastViewedAt: new Date()
    };

    if (existingUserTopic?.status !== 'completed') {
      updatePayload.status = 'viewed';
    }

    const userTopic = await this.prisma.userTopic.upsert({
      where: { userId_topicId: { userId, topicId } },
      update: updatePayload,
      create: {
        userId,
        topicId,
        status: 'viewed',
        firstViewedAt: new Date()
      }
    });

    // Update lesson progress
    await this.updateLessonProgress(userId, topicId);
    
    return userTopic;
  }

  /**
   * Mark a topic as completed (called when user clicks "I understand" button)
   */
  async markTopicCompleted(userId: string, topicId: number) {
    const userTopic = await this.prisma.userTopic.upsert({
      where: { userId_topicId: { userId, topicId } },
      update: {
        status: 'completed',
        completedAt: new Date(),
        lastViewedAt: new Date()
      },
      create: {
        userId,
        topicId,
        status: 'completed',
        firstViewedAt: new Date(),
        completedAt: new Date()
      }
    });

    await this.updateLessonProgress(userId, topicId);
    
    return userTopic;
  }

  /**
   * Update lesson progress based on topics viewed/completed
   */
  private async updateLessonProgress(userId: string, topicId: number) {
    const topic = await this.prisma.topic.findUnique({
      where: { id: topicId },
      select: { lessonId: true }
    });
    
    if (!topic) return;

    // Get all topics in this lesson
    const allTopics = await this.prisma.topic.findMany({
      where: { lessonId: topic.lessonId },
      select: { id: true }
    });

    // Get user's progress on these topics
    const userTopics = await this.prisma.userTopic.findMany({
      where: {
        userId,
        topicId: { in: allTopics.map(t => t.id) }
      }
    });

    // Calculate progress percentage
    const totalTopics = allTopics.length;
    const completedCount = userTopics.filter(ut => ut.status === 'completed').length;

    const viewedCount = userTopics.filter(ut => ut.status !== 'not-started').length;
    const progress = totalTopics > 0 ? completedCount / totalTopics : 0;

    // Determine lesson status
    let status = 'not-started';
    if (completedCount === allTopics.length && totalTopics > 0) {
      status = 'completed';
    } else if (viewedCount > 0) {
      status = 'in-progress';
    }

    // Get existing lesson record to preserve masteryScore
    const existingLesson = await this.prisma.userLesson.findUnique({
      where: { userId_lessonId: { userId, lessonId: topic.lessonId } }
    });

    // Update or create UserLesson
    await this.prisma.userLesson.upsert({
      where: { userId_lessonId: { userId, lessonId: topic.lessonId } },
      update: {
        progress,
        status,
        lastViewedAt: new Date(),
        completedAt: status === 'completed' ? new Date() : null
      },
      create: {
        userId,
        lessonId: topic.lessonId,
        progress,
        status,
        startedAt: new Date(),
        masteryScore: existingLesson?.masteryScore || null
      }
    });
  }

  /**
   * Get user's lesson progress
   */
  async getUserLessonProgress(userId: string, lessonId: number) {
    return await this.prisma.userLesson.findUnique({
      where: { userId_lessonId: { userId, lessonId } },
      include: {
        lesson: {
          include: {
            topics: {
              include: {
                userTopics: {
                  where: { userId }
                }
              }
            }
          }
        }
      }
    });
  }

  /**
   * Get all lesson progress for user
   */
  async getAllUserProgress(userId: string) {
    return await this.prisma.userLesson.findMany({
      where: { userId },
      include: {
        lesson: true
      },
      orderBy: { lessonId: 'asc' }
    });
  }

  /**
   * Get user's topic progress for a specific lesson
   */
  async getUserTopicsForLesson(userId: string, lessonId: number) {
    const topics = await this.prisma.topic.findMany({
      where: { lessonId },
      include: {
        userTopics: {
          where: { userId }
        }
      }
    });

    return topics.map(topic => ({
      ...topic,
      userProgress: topic.userTopics[0] || {
        status: 'not-started',
        viewCount: 0,
        completedAt: null
      }
    }));
  }

  /**
   * Get overall user statistics
   */
  async getUserStatistics(userId: string) {
    const [userLessons, userTopics] = await Promise.all([
      this.prisma.userLesson.findMany({ where: { userId } }),
      this.prisma.userTopic.findMany({ where: { userId } })
    ]);

    const totalLessons = await this.prisma.lesson.count();
    const totalTopics = await this.prisma.topic.count();

    return {
      lessonsStarted: userLessons.filter(l => l.status !== 'not-started').length,
      lessonsCompleted: userLessons.filter(l => l.status === 'completed').length,
      totalLessons,
      topicsViewed: userTopics.filter(t => t.status !== 'not-started').length,
      topicsCompleted: userTopics.filter(t => t.status === 'completed').length,
      totalTopics,
      averageProgress: userLessons.length > 0
        ? userLessons.reduce((sum, l) => sum + l.progress, 0) / userLessons.length
        : 0
    };
  }
}
