import { Injectable } from '@nestjs/common';
import { groq } from '@ai-sdk/groq';
import { generateText } from 'ai';
import { PrismaService } from 'prisma/prisma.service';
import { AdaptiveService } from '../adaptive/adaptive.service';
import { buildAdaptiveQuizPrompt } from './prompts/adaptive-quiz-generation';
import { AI_CONFIG } from '../config/ai.config';

@Injectable()
export class AssessmentService {
  constructor(
    private prisma: PrismaService,
    private adaptiveService: AdaptiveService
  ) {}

  // Only allow these tags
  private allowedTags = [
    "intro",
    "boolean-values",
    "applications",
    "and-gate",
    "or-gate",
    "not-gate",
    "nand-gate",
    "nor-gate",
    "xor-gate",
    "xnor-gate",
    "truth-table-construction",
    "truth-table-reading",
    "truth-table-for-gates",
    "identity-law",
    "null-law",
    "idempotent-law",
    "inverse-law",
    "commutative-law",
    "absorption-law",
    "distributive-law",
    "simplification",
    "karnaugh-maps"
  ];

  async extractJsonArray(text: string): Promise<any> {
    // 1. Extract JSON content from Markdown code blocks or find array brackets
    const jsonArrayMatch = text.match(/```json\s*([\s\S]*?)```/i) || text.match(/(\[\s*{[\s\S]*}\s*\])/);
    let jsonString = '';

    if (jsonArrayMatch) {
      jsonString = jsonArrayMatch[1] || jsonArrayMatch[0];
    } else {
      const arrayStart = text.indexOf('[');
      const arrayEnd = text.lastIndexOf(']');
      if (arrayStart !== -1 && arrayEnd !== -1) {
        jsonString = text.substring(arrayStart, arrayEnd + 1);
      }
    }

    if (!jsonString) {
      console.error('No JSON array found in AI response:', text.substring(0, 500));
      throw new Error('AI response did not contain a valid JSON array');
    }

    // 2. Clean the JSON string to handle common LLM errors
    // Remove single-line comments (// ...)
    jsonString = jsonString.replace(/\/\/.*$/gm, '');
    // Remove multi-line comments (/* ... */)
    jsonString = jsonString.replace(/\/\*[\s\S]*?\*\//g, '');
    // Remove trailing commas before closing brackets/braces
    jsonString = jsonString.replace(/,(\s*[\]}])/g, '$1');
    // Fix unquoted keys (simple cases like key: "value")
    jsonString = jsonString.replace(/([{,]\s*)([a-zA-Z0-9_]+)(\s*:)/g, '$1"$2"$3');

    try {
      const parsed = JSON.parse(jsonString);
      
      // Ensure the parsed result is an array
      if (!Array.isArray(parsed)) {
        console.error('Parsed JSON is not an array:', typeof parsed);
        throw new Error('AI response parsed to non-array format');
      }
      
      return parsed;
    } catch (err) {
      console.error('JSON parse error:', err.message, '\nJSON string snippet:', jsonString.substring(0, 500));
      throw new Error(`Failed to parse AI response as JSON: ${err.message}`);
    }
  }

