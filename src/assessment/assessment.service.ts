import { Injectable } from '@nestjs/common';
import { generateText } from 'ai';
import { PrismaService } from 'prisma/prisma.service';
import { AdaptiveService } from '../adaptive/adaptive.service';
import { buildAdaptiveQuizPrompt } from './prompts/adaptive-quiz-generation';
import { buildLessonQuizPrompt, getDifficultyFromMastery, LessonQuizContext } from './prompts/lesson-quiz-generation';
import { AI_CONFIG, groq } from '../config/ai.config';

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
    const jsonArrayMatch = text.match(/```json\s*([\s\S]*?)```/i) || text.match(/(\[\s*\{[\s\S]*\}\s*\])/);;
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
 * Calculate difficulty progression based on user's attempt history
 * Implements the revised difficulty progression rules
 */
private async calculateDifficultyProgression(userId: string): Promise<{
  currentDifficulty: string;
  canProgressToMedium: boolean;
  canProgressToHard: boolean;
  progressionStatus: string;
  attemptCount: number;
  averageMastery: number;
}> {
  // Get user's recent attempts
  const attempts = await this.getUserAttempts(userId);
  
  if (attempts.length === 0) {
    return {
      currentDifficulty: 'easy',
      canProgressToMedium: false,
      canProgressToHard: false,
      progressionStatus: 'Start with easy difficulty',
      attemptCount: 0,
      averageMastery: 0
    };
  }

  const attemptCount = attempts.length;
  const recentAttempts = attempts.slice(0, Math.min(5, attempts.length)); // Last 5 attempts
  
  // Calculate mastery percentages for each attempt
  const masteryPercentages = recentAttempts.map(attempt => {
    const questions = attempt.questions as any[];
    if (!questions || questions.length === 0) return 0;
    
    const responses = attempt.responses || {};
    let correctAnswers = 0;
    
    questions.forEach((q, idx) => {
      const answer = responses[q.id ?? idx];
      const isCorrect = q.options?.find((o: any) => o.id === answer && o.isCorrect);
      if (isCorrect) correctAnswers++;
    });
    
    return Math.round((correctAnswers / questions.length) * 100);
  });

  const averageMastery = masteryPercentages.length > 0 ? 
    Math.round(masteryPercentages.reduce((sum, score) => sum + score, 0) / masteryPercentages.length) : 0;
  
  const latestMastery = masteryPercentages[0] || 0;

  console.log(`User ${userId} difficulty progression analysis:`);
  console.log(`- Attempt count: ${attemptCount}`);
  console.log(`- Recent mastery scores: ${masteryPercentages.join(', ')}%`);
  console.log(`- Average mastery: ${averageMastery}%`);
  console.log(`- Latest mastery: ${latestMastery}%`);

  // Determine current difficulty and progression eligibility
  let currentDifficulty = 'easy';
  let canProgressToMedium = false;
  let canProgressToHard = false;
  let progressionStatus = '';

  // Rules for Medium difficulty progression
  if (attemptCount === 1) {
    if (latestMastery >= 90) {
      progressionStatus = 'Excellent first attempt (90%+)! Complete 2 more attempts maintaining 40%+ to unlock medium difficulty.';
    } else if (latestMastery >= 70) {
      progressionStatus = 'Good first attempt! Keep practicing to improve your mastery.';
    } else {
      progressionStatus = 'Keep practicing to improve your understanding of the concepts.';
    }
  } else if (attemptCount >= 2 && attemptCount < 5) {
    // Check if user had 90%+ on first attempt and maintained 40%+ average
    const firstAttemptMastery = masteryPercentages[masteryPercentages.length - 1]; // First attempt (last in reversed array)
    
    if (firstAttemptMastery >= 90 && averageMastery >= 40) {
      canProgressToMedium = true;
      currentDifficulty = 'medium';
      progressionStatus = `Unlocked medium difficulty! (First attempt: ${firstAttemptMastery}%, Average: ${averageMastery}%)`;
    } else if (firstAttemptMastery >= 90) {
      progressionStatus = `Maintain average mastery above 40% to unlock medium. Current average: ${averageMastery}%`;
    } else {
      progressionStatus = 'Continue practicing to improve mastery.';
    }
  } else if (attemptCount >= 5) {
    // Check progression to hard difficulty after 5th attempt
    const firstAttemptMastery = masteryPercentages[masteryPercentages.length - 1];
    
    if (firstAttemptMastery >= 90 && averageMastery >= 40) {
      canProgressToMedium = true;
      currentDifficulty = 'medium';
      
      if (averageMastery >= 70) {
        canProgressToHard = true;
        currentDifficulty = 'hard';
        progressionStatus = `Unlocked hard difficulty! (Average mastery: ${averageMastery}%)`;
      } else {
        progressionStatus = `Medium difficulty unlocked. Achieve 70%+ average mastery to unlock hard difficulty. Current: ${averageMastery}%`;
      }
    } else if (firstAttemptMastery >= 90) {
      progressionStatus = `Maintain average mastery above 40% to progress. Current average: ${averageMastery}%`;
    } else {
      progressionStatus = 'Continue practicing. Focus on achieving higher mastery scores.';
    }
  }

  return {
    currentDifficulty,
    canProgressToMedium,
    canProgressToHard,
    progressionStatus,
    attemptCount,
    averageMastery
  };
}



    /**
   * Generate adaptive practice assessment based on user's skill level
   */
  async generateAdaptivePracticeAssessment(userId: string) {
    // Calculate difficulty progression first
    const difficultyProgression = await this.calculateDifficultyProgression(userId);
    console.log(`User ${userId} difficulty progression:`, difficultyProgression);
    
    // Get adaptive recommendations
    const recommendations = await this.adaptiveService.getAdaptiveRecommendations(userId);
    
    // Override recommended difficulty with progression-based difficulty
    recommendations.recommendedDifficulty = difficultyProgression.currentDifficulty;
    
    // Get all lessons and their topics
    const lessons = await this.prisma.lesson.findMany({
      include: { topics: true }
    });

    if (!lessons || lessons.length < 4) throw new Error('Not enough lessons found');

    // Get all topics across all lessons
    const allTopics = lessons.flatMap(lesson => lesson.topics);
    console.log(`Found ${allTopics.length} total topics across ${lessons.length} lessons`);

    if (allTopics.length === 0) throw new Error('No topics found');

    // Get user skills to identify weakest topics
    const userSkills = await this.adaptiveService.getUserSkills(userId);
    const skillsByTopicId = userSkills.reduce((acc, skill) => {
      acc[skill.topicId] = skill.mastery;
      return acc;
    }, {} as Record<number, number>);

    // Calculate mastery for each topic (default 0.5 if no data)
    const topicMasteries = allTopics.map(topic => ({
      topicId: topic.id,
      lessonId: topic.lessonId,
      mastery: skillsByTopicId[topic.id] || 0.5,
      topic
    }));

    // Find the 3 weakest topics
    const weakestTopics = topicMasteries
      .sort((a, b) => a.mastery - b.mastery)
      .slice(0, 3);

    console.log('Weakest topics:', weakestTopics.map(t => `Topic ${t.topicId} (${t.topic.title}) - mastery: ${t.mastery}`));

    // Create distribution: 2 questions per topic (24 total) + 6 extra for weakest topics (2 each) = 30 total
    const topicDistribution = new Map<number, number>();
    
    // Give each topic 2 base questions
    allTopics.forEach(topic => {
      topicDistribution.set(topic.id, 2);
    });

    // Add 2 extra questions for each of the 3 weakest topics
    weakestTopics.forEach(({ topicId }) => {
      const currentCount = topicDistribution.get(topicId) || 0;
      topicDistribution.set(topicId, currentCount + 2);
    });

    console.log('Topic distribution:', Array.from(topicDistribution.entries()).map(([topicId, count]) => {
      const topic = allTopics.find(t => t.id === topicId);
      return `Topic ${topicId} (${topic?.title}): ${count} questions`;
    }));

    // Convert to lesson distribution for prompt compatibility
    const distribution = { lesson1: 0, lesson2: 0, lesson3: 0, lesson4: 0 };
    topicDistribution.forEach((count, topicId) => {
      const topic = allTopics.find(t => t.id === topicId);
      if (topic) {
        const lessonKey = `lesson${topic.lessonId}` as keyof typeof distribution;
        distribution[lessonKey] += count;
      }
    });

    console.log('Lesson distribution:', distribution);
    const totalQuestions = Object.values(distribution).reduce((a, b) => a + b, 0);
    console.log(`Total questions planned: ${totalQuestions}`);

    // Select all topics with their question counts and priorities
    const topicSelections = allTopics.map(topic => {
      const questionCount = topicDistribution.get(topic.id) || 0;
      const isWeak = weakestTopics.some(wt => wt.topicId === topic.id);
      
      return {
        ...topic,
        questionCount,
        isWeak,
        priority: isWeak ? 'HIGH (Weak Area)' : 'NORMAL'
      };
    }).filter(t => t.questionCount > 0);

    console.log('Selected topics:', topicSelections.map(t => `${t.title}: ${t.questionCount} questions (${t.priority})`));

    const promptParts = topicSelections.map(topic => `
      Topic: ${topic.title} (Lesson ${topic.lessonId}, Questions: ${topic.questionCount}, Priority: ${topic.priority})
      Content: ${topic.contentText}
    `);

    const prompt = buildAdaptiveQuizPrompt({
      userMasteryPercent: parseFloat((recommendations.overallMastery * 100).toFixed(1)),
      recommendedDifficulty: recommendations.recommendedDifficulty,
      focusTopics: recommendations.focusTopics.map(t => t.topicTitle),
      topicContents: promptParts,
      questionDistribution: distribution,
      totalQuestions: 30,
      topicDistribution: topicSelections.map(topic => ({
        topicId: topic.id,
        topicTitle: topic.title,
        questionCount: topic.questionCount
      })),
      weakestTopics: weakestTopics.map(wt => ({
        topicId: wt.topicId,
        topicTitle: wt.topic.title,
        mastery: wt.mastery
      }))
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

      // Ensure topicId is properly set based on lessonId if missing
      if (!q.topicId && q.lessonId) {
        const lessonTopics = allTopics.filter(t => t.lessonId === q.lessonId);
        if (lessonTopics.length > 0) {
          // Prefer weak topics first, then any topic from the lesson
          const weakTopic = lessonTopics.find(t => weakestTopics.some(wt => wt.topicId === t.id));
          q.topicId = weakTopic?.id || lessonTopics[0].id;
        }
      }
      
      // Validate topicId exists in our topics list
      if (!allTopics.some(t => t.id === q.topicId)) {
        console.warn(`Question ${index + 1} has invalid topicId ${q.topicId}, fixing...`);
        const lessonTopics = allTopics.filter(t => t.lessonId === q.lessonId);
        if (lessonTopics.length > 0) {
          q.topicId = lessonTopics[0].id;
        }
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

    if (validQuestions.length < 25) {
      console.warn(`Only ${validQuestions.length} valid questions generated, expected 30`);
    }

    console.log(`Generated ${validQuestions.length} valid questions`);
    
    // Track actual distribution by topic
    const actualTopicDistribution = new Map<number, number>();
    validQuestions.slice(0, 30).forEach(q => {
      const count = actualTopicDistribution.get(q.topicId) || 0;
      actualTopicDistribution.set(q.topicId, count + 1);
    });
    
    console.log('Actual question distribution by topic:', Array.from(actualTopicDistribution.entries()).map(([topicId, count]) => {
      const topic = allTopics.find(t => t.id === topicId);
      return `Topic ${topicId} (${topic?.title}): ${count} questions`;
    }));

    return { 
      questions: validQuestions.slice(0, 30), // Ensure we get exactly 30 questions
      adaptiveInfo: recommendations,
      plannedDistribution: topicDistribution,
      actualDistribution: actualTopicDistribution
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

      // Get difficulty progression info
      const difficultyProgression = await this.calculateDifficultyProgression(userId);

      return {
        attemptId: attempt.id,
        questions: quiz.questions,
        adaptiveInfo: quiz.adaptiveInfo,
        difficultyProgression: difficultyProgression,
      };
    } catch (error) {
      console.error('Error in startAdaptivePracticeAttempt:', error);
      throw new Error(`Failed to start adaptive practice: ${error.message}`);
    }
  }

  /**
   * Start a lesson-specific practice attempt
   * Generates 10 questions for a single lesson with topic-specific difficulty
   */
  async startLessonPracticeAttempt(userId: string, lessonId: number) {
    try {
      console.log(`Starting lesson practice for user ${userId}, lesson ${lessonId}`);

      // Get the lesson with its topics
      const lesson = await this.prisma.lesson.findUnique({
        where: { id: lessonId },
        include: { topics: true }
      });

      if (!lesson) {
        throw new Error(`Lesson ${lessonId} not found`);
      }

      if (lesson.topics.length === 0) {
        throw new Error(`Lesson ${lessonId} has no topics`);
      }

      console.log(`Found lesson "${lesson.title}" with ${lesson.topics.length} topics`);

      // Initialize user skills if needed
      await this.adaptiveService.initializeUserSkills(userId);

      // Get user's mastery for each topic in this lesson
      const userSkills = await this.prisma.userSkill.findMany({
        where: {
          userId,
          topicId: { in: lesson.topics.map(t => t.id) }
        }
      });

      // Create a map of topicId -> mastery
      const skillMap = userSkills.reduce((acc, skill) => {
        acc[skill.topicId] = skill.mastery;
        return acc;
      }, {} as Record<number, number>);

      // Calculate mastery and difficulty for each topic
      const topicsWithMastery = lesson.topics.map(topic => ({
        topicId: topic.id,
        topicTitle: topic.title,
        mastery: skillMap[topic.id] ?? 0.5, // Default 0.5 if no data
        contentText: topic.contentText,
        tags: topic.tags || []
      }));

      // Sort by mastery to find weakest topic
      const sortedByMastery = [...topicsWithMastery].sort((a, b) => a.mastery - b.mastery);
      const weakestTopicId = sortedByMastery[0].topicId;

      console.log('Topic masteries:', topicsWithMastery.map(t => 
        `${t.topicTitle}: ${Math.round(t.mastery * 100)}%`
      ));
      console.log(`Weakest topic: ${sortedByMastery[0].topicTitle}`);

      // Distribute questions: 3 per topic, weakest gets 4 (bonus)
      // Total: 3 + 3 + 4 = 10 questions
      const topicsForPrompt = topicsWithMastery.map(topic => {
        const isWeakest = topic.topicId === weakestTopicId;
        const difficulty = getDifficultyFromMastery(topic.mastery);
        
        return {
          topicId: topic.topicId,
          topicTitle: topic.topicTitle,
          mastery: topic.mastery,
          difficulty,
          questionCount: isWeakest ? 4 : 3, // Weakest gets bonus question
          contentText: topic.contentText,
          tags: topic.tags
        };
      });

      const totalQuestions = topicsForPrompt.reduce((sum, t) => sum + t.questionCount, 0);
      console.log(`Question distribution: ${topicsForPrompt.map(t => `${t.topicTitle}: ${t.questionCount} (${t.difficulty})`).join(', ')}`);
      console.log(`Total questions: ${totalQuestions}`);

      // Build the prompt context
      const promptContext: LessonQuizContext = {
        lessonId: lesson.id,
        lessonTitle: lesson.title,
        topics: topicsForPrompt,
        totalQuestions
      };

      // Generate questions using AI
      const prompt = buildLessonQuizPrompt(promptContext);
      
      const modelName = AI_CONFIG.modelName;
      const temp = AI_CONFIG.temperature;
      const topP = AI_CONFIG.topP;

      console.log(`Generating ${totalQuestions} questions using ${modelName}...`);

      const { text } = await generateText({
        model: groq(modelName),
        prompt,
        temperature: temp,
        topP: topP,
      });

      let questions = await this.extractJsonArray(text);

      // Validate and clean questions
      if (!Array.isArray(questions)) {
        console.error('AI generated non-array response, retrying...');
        const { text: retryText } = await generateText({
          model: groq(modelName),
          prompt,
          temperature: Math.max(0.1, temp - 0.1),
          topP: topP,
        });
        questions = await this.extractJsonArray(retryText);
        
        if (!Array.isArray(questions)) {
          throw new Error('Failed to generate valid questions array');
        }
      }

      // Process and validate each question
      const validQuestions = questions.map((q: any, index: number) => {
        // Ensure options exist and is an array
        if (!Array.isArray(q.options) || q.options.length < 3) {
          console.warn(`Question ${index + 1} has invalid options array`);
          return null; // Mark for rejection
        }

        // Count correct answers
        const correctOptions = q.options.filter((opt: any) => opt.isCorrect === true);
        
        if (correctOptions.length === 0) {
          // No correct answer - try to use answerId to find one
          if (q.answerId) {
            const answerOption = q.options.find((opt: any) => opt.id === q.answerId);
            if (answerOption) {
              console.warn(`Question ${index + 1} has no isCorrect=true, setting from answerId`);
              answerOption.isCorrect = true;
            } else {
              // Can't determine correct answer, mark first option as correct (fallback)
              console.warn(`Question ${index + 1} has no correct answer and invalid answerId, marking first option`);
              q.options[0].isCorrect = true;
              q.answerId = q.options[0].id;
            }
          } else {
            // No answerId either - reject this question
            console.warn(`Question ${index + 1} has no correct answer and no answerId, rejecting`);
            return null;
          }
        } else if (correctOptions.length > 1) {
          // Multiple correct answers - keep only the first one
          console.warn(`Question ${index + 1} has ${correctOptions.length} correct answers, keeping only first`);
          let foundFirst = false;
          q.options.forEach((opt: any) => {
            if (opt.isCorrect === true) {
              if (foundFirst) {
                opt.isCorrect = false;
              } else {
                foundFirst = true;
              }
            }
          });
        }

        // Ensure answerId matches the correct option
        const finalCorrectOption = q.options.find((opt: any) => opt.isCorrect === true);
        if (finalCorrectOption) {
          q.answerId = finalCorrectOption.id;
        } else {
          // This shouldn't happen after the fixes above, but safety check
          console.warn(`Question ${index + 1} still has no correct answer after fixes, rejecting`);
          return null;
        }

        // Validate topicId belongs to this lesson
        const validTopicIds = lesson.topics.map(t => t.id);
        if (!validTopicIds.includes(q.topicId)) {
          console.warn(`Question ${index + 1} has invalid topicId ${q.topicId}, assigning to first topic`);
          q.topicId = lesson.topics[0].id;
        }

        // Ensure lessonId is correct
        q.lessonId = lessonId;

        // Filter tags to allowed values
        q.tags = (q.tags || []).filter((tag: string) => this.allowedTags.includes(tag));

        return {
          ...q,
          questionType: q.questionType || 'multiple-choice',
          solutionSteps: q.solutionSteps || ['Analyze the problem', 'Apply relevant concepts', 'Verify the answer']
        };
      }).filter((q: any) => {
        // Filter out null values (questions marked for rejection in map)
        if (q === null) {
          return false;
        }
        
        // Validate question has required fields
        if (!q.stem || !q.options || q.options.length < 3) {
          console.warn('Rejecting question with missing stem or options');
          return false;
        }
        
        // Verify exactly one correct answer exists
        const correctCount = q.options.filter((opt: any) => opt.isCorrect === true).length;
        if (correctCount !== 1) {
          console.warn(`Rejecting question with ${correctCount} correct answers (must be exactly 1)`);
          return false;
        }
        
        // Check for broken visuals
        if (typeof q.stem === 'string') {
          const lowerStem = q.stem.toLowerCase();
          if (lowerStem.includes('table below') || 
              lowerStem.includes('circuit below') || 
              lowerStem.includes('map below')) {
            console.warn('Rejecting question with broken visual reference');
            return false;
          }
        }
        
        // Validate truth table variable count matches the number of input columns
        if (typeof q.stem === 'object' && q.stem?.type === 'table' && q.stem?.table) {
          const table = q.stem.table;
          const headers = table.headers || [];
          const inputColumns = headers.filter((h: string) => h.toUpperCase() !== 'Y' && h.toUpperCase() !== 'OUTPUT');
          const rows = table.rows || [];
          const expectedRows = Math.pow(2, inputColumns.length);
          
          // Check if row count matches expected (2^n for n input variables)
          if (rows.length !== expectedRows) {
            console.warn(`Rejecting truth table with ${rows.length} rows but ${inputColumns.length} inputs (expected ${expectedRows} rows)`);
            return false;
          }
          
          // Check for empty or invalid truth table
          if (inputColumns.length < 1 || inputColumns.length > 4) {
            console.warn(`Rejecting truth table with ${inputColumns.length} input columns (expected 1-4)`);
            return false;
          }
        }
        
        return true;
      });

      console.log(`Generated ${validQuestions.length} valid questions out of ${questions.length}`);

      if (validQuestions.length < 8) {
        throw new Error(`Only ${validQuestions.length} valid questions generated, minimum 8 required`);
      }

      // Take exactly 10 questions (or all if less)
      const finalQuestions = validQuestions.slice(0, 10);

      // Calculate average mastery for the lesson
      const averageMastery = topicsForPrompt.reduce((sum, t) => sum + t.mastery, 0) / topicsForPrompt.length;

      // Save the attempt
      const attempt = await this.prisma.attempt.create({
        data: {
          userId,
          questions: finalQuestions,
          performance: {
            lessonId,
            lessonTitle: lesson.title,
            overallMastery: averageMastery, // Add overall mastery for display
            recommendedDifficulty: getDifficultyFromMastery(averageMastery), // Add difficulty label
            topicDistribution: topicsForPrompt.map(t => ({
              topicId: t.topicId,
              topicTitle: t.topicTitle,
              mastery: t.mastery,
              difficulty: t.difficulty,
              questionCount: t.questionCount
            }))
          }
        }
      });

      console.log(`Created attempt ${attempt.id} with ${finalQuestions.length} questions`);

      return {
        attemptId: attempt.id,
        questions: finalQuestions,
        lessonInfo: {
          lessonId: lesson.id,
          lessonTitle: lesson.title,
          topicMasteries: topicsForPrompt.map(t => ({
            topicId: t.topicId,
            topicTitle: t.topicTitle,
            mastery: t.mastery,
            difficulty: t.difficulty,
            questionCount: t.questionCount
          }))
        }
      };
    } catch (error) {
      console.error('Error in startLessonPracticeAttempt:', error);
      throw new Error(`Failed to start lesson practice: ${error.message}`);
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

    // Get updated difficulty progression after this attempt
    const updatedProgression = await this.calculateDifficultyProgression(attempt.userId);
    
    // Add progression feedback to attempt feedback
    let enhancedFeedback = attemptAnalysis.attemptFeedback;
    if (updatedProgression.progressionStatus) {
      enhancedFeedback += ` ${updatedProgression.progressionStatus}`;
    }

    return { 
      score, 
      feedback: adaptiveFeedback, // Long-term feedback
      attemptFeedback: enhancedFeedback, // Enhanced with progression feedback
      weakestAreas: attemptAnalysis.weakestTags,
      strongestAreas: attemptAnalysis.strongestTags,
      recommendations: attemptAnalysis.recommendations,
      topicPerformance: performanceData,
      detailedBreakdown: attemptAnalysis.topicBreakdown,
      difficultyProgression: updatedProgression // Include progression status
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