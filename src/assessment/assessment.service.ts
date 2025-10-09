import { Injectable } from '@nestjs/common';
import { groq } from '@ai-sdk/groq';
import { generateText } from 'ai';
import { PrismaService } from 'prisma/prisma.service';
import { AdaptiveService } from '../adaptive/adaptive.service';

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

    try {
      return JSON.parse(jsonString);
    } catch (err) {
      return { raw: text, error: "Could not parse response as JSON.", details: err.message };
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

  // Adjust question distribution based on user's weak areas
  const focusTopicIds = recommendations.focusTopics.map(t => t.topicId);
  
  let lesson1Topics = lessons.find(l => l.id === 1)?.topics ?? [];
  let lesson2Topics = lessons.find(l => l.id === 2)?.topics ?? [];
  let lesson3Topics = lessons.find(l => l.id === 3)?.topics ?? [];
  let lesson4Topics = lessons.find(l => l.id === 4)?.topics ?? [];

  // Prioritize focus topics - move them to the front of their respective lesson arrays
  if (focusTopicIds.length > 0) {
    lesson1Topics = lesson1Topics.filter(t => focusTopicIds.includes(t.id)).concat(
      lesson1Topics.filter(t => !focusTopicIds.includes(t.id))
    );
    lesson2Topics = lesson2Topics.filter(t => focusTopicIds.includes(t.id)).concat(
      lesson2Topics.filter(t => !focusTopicIds.includes(t.id))
    );
    lesson3Topics = lesson3Topics.filter(t => focusTopicIds.includes(t.id)).concat(
      lesson3Topics.filter(t => !focusTopicIds.includes(t.id))
    );
    lesson4Topics = lesson4Topics.filter(t => focusTopicIds.includes(t.id)).concat(
      lesson4Topics.filter(t => !focusTopicIds.includes(t.id))
    );
  }

  // Select topics for adaptive question distribution
  const topicSelections = [
    ...lesson1Topics.slice(0, 2),
    ...lesson2Topics.slice(0, 6),
    ...lesson3Topics.slice(0, 6),
    ...lesson4Topics.slice(0, 6),
  ].filter(Boolean);

  // Generate questions with adaptive difficulty
  const promptParts = topicSelections.map((topic, idx) => `
    Topic ${idx + 1}:
    Title: ${topic.title}
    Content: ${topic.contentText}
  `);

  const prompt = `
You are an advanced adaptive learning assistant. Generate a 20-item multiple-choice quiz with ${recommendations.recommendedDifficulty} difficulty level focused EXCLUSIVELY on PROBLEM-SOLVING and APPLICATION of knowledge.

CURRENT USER CONTEXT:
- User mastery level: ${(recommendations.overallMastery * 100).toFixed(1)}%
- Recommended difficulty: ${recommendations.recommendedDifficulty}
- Focus areas: ${recommendations.focusTopics.map(t => t.topicTitle).join(', ')}

QUESTION DISTRIBUTION REQUIREMENTS:
- 2 questions from Lesson 1 topics (application-based only)
- 6 questions each from Lessons 2, 3, and 4 topics (MUST be problem-solving/application)

MANDATORY QUESTION APPROACH:
❌ NEVER ask: "What is...", "Define...", "Which law states...", "What does... mean..."
✅ ALWAYS ask: "Calculate...", "Determine...", "Simplify...", "Design...", "Analyze...", "Solve..."

PRIORITIZED QUESTION TYPES:
1. Circuit analysis with given input values
2. Truth table completion or interpretation
3. Boolean expression simplification problems
4. Karnaugh map minimization
5. Logic gate identification from behavior
6. Circuit design challenges
7. Real-world application scenarios requiring logical reasoning

VISUAL ELEMENT FORMATTING (USE IN "stem" FIELD)

1. TRUTH TABLES - Format:
{
  "type": "table",
  "table": {
    "rows": [
      ["0", "0", "1"],
      ["0", "1", "1"],
      ["1", "0", "1"],
      ["1", "1", "0"]
    ],
    "caption": "Complete the analysis for the following logic behavior",
    "headers": ["Input A", "Input B", "Output Y"]
  }
}

CRITICAL TRUTH TABLE RULES:
- NEVER reveal the gate type in the caption (e.g., don't say "NAND Gate Truth Table")
- Use neutral captions: "Analyze the logic function below", "Given the following logic behavior", "Complete this logic table"
- The question should ask students to IDENTIFY or ANALYZE, not just recall
- Example good question: "Based on the truth table below, what is the simplified Boolean expression for Output Y?"

2. KARNAUGH MAPS - Format:
{
  "type": "karnaughMap",
  "karnaughMap": {
    "rows": [
      ["1", "0"],
      ["1", "1"]
    ],
    "caption": "Use this map to find the minimized expression",
    "headers": ["B=0", "B=1"],
    "sideLabels": ["A=0", "A=1"]
  }
}

For 3-variable K-maps:
{
  "type": "karnaughMap",
  "karnaughMap": {
    "rows": [
      ["1", "0", "0", "1"],
      ["1", "1", "0", "0"]
    ],
    "caption": "Minimize the Boolean function using the K-map below",
    "headers": ["BC=00", "BC=01", "BC=11", "BC=10"],
    "sideLabels": ["A=0", "A=1"]
  }
}

For 4-variable K-maps:
{
  "type": "karnaughMap",
  "karnaughMap": {
    "rows": [
      ["1", "0", "0", "1"],
      ["0", "1", "1", "0"],
      ["1", "1", "0", "0"],
      ["0", "0", "1", "1"]
    ],
    "caption": "Apply grouping rules to minimize this 4-variable function",
    "headers": ["CD=00", "CD=01", "CD=11", "CD=10"],
    "sideLabels": ["AB=00", "AB=01", "AB=11", "AB=10"]
  }
}

3. CIRCUIT DIAGRAMS - Format:
{
  "type": "circuit",
  "circuit": {
    "inputs": ["A", "B", "C"],
    "gates": [
      {"type": "AND", "inputs": ["A", "B"], "output": "X"},
      {"type": "NOT", "inputs": ["C"], "output": "Y"},
      {"type": "OR", "inputs": ["X", "Y"], "output": "Z"}
    ],
    "finalOutput": "Z",
    "caption": "Analyze the circuit configuration shown above"
  }
}

CIRCUIT REPRESENTATION DETAILS:
- "inputs": Array of input variable names
- "gates": Array of gate objects in sequence
  - "type": Gate type (AND, OR, NOT, NAND, NOR, XOR, XNOR)
  - "inputs": Input signals to this gate (can be original inputs or outputs from previous gates)
  - "output": Label for this gate's output signal
- "finalOutput": The final output signal of the entire circuit
- Use neutral captions that don't reveal the solution

ANSWER OPTIONS REQUIREMENTS

CRITICAL RULES:
1. Exactly 3-4 options per question (prefer 4 for problem-solving questions)
2. ONLY ONE CORRECT ANSWER - verify this rigorously
3. RANDOMIZE the position of the correct answer (don't always put it in position A or D)
4. Each option must be DISTINCTLY different - no duplicate logic or equivalent answers
5. Distractors must represent common student errors or misconceptions
6. All options should be plausible at first glance

VERIFICATION CHECKLIST FOR EACH QUESTION:
- [ ] Are all 4 options completely different from each other?
- [ ] Is there truly only ONE indisputably correct answer?
- [ ] Could any two options be considered equivalent or both correct?
- [ ] Is the correct answer in a random position (not always A or D)?
- [ ] Do distractors represent actual problem-solving errors?

EXAMPLE OF BAD OPTIONS (DON'T DO THIS):
❌ A. A·B + C
❌ B. AB + C  [Same as A - just different notation]
❌ C. (A AND B) OR C  [Same as A - just different format]
❌ D. C + A·B  [Same as A - commutative property makes this equivalent]

EXAMPLE OF GOOD OPTIONS:
✅ A. A·B + C
✅ B. A + B·C
✅ C. A·(B + C)
✅ D. (A + B)·(A + C)

REQUIRED JSON FORMAT

Each question MUST follow this exact structure:
{
  "lessonId": 1,
  "topicId": 1,
  "difficulty": "${recommendations.recommendedDifficulty}",
  "stem": "Problem statement OR object with visual element (table/karnaughMap/circuit)",
  "questionType": "multiple-choice",
  "tags": ["relevant-tags-from-allowed-list"],
  "options": [
    {
      "id": "opt_a",
      "text": "First option",
      "isCorrect": false,
      "explanation": "Why this is incorrect and what mistake it represents"
    },
    {
      "id": "opt_b",
      "text": "Second option",
      "isCorrect": true,
      "explanation": "Why this is the correct answer with brief justification"
    },
    {
      "id": "opt_c",
      "text": "Third option",
      "isCorrect": false,
      "explanation": "Why this is incorrect and what mistake it represents"
    },
    {
      "id": "opt_d",
      "text": "Fourth option",
      "isCorrect": false,
      "explanation": "Why this is incorrect and what mistake it represents"
    }
  ],
  "answerId": "opt_b",
  "solutionSteps": [
    "Step 1: Identify what is being asked and what information is given",
    "Step 2: Apply relevant principles/laws/methods",
    "Step 3: Perform calculations or logical operations",
    "Step 4: Verify the result and state the conclusion"
  ],
  "sourcePassages": ["Reference to relevant learning material"]
}

PROBLEM-SOLVING QUESTION TEMPLATES

EASY DIFFICULTY:
- "Given the circuit above with inputs A=1, B=0, what is the output?"
- "Simplify the expression: A·A + B"
- "Complete the missing output values in the truth table"
- "What is the result of applying De Morgan's law to (A+B)'?"

MEDIUM DIFFICULTY:
- "Determine the minimized SOP expression from the K-map shown"
- "For the circuit with three gates above, find the Boolean expression"
- "Simplify using Boolean algebra: (A+B)·(A+C)·(B+C)"
- "Design a circuit that produces output 1 when exactly two of three inputs are 1"

HARD DIFFICULTY:
- "Using the 4-variable K-map, find the minimized expression with don't-care conditions"
- "Analyze the multi-level circuit and determine the output for all input combinations where A=1"
- "Optimize the Boolean function F(A,B,C,D) = Σm(1,3,4,6,9,11,12,14) + d(0,5,15)"
- "Convert the given circuit to use only NAND gates while maintaining functionality"

ALLOWED TAGS ONLY:
["intro","boolean-values","applications","and-gate","or-gate","not-gate","nand-gate","nor-gate","xor-gate","xnor-gate","truth-table-construction","truth-table-reading","truth-table-for-gates","identity-law","null-law","idempotent-law","inverse-law","commutative-law","absorption-law","distributive-law","simplification","karnaugh-maps"]

DIFFICULTY-SPECIFIC GUIDELINES

EASY (Foundation):
- 2-input gates and simple combinations
- Basic truth tables (2-3 variables)
- Single-step Boolean simplifications
- Direct circuit output calculation
- One or two logic gates maximum

MEDIUM (Application):
- 3-input gate combinations
- Multi-step Boolean simplifications
- 2-3 variable K-maps
- Circuits with 3-5 gates
- Pattern recognition in truth tables

HARD (Advanced Problem-Solving):
- Complex multi-gate circuits
- 4-variable K-maps with grouping optimization
- Multi-step algebraic simplifications
- Circuit design problems with constraints
- Don't-care condition handling
- Gate conversion problems

LEARNING CONTENT TO USE

${promptParts.join('\n\n')}


FINAL INSTRUCTIONS

1. Generate EXACTLY 20 questions
2. Each question MUST require problem-solving, not memorization
3. Verify each question has ONLY ONE correct answer
4. Randomize correct answer positions across all questions
5. Use visual elements (tables, K-maps, circuits) for at least 50% of questions
6. Never reveal answers in captions or question stems
7. Make distractors represent realistic student errors
8. Ensure all options are genuinely distinct

OUTPUT: Return ONLY a valid JSON array. No markdown formatting, no explanations, no additional text - just the raw JSON array of 20 question objects.
`;

      const { text } = await generateText({
        model: groq("llama-3.1-8b-instant"),
        prompt,
        temperature: 0.7, // Add some creativity while maintaining consistency
      });

      const questions = await this.extractJsonArray(text);

      // Enhanced validation and filtering
      const filteredQuestions = (questions || []).map((q: any, index: number) => {
        // Ensure exactly one correct answer
        const correctOptions = q.options?.filter((opt: any) => opt.isCorrect) || [];
        if (correctOptions.length !== 1) {
          console.warn(`Question ${index + 1} has ${correctOptions.length} correct answers, should have exactly 1`);
          // Fix by ensuring only the first correct option is marked as correct
          q.options?.forEach((opt: any, idx: number) => {
            opt.isCorrect = idx === 0 && correctOptions.length === 0 ? true : 
                          opt.isCorrect && correctOptions.indexOf(opt) === 0;
          });
        }

        // Ensure 3-4 options
        if (q.options?.length < 3) {
          console.warn(`Question ${index + 1} has only ${q.options?.length} options, minimum is 3`);
        }

        // Set answer ID to correct option
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
          solutionSteps: q.solutionSteps || ['Analyze the problem', 'Apply relevant concepts', 'Verify the answer'],
          sourcePassages: q.sourcePassages || ['Reference topic content']
        };
      });

      // Additional validation
      const validQuestions = filteredQuestions.filter((q: any) => {
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
    // Generate adaptive questions
    const quiz = await this.generateAdaptivePracticeAssessment(userId);

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
    return (this.prisma as any).attempt.findUnique({
      where: { id: attemptId },
    });
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