  private generateAttemptFeedback(questions: any[], responses: any): {
    attemptFeedback: string;
    weakestTags: string[];
    strongestTags: string[];
    topicBreakdown: any[];
    recommendations: string[];
  } {
    // Analyze performance by tags
    const tagPerformance: Record<string, { correct: number; total: number }> = {};
    const topicPerformance: Record<number, { correct: number; total: number; title: string }> = {};
    
    questions.forEach((q, idx) => {
      const answer = responses[q.id ?? idx];
      const isCorrect = q.options.find((o: any) => o.id === answer && o.isCorrect);
      
      // Track by tags
      if (q.tags && Array.isArray(q.tags)) {
        q.tags.forEach((tag: string) => {
          if (!tagPerformance[tag]) {
            tagPerformance[tag] = { correct: 0, total: 0 };
          }
          tagPerformance[tag].total += 1;
          if (isCorrect) {
            tagPerformance[tag].correct += 1;
          }
        });
      }
      
      // Track by topic
      if (!topicPerformance[q.topicId]) {
        topicPerformance[q.topicId] = { 
          correct: 0, 
          total: 0, 
          title: `Topic ${q.topicId}` // You might want to get actual topic title
        };
      }
      topicPerformance[q.topicId].total += 1;
      if (isCorrect) {
        topicPerformance[q.topicId].correct += 1;
      }
    });

    // Calculate percentages and find weak/strong areas
    const tagResults = Object.entries(tagPerformance).map(([tag, perf]) => ({
      tag,
      percentage: perf.total > 0 ? (perf.correct / perf.total) * 100 : 0,
      correct: perf.correct,
      total: perf.total
    }));

    const weakestTags = tagResults
      .filter(t => t.total >= 2) // Only consider tags with at least 2 questions
      .sort((a, b) => a.percentage - b.percentage)
      .slice(0, 3)
      .map(t => t.tag);

    const strongestTags = tagResults
      .filter(t => t.total >= 2 && t.percentage >= 80)
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, 3)
      .map(t => t.tag);

    const topicBreakdown = Object.entries(topicPerformance).map(([topicId, perf]) => ({
      topicId: parseInt(topicId),
      title: perf.title,
      correct: perf.correct,
      total: perf.total,
      percentage: perf.total > 0 ? Math.round((perf.correct / perf.total) * 100) : 0
    }));

    // Generate contextual feedback
    let attemptFeedback = '';
    const totalQuestions = questions.length;
    const totalCorrect = Object.values(topicPerformance).reduce((sum, perf) => sum + perf.correct, 0);
    const overallPercentage = Math.round((totalCorrect / totalQuestions) * 100);

    // Overall performance feedback
    if (overallPercentage >= 90) {
      attemptFeedback = `Outstanding performance! You scored ${overallPercentage}% on this assessment. `;
    } else if (overallPercentage >= 80) {
      attemptFeedback = `Great job! You scored ${overallPercentage}% on this assessment. `;
    } else if (overallPercentage >= 70) {
      attemptFeedback = `Good work! You scored ${overallPercentage}% on this assessment. `;
    } else if (overallPercentage >= 60) {
      attemptFeedback = `You scored ${overallPercentage}% on this assessment. There's room for improvement. `;
    } else {
      attemptFeedback = `You scored ${overallPercentage}% on this assessment. Let's focus on strengthening your understanding. `;
    }

    // Specific area feedback
    const recommendations: string[] = [];
    
    if (weakestTags.length > 0) {
      const weakAreas = this.formatTagsForFeedback(weakestTags);
      attemptFeedback += `Your weakest areas in this assessment were: ${weakAreas}. `;
      
      // Add specific recommendations based on weak tags
      weakestTags.forEach(tag => {
        const recommendation = this.getTagRecommendation(tag);
        if (recommendation) {
          recommendations.push(recommendation);
        }
      });
    }

    if (strongestTags.length > 0) {
      const strongAreas = this.formatTagsForFeedback(strongestTags);
      attemptFeedback += `You performed excellently in: ${strongAreas}. `;
    }

    // Add study recommendations
    if (recommendations.length === 0 && overallPercentage < 80) {
      recommendations.push("Review the fundamental concepts before attempting another assessment.");
      recommendations.push("Practice more problems in your weak areas.");
    }

    return {
      attemptFeedback,
      weakestTags,
      strongestTags,
      topicBreakdown,
      recommendations
    };
  }

/**
 * Format tags for user-friendly display
 */
