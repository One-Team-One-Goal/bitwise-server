import { Injectable } from '@nestjs/common';
import { groq } from '@ai-sdk/groq';
import { generateText } from 'ai';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class AssessmentService {
  constructor(private prisma: PrismaService) {}

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

  /**
   * Generate a 20-item practice assessment using AI, with:
   * - 2 questions from lesson 1
   * - 6 questions each from lessons 2, 3, and 4
   * - Only allowed tags
   * Does NOT create an attempt, just returns the quiz.
   */
  async generatePracticeAssessment() {
    // 1. Get all lessons and their topics with contentText
    const lessons = await this.prisma.lesson.findMany({
      include: { topics: true }
    });

    if (!lessons || lessons.length < 4) throw new Error('Not enough lessons found');

    // 2. Prepare topic pools
    const lesson1 = lessons.find(l => l.id === 1);
    const lesson2 = lessons.find(l => l.id === 2);
    const lesson3 = lessons.find(l => l.id === 3);
    const lesson4 = lessons.find(l => l.id === 4);

    const lesson1Topics = lesson1?.topics ?? [];
    const lesson2Topics = lesson2?.topics ?? [];
    const lesson3Topics = lesson3?.topics ?? [];
    const lesson4Topics = lesson4?.topics ?? [];

    // 3. Select topics for question distribution
    // 2 from lesson 1, 6 from lesson 2, 6 from lesson 3, 6 from lesson 4
    const topicSelections = [
      ...lesson1Topics.slice(0, 2),
      ...lesson2Topics.slice(0, 6),
      ...lesson3Topics.slice(0, 6),
      ...lesson4Topics.slice(0, 6),
    ].filter(Boolean);

    // 4. Compose prompt for AI to generate 20 questions in one go
    const promptParts = topicSelections.map((topic, idx) => `
      Topic ${idx + 1}:
      Title: ${topic.title}
      Content: ${topic.contentText}
    `);

    const prompt = `
You are an adaptive learning assistant. Based on the following topics, generate a 20-item multiple-choice quiz.
- 2 questions should be from Lesson 1 topics, and these can be conceptual or definition questions.
- 6 questions each from Lessons 2, 3, and 4 topics, and these MUST be solving-type problem questions (require calculation, logical deduction, boolean expression simplification, or step-by-step solution, not just recall or definition).
- For Lessons 2-4, each question must be a problem that requires the student to solve, compute, or analyze, not just recall a fact.
- Each question must clearly indicate which lesson and topic it is from (add "lessonId" and "topicId" fields).
- Only use these tags for the "tags" field: ["intro","boolean-values","applications","and-gate","or-gate","not-gate","nand-gate","nor-gate","xor-gate","xnor-gate","truth-table-construction","truth-table-reading","truth-table-for-gates","identity-law","null-law","idempotent-law","inverse-law","commutative-law","absorption-law","distributive-law","simplification","karnaugh-maps"]
- Do not invent or add any other tags outside this list.
- Each question must follow this exact JSON format:
{
  "lessonId": 1,
  "topicId": 1,
  "difficulty": "hard",
  "stem": "Question text here",
  "questionType": "multiple-choice",
  "tags": ["tag1", "tag2"],
  "options": [
    {
      "id": "opt_a",
      "text": "Option text",
      "isCorrect": true|false,
      "explanation": "Explanation text"
    }
  ],
  "answerId": "opt_a",
  "solutionSteps": ["Step 1", "Step 2"],
  "sourcePassages": ["Relevant passage from topic"]
}

Topics:
${promptParts.join('\n\n')}
Return a JSON array of 20 questions, valid JSON only, no extra text.
    `;

    // 5. Generate all questions in one AI call
    const { text } = await generateText({
      model: groq("llama-3.1-8b-instant"),
      prompt,
    });
    const questions = await this.extractJsonArray(text);

    // 6. Do NOT create assessment or attempt, just return the quiz questions
    // Filter tags to allowedTags only (extra safety)
    const filteredQuestions = (questions || []).map((q: any) => ({
      ...q,
      tags: (q.tags || []).filter((tag: string) => this.allowedTags.includes(tag)),
    }));

    return { questions: filteredQuestions };
  }

  /**
   * Starts a new practice attempt: generates questions, saves them, and returns attemptId + questions.
   */
  async startPracticeAttempt(userId: string) {
    // Generate questions
    const quiz = await this.generatePracticeAssessment();

    // Save attempt with questions
    const attempt = await this.prisma.attempt.create({
      data: {
        userId,
        questions: quiz.questions,
      },
    });

    return {
      attemptId: attempt.id,
      questions: quiz.questions,
    };
  }

  /**
   * Saves the user's responses, calculates score, and generates adaptive feedback.
   */
  async savePracticeAttempt(attemptId: number, responses: any) {
    // Get the attempt and questions
    const attempt = await this.prisma.attempt.findUnique({ where: { id: attemptId } });
    if (!attempt) throw new Error('Attempt not found');

    const questions = attempt.questions as any[];
    // Calculate score and track topic misses
    let score = 0;
    const topicMisses: Record<number, number> = {};
    questions.forEach((q, idx) => {
      const answer = responses[q.id ?? idx];
      const correct = q.options.find((o: any) => o.id === answer && o.isCorrect);
      if (correct) {
        score += 1;
      } else {
        topicMisses[q.topicId] = (topicMisses[q.topicId] || 0) + 1;
      }
    });

    // Find the topicId with the most misses
    let hardestTopicId: string | null = null;
    let maxMisses = 0;
    for (const [topicId, misses] of Object.entries(topicMisses)) {
      if (misses > maxMisses) {
        maxMisses = misses;
        hardestTopicId = topicId;
      }
    }

    // Optionally, fetch topic/lesson info for feedback
    let feedback = '';
    if (hardestTopicId) {
      const topic = await this.prisma.topic.findUnique({ where: { id: Number(hardestTopicId) } });
      feedback = topic
        ? `You struggled most with: ${topic.title}. Please review this topic.`
        : `You struggled most with topic ID ${hardestTopicId}.`;
    }

    // Save responses, score, and feedback
    await this.prisma.attempt.update({
      where: { id: attemptId },
      data: {
        responses,
        score,
        feedback,
      },
    });

    return { score, feedback };
  }

  /**
   * Optionally, get a user's attempts (history)
   */
  async getUserAttempts(userId: string) {
    return this.prisma.attempt.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getAttemptById(attemptId: number) {
    return this.prisma.attempt.findUnique({
      where: { id: attemptId },
    });
  }
}