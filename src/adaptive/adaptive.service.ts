import { Injectable } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';

interface BKTParameters {
  pLearn: number;    // Probability of learning
  pForget: number;   // Probability of forgetting
  pGuess: number;    // Probability of guessing correctly
  pSlip: number;     // Probability of making a mistake when knowing
}

interface PerformanceData {
  topicId: number;
  correct: number;
  total: number;
  difficulty: string;
}

export interface UserSkillWithTopic {
  id: number;
  userId: string;
  topicId: number;
  level: number;
  mastery: number;
  attempts: number;
  correct: number;
  updatedAt: Date;
  createdAt: Date;
  topic: {
    id: number;
    title: string;
    lessonId: number;
    tags: string[];
    createdAt: Date;
    updatedAt: Date;
    contentText: string;
    displayContent: any;
    lesson: {
      id: number;
      title: string;
      createdAt: Date;
      updatedAt: Date;
    };
  };
}

@Injectable()
export class AdaptiveService {
  constructor(private prisma: PrismaService) {}

  // BKT Parameters for different difficulty levels
  private bktParams: Record<string, BKTParameters> = {
    easy: { pLearn: 0.3, pForget: 0.05, pGuess: 0.3, pSlip: 0.1 },
    medium: { pLearn: 0.2, pForget: 0.1, pGuess: 0.2, pSlip: 0.15 },
    hard: { pLearn: 0.1, pForget: 0.15, pGuess: 0.1, pSlip: 0.2 }
  };

  /**
   * Initialize user skills for all topics if they don't exist
   */
  async initializeUserSkills(userId: string) {
    const topics = await this.prisma.topic.findMany();
    const existingSkills = await this.prisma.userSkill.findMany({
      where: { userId }
    });

    const existingTopicIds = existingSkills.map(skill => skill.topicId);
    const missingTopics = topics.filter(topic => !existingTopicIds.includes(topic.id));

    if (missingTopics.length > 0) {
      await this.prisma.userSkill.createMany({
        data: missingTopics.map(topic => ({
          userId,
          topicId: topic.id,
          level: 0.0,        // Start lower - user hasn't learned anything yet
          mastery: 0.0,      // Start lower - user hasn't demonstrated mastery
          attempts: 0,
          correct: 0,
          updatedAt: new Date(),
        })),
        skipDuplicates: true
      });
    }
  }

  /**
   * Update user skills using Bayesian Knowledge Tracing (BKT)
   */
  async updateUserSkills(userId: string, performanceData: PerformanceData[]) {
    await this.initializeUserSkills(userId);

    for (const performance of performanceData) {
      const userSkill = await this.prisma.userSkill.findUnique({
        where: {
          userId_topicId: {
            userId,
            topicId: performance.topicId
          }
        }
      });

      if (!userSkill) continue;

      const params = this.bktParams[performance.difficulty] || this.bktParams.medium;
      const correctRate = performance.total > 0 ? performance.correct / performance.total : 0;

      // More aggressive BKT updates
      const priorKnowledge = userSkill.mastery;
      
      // Simplified BKT - more responsive to performance
      let newMastery = priorKnowledge;
      let newLevel = userSkill.level;

      if (performance.total > 0) {
        // Update based on performance
        const performanceWeight = 0.3; // How much current performance affects mastery
        newMastery = priorKnowledge * (1 - performanceWeight) + correctRate * performanceWeight;
        
        // Update level more aggressively
        if (correctRate >= 0.8) {
          newLevel = Math.min(1.0, userSkill.level + params.pLearn * 2);
        } else if (correctRate >= 0.6) {
          newLevel = Math.min(1.0, userSkill.level + params.pLearn);
        } else if (correctRate < 0.4) {
          newLevel = Math.max(0.0, userSkill.level - params.pForget);
        }
      }

      // Update the user skill
      await this.prisma.userSkill.update({
        where: {
          userId_topicId: {
            userId,
            topicId: performance.topicId
          }
        },
        data: {
          level: Math.max(0.0, Math.min(1.0, newLevel)),
          mastery: Math.max(0.0, Math.min(1.0, newMastery)),
          attempts: userSkill.attempts + performance.total,
          correct: userSkill.correct + performance.correct,
        }
      });
    }
  }

  /**
 * Get user's current skill levels
 */
  async getUserSkills(userId: string): Promise<UserSkillWithTopic[]> {
    await this.initializeUserSkills(userId);
    
    return this.prisma.userSkill.findMany({
      where: { userId },
      include: { 
        topic: {
          include: {
            lesson: true
          }
        }
      }
    }) as Promise<UserSkillWithTopic[]>;
  }

  /**
   * Determine adaptive difficulty and focus areas for next assessment
   */
  async getAdaptiveRecommendations(userId: string) {
    const userSkills = await this.getUserSkills(userId);
    
    // Find weakest skills (lowest mastery)
    const weakestSkills = userSkills
      .sort((a, b) => a.mastery - b.mastery)
      .slice(0, 3);

    // Find skills that need reinforcement (level < 0.6)
    const needsReinforcement = userSkills.filter(skill => skill.level < 0.6);

    // Determine overall knowledge level
    const avgMastery = userSkills.reduce((sum, skill) => sum + skill.mastery, 0) / userSkills.length;
    
    let recommendedDifficulty: string;
    if (avgMastery < 0.4) {
      recommendedDifficulty = 'easy';
    } else if (avgMastery < 0.7) {
      recommendedDifficulty = 'medium';
    } else {
      recommendedDifficulty = 'hard';
    }

    return {
      overallMastery: avgMastery,
      recommendedDifficulty,
      focusTopics: weakestSkills.map(skill => ({
        topicId: skill.topicId,
        topicTitle: skill.topic.title,
        lessonId: skill.topic.lessonId,
        mastery: skill.mastery,
        level: skill.level
      })),
      reinforcementNeeded: needsReinforcement.map(skill => ({
        topicId: skill.topicId,
        topicTitle: skill.topic.title,
        level: skill.level
      }))
    };
  }

 
  /**
   * Generate adaptive feedback based on performance
   */
  async generateAdaptiveFeedback(userId: string, performanceData: PerformanceData[]) {
    const recommendations = await this.getAdaptiveRecommendations(userId);
    
    let feedback = '';
    
    if (recommendations.overallMastery < 0.4) {
      feedback = 'Focus on fundamental concepts. ';
    } else if (recommendations.overallMastery < 0.7) {
      feedback = 'Good progress! Continue practicing to strengthen your understanding. ';
    } else {
      feedback = 'Excellent mastery! Ready for advanced challenges. ';
    }

    if (recommendations.focusTopics.length > 0) {
      const weakAreas = recommendations.focusTopics.map(topic => topic.topicTitle).join(', ');
      feedback += `Focus on: ${weakAreas}. `;
    }

    if (recommendations.reinforcementNeeded.length > 0) {
      feedback += 'Some areas need reinforcement through additional practice.';
    }

    return feedback;
  }
}