private formatTagsForFeedback(tags: string[]): string {
  const tagLabels: Record<string, string> = {
    'karnaugh-maps': 'Karnaugh Maps',
    'truth-table-construction': 'Truth Table Construction',
    'truth-table-reading': 'Truth Table Reading',
    'boolean-values': 'Boolean Values',
    'and-gate': 'AND Gates',
    'or-gate': 'OR Gates',
    'not-gate': 'NOT Gates',
    'nand-gate': 'NAND Gates',
    'nor-gate': 'NOR Gates',
    'xor-gate': 'XOR Gates',
    'xnor-gate': 'XNOR Gates',
    'simplification': 'Boolean Simplification',
    'distributive-law': 'Distributive Law',
    'applications': 'Real-world Applications',
    // Add more tag mappings as needed
  };

  return tags
    .map(tag => tagLabels[tag] || tag.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()))
    .join(', ');
}

/**
 * Get specific recommendations based on weak tags
 */
private getTagRecommendation(tag: string): string | null {
  const recommendations: Record<string, string> = {
    'karnaugh-maps': 'Practice more Karnaugh map simplification problems and review grouping techniques.',
    'truth-table-construction': 'Focus on building truth tables step by step for different logic gates.',
    'truth-table-reading': 'Practice interpreting truth tables and understanding input-output relationships.',
    'simplification': 'Review Boolean algebra laws and practice simplifying complex expressions.',
    'and-gate': 'Review AND gate behavior: output is 1 only when ALL inputs are 1.',
    'or-gate': 'Review OR gate behavior: output is 1 when ANY input is 1.',
    'not-gate': 'Review NOT gate behavior: output is the inverse of the input.',
    'nand-gate': 'Remember NAND is NOT-AND: output is 0 only when ALL inputs are 1.',
    'nor-gate': 'Remember NOR is NOT-OR: output is 1 only when ALL inputs are 0.',
    'xor-gate': 'Practice XOR logic: output is 1 when inputs are different.',
    'distributive-law': 'Review distributive law: A(B+C) = AB+AC and A+BC = (A+B)(A+C).',
    // Add more recommendations
  };

  return recommendations[tag] || null;
}



    /**
   * Generate adaptive practice assessment based on user's skill level
   */
  async generateAdaptivePracticeAssessment(userId: string) {
    // Get adaptive recommendations
    const recommendations = await this.adaptiveService.getAdaptiveRecommendations(userId);
    
    // Get all lessons and their topics
    const lessons = await this.prisma.lesson.findMany({
      include: { topics: true }
    });

    if (!lessons || lessons.length < 4) throw new Error('Not enough lessons found');

    const focusTopicIds = recommendations.focusTopics.map(t => t.topicId);
    const focusLessonIds = recommendations.focusTopics.map(t => t.lessonId);
    
    let lesson1Topics = lessons.find(l => l.id === 1)?.topics ?? [];
    let lesson2Topics = lessons.find(l => l.id === 2)?.topics ?? [];
    let lesson3Topics = lessons.find(l => l.id === 3)?.topics ?? [];
    let lesson4Topics = lessons.find(l => l.id === 4)?.topics ?? [];

    const distribution = { lesson1: 3, lesson2: 3, lesson3: 3, lesson4: 3 };
    let remainingQuestions = 8;

    if (focusLessonIds.length > 0) {
      const lessonCounts = focusLessonIds.reduce((acc, id) => {
        acc[id] = (acc[id] || 0) + 1;
        return acc;
      }, {} as Record<number, number>);

      const totalFocusCount = focusLessonIds.length;

      Object.entries(lessonCounts).forEach(([lessonId, count]) => {
        const share = Math.round((count / totalFocusCount) * remainingQuestions);
        if (lessonId === '1') distribution.lesson1 += share;
        if (lessonId === '2') distribution.lesson2 += share;
        if (lessonId === '3') distribution.lesson3 += share;
        if (lessonId === '4') distribution.lesson4 += share;
      });

      const currentSum = Object.values(distribution).reduce((a, b) => a + b, 0);
      const diff = 20 - currentSum;
      
      if (diff !== 0) {
        const maxFocusLesson = Object.keys(lessonCounts).reduce((a, b) => lessonCounts[a] > lessonCounts[b] ? a : b, '4');
        if (maxFocusLesson === '1') distribution.lesson1 += diff;
        else if (maxFocusLesson === '2') distribution.lesson2 += diff;
        else if (maxFocusLesson === '3') distribution.lesson3 += diff;
        else distribution.lesson4 += diff;
      }
    } else {
      distribution.lesson1 += 2;
      distribution.lesson2 += 2;
      distribution.lesson3 += 2;
      distribution.lesson4 += 2;
    }

    const getTopicsForContext = (topics: any[], count: number) => {
      const sorted = [...topics].sort((a, b) => {
        const aIsFocus = focusTopicIds.includes(a.id);
        const bIsFocus = focusTopicIds.includes(b.id);
        return (aIsFocus === bIsFocus) ? 0 : aIsFocus ? -1 : 1;
      });
      return sorted.slice(0, Math.max(count, 3));
    };

    const topicSelections = [
      ...getTopicsForContext(lesson1Topics, distribution.lesson1),
      ...getTopicsForContext(lesson2Topics, distribution.lesson2),
      ...getTopicsForContext(lesson3Topics, distribution.lesson3),
      ...getTopicsForContext(lesson4Topics, distribution.lesson4),
    ].filter(Boolean);

    const promptParts = topicSelections.map((topic, idx) => `
      Topic: ${topic.title} (Lesson ${topic.lessonId})
      Content: ${topic.contentText}
    `);

    const prompt = buildAdaptiveQuizPrompt({
      userMasteryPercent: parseFloat((recommendations.overallMastery * 100).toFixed(1)),
      recommendedDifficulty: recommendations.recommendedDifficulty,
      focusTopics: recommendations.focusTopics.map(t => t.topicTitle),
      topicContents: promptParts,
      questionDistribution: distribution
    });

    // Read model and sampling controls from AI_CONFIG
    const modelName = AI_CONFIG.modelName;
    const temp = AI_CONFIG.temperature;
    const topP = AI_CONFIG.topP;

    const requestQuestions = async () => {
      const { text } = await generateText({
        model: groq(modelName),
        prompt,
        temperature: temp,
        topP: topP,
      });
      return this.extractJsonArray(text);
    };

    let questions = await requestQuestions();

    // Ensure questions is always an array
    if (!Array.isArray(questions)) {
      console.error('AI generated non-array response:', questions);
      // Retry once with slightly lower temperature for consistency
      const retryTemp = Math.max(0.1, temp - 0.1);
      const { text: retryText } = await generateText({
        model: groq(modelName),
        prompt,
        temperature: retryTemp,
        topP: topP,
      });
      questions = await this.extractJsonArray(retryText);
      if (!Array.isArray(questions)) {
        throw new Error('Failed to generate valid questions array from AI response (after retry)');
      }
    }

    const filteredQuestions = (questions || []).map((q: any, index: number) => {
      const correctOptions = q.options?.filter((opt: any) => opt.isCorrect) || [];
      if (correctOptions.length !== 1) {
        console.warn(`Question ${index + 1} has ${correctOptions.length} correct answers, should have exactly 1`);
        q.options?.forEach((opt: any, idx: number) => {
          opt.isCorrect = idx === 0 && correctOptions.length === 0 ? true : 
                        opt.isCorrect && correctOptions.indexOf(opt) === 0;
        });
      }

      if (q.options?.length < 3) {
        console.warn(`Question ${index + 1} has only ${q.options?.length} options, minimum is 3`);
      }

      const correctOption = q.options?.find((opt: any) => opt.isCorrect);
      if (correctOption) {
        q.answerId = correctOption.id;
      }

      return {
        ...q,
        difficulty: recommendations.recommendedDifficulty,
        tags: (q.tags || []).filter((tag: string) => this.allowedTags.includes(tag)),
        // Ensure required fields
        questionType: q.questionType || 'multiple-choice',
        solutionSteps: q.solutionSteps || ['Analyze the problem', 'Apply relevant concepts', 'Verify the answer']
        // Removed sourcePassages - not needed and causes buggy display
      };
    });

    // Additional validation
    const validQuestions = filteredQuestions.filter((q: any) => {
      // Check for broken visuals (text implies visual but stem is string)
      if (typeof q.stem === 'string') {
        const lowerStem = q.stem.toLowerCase();
        if (lowerStem.includes('table below') || 
            lowerStem.includes('circuit below') || 
            lowerStem.includes('map below') ||
            lowerStem.includes('shown below') ||
            lowerStem.includes('following truth table') ||
            lowerStem.includes('following circuit')) {
           console.warn(`Question rejected: Text implies visual but stem is string: "${q.stem.substring(0, 50)}..."`);
           return false;
        }
      }

      return q.stem && 
            q.options && 
            q.options.length >= 3 && 
            q.options.length <= 4 &&
            q.options.filter((opt: any) => opt.isCorrect).length === 1;
    });

    if (validQuestions.length < 15) {
      console.warn(`Only ${validQuestions.length} valid questions generated, expected 20`);
    }

    return { 
      questions: validQuestions.slice(0, 20), // Ensure we don't exceed 20 questions
      adaptiveInfo: recommendations
    };
  }


  /**
   * Enhanced practice attempt with adaptive features
   */
  async startAdaptivePracticeAttempt(userId: string) {
    try {
      // Generate adaptive questions
      const quiz = await this.generateAdaptivePracticeAssessment(userId);

      // Ensure questions is an array before saving
      if (!Array.isArray(quiz.questions)) {
        console.error('Generated quiz questions is not an array:', quiz.questions);
        throw new Error('Invalid questions format generated');
      }

      // Ensure we have at least some questions
      if (quiz.questions.length === 0) {
        throw new Error('No valid questions were generated');
      }

      // Save attempt with questions and adaptive info
      const attempt = await this.prisma.attempt.create({
        data: {
          userId,
          questions: quiz.questions,
          performance: quiz.adaptiveInfo,
        },
      });

      return {
        attemptId: attempt.id,
        questions: quiz.questions,
        adaptiveInfo: quiz.adaptiveInfo,
      };
    } catch (error) {
      console.error('Error in startAdaptivePracticeAttempt:', error);
      throw new Error(`Failed to start adaptive practice: ${error.message}`);
    }
  }

  /**
   * Enhanced save with adaptive skill updates
   */
  async saveAdaptivePracticeAttempt(attemptId: number, responses: any) {
    const attempt = await this.prisma.attempt.findUnique({ where: { id: attemptId } });
    if (!attempt) throw new Error('Attempt not found');

    const questions = attempt.questions as any[];
    
    // Generate attempt-specific feedback
    const attemptAnalysis = this.generateAttemptFeedback(questions, responses);
    
    // Calculate performance by topic (existing code)
    const topicPerformance: Record<number, { correct: number; total: number; difficulty: string }> = {};
    
    questions.forEach((q, idx) => {
      const answer = responses[q.id ?? idx];
      const correct = q.options.find((o: any) => o.id === answer && o.isCorrect);
      
      if (!topicPerformance[q.topicId]) {
        topicPerformance[q.topicId] = { correct: 0, total: 0, difficulty: q.difficulty || 'medium' };
      }
      
      topicPerformance[q.topicId].total += 1;
      if (correct) {
        topicPerformance[q.topicId].correct += 1;
      }
    });

    // Convert to performance data format
    const performanceData = Object.entries(topicPerformance).map(([topicId, perf]) => ({
      topicId: parseInt(topicId),
      correct: perf.correct,
      total: perf.total,
      difficulty: perf.difficulty
    }));

    // Update user skills using adaptive service
    await this.adaptiveService.updateUserSkills(attempt.userId, performanceData);

    // Generate adaptive feedback (long-term progress)
    const adaptiveFeedback = await this.adaptiveService.generateAdaptiveFeedback(attempt.userId, performanceData);

    // Calculate total score
    const score = performanceData.reduce((sum, perf) => sum + perf.correct, 0);

    // Update lesson-level mastery for each lesson covered in assessment
    const lessonScores = new Map<number, { correct: number; total: number }>();
    
    questions.forEach((q, idx) => {
      const answer = responses[q.id ?? idx];
      const isCorrect = q.options.find((o: any) => o.id === answer && o.isCorrect);
      
      if (q.lessonId) {
        if (!lessonScores.has(q.lessonId)) {
          lessonScores.set(q.lessonId, { correct: 0, total: 0 });
        }
        const lessonData = lessonScores.get(q.lessonId)!;
        lessonData.total += 1;
        if (isCorrect) lessonData.correct += 1;
      }
    });

    // Update mastery for each lesson
    for (const [lessonId, data] of lessonScores.entries()) {
      const lessonScore = data.correct / data.total;
      await this.adaptiveService.updateLessonMasteryFromAssessment(
        attempt.userId,
        lessonId,
        lessonScore
      );
    }

    // Save responses, score, and BOTH feedbacks
    await this.prisma.attempt.update({
      where: { id: attemptId },
      data: {
        responses,
        score,
        feedback: adaptiveFeedback, // Long-term adaptive feedback
        performance: {
          ...topicPerformance,
          attemptAnalysis // Add attempt-specific analysis
        },
      },
    });

    return { 
      score, 
      feedback: adaptiveFeedback, // Long-term feedback
      attemptFeedback: attemptAnalysis.attemptFeedback, // Immediate attempt feedback
      weakestAreas: attemptAnalysis.weakestTags,
      strongestAreas: attemptAnalysis.strongestTags,
      recommendations: attemptAnalysis.recommendations,
      topicPerformance: performanceData,
      detailedBreakdown: attemptAnalysis.topicBreakdown
    };
  }

  /**
   * Get a user's attempts (history)
   */
  async getUserAttempts(userId: string) {
    return (this.prisma as any).attempt.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get attempt by ID
   */
  async getAttemptById(attemptId: number) {
    const attempt = await (this.prisma as any).attempt.findUnique({
      where: { id: attemptId },
    });
    
    if (!attempt) {
      return null;
    }
    
    // Ensure questions is always an array
    if (!Array.isArray(attempt.questions)) {
      console.warn(`Attempt ${attemptId} has non-array questions, converting to array`);
      attempt.questions = [];
    }
    
    return attempt;
  }

  /**
   * Get user statistics and progress
   */
  async getUserStatistics(userId: string) {
    const attempts = await this.getUserAttempts(userId);
    const userSkills = await this.adaptiveService.getUserSkills(userId);
    
    if (attempts.length === 0) {
      return {
        totalAttempts: 0,
        averageScore: 0,
        bestScore: 0,
        overallMastery: 0.5,
        skillBreakdown: userSkills.map(skill => ({
          topicTitle: skill.topic.title,
          lessonTitle: skill.topic.lesson.title,
          mastery: skill.mastery,
          level: skill.level,
          attempts: skill.attempts,
          correct: skill.correct
        }))
      };
    }

    const scores = attempts.map(a => a.score || 0);
    const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const bestScore = Math.max(...scores);
    const overallMastery = userSkills.reduce((sum, skill) => sum + skill.mastery, 0) / userSkills.length;

    return {
      totalAttempts: attempts.length,
      averageScore: Math.round(averageScore * 10) / 10,
      bestScore,
      overallMastery: Math.round(overallMastery * 100) / 100,
      skillBreakdown: userSkills.map(skill => ({
        topicTitle: skill.topic.title,
        lessonTitle: skill.topic.lesson.title,
        mastery: Math.round(skill.mastery * 100) / 100,
        level: Math.round(skill.level * 100) / 100,
        attempts: skill.attempts,
        correct: skill.correct
      }))
    };
  }
}