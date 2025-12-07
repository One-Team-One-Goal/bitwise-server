/**
 * Lesson-Specific Quiz Generation Prompt
 * 
 * This prompt generates a focused 10-question quiz for a single lesson.
 * Each topic gets questions with difficulty matching the user's mastery.
 */

export interface LessonQuizContext {
  lessonId: number;
  lessonTitle: string;
  topics: Array<{
    topicId: number;
    topicTitle: string;
    mastery: number;           // 0.0 to 1.0
    difficulty: 'easy' | 'medium' | 'hard';
    questionCount: number;     // 3 or 4 (weakest gets bonus)
    contentText: string;
    tags: string[];
  }>;
  totalQuestions: number;      // Always 10
}

/**
 * Determine difficulty based on mastery level
 */
export function getDifficultyFromMastery(mastery: number): 'easy' | 'medium' | 'hard' {
  if (mastery < 0.4) return 'easy';
  if (mastery < 0.7) return 'medium';
  return 'hard';
}

/**
 * Get lesson-specific visual and question type guidelines
 */
function getLessonGuidelines(lessonId: number): string {
  const guidelines: Record<number, string> = {
    1: `**LESSON 1: Introduction to Boolean Algebra**
- Focus: Basic concepts, Boolean values (0/1, true/false), real-world applications
- Question Types: Text-based conceptual questions, simple calculations
- Visual Requirement: 20-30% (mostly text-based)
- EASY: Basic definitions applied to scenarios, simple OR/AND calculations
- MEDIUM: Multi-step reasoning, comparing Boolean expressions
- HARD: Complex application scenarios, edge cases
- Example stems: "Calculate A OR B when A=1, B=0", "Which expression equals 1?"`,

    2: `**LESSON 2: Logic Gates**
- Focus: AND, OR, NOT, NAND, NOR, XOR, XNOR gate behavior and symbols
- Question Types: **MUST USE CIRCUIT DIAGRAMS AND TRUTH TABLES**
- Visual Requirement: 80-90% (circuits and tables are essential)
- EASY: Single gate analysis, basic truth table reading
- MEDIUM: 2-gate circuits, truth table to gate identification
- HARD: 3+ gate circuits, complex signal tracing
- Limit truth tables to 2 questions max; prefer circuits`,

    3: `**LESSON 3: Truth Tables**
- Focus: Constructing, reading, and analyzing truth tables for expressions
- Question Types: **TRUTH TABLES AND ALGEBRAIC EXPRESSIONS**
- Visual Requirement: 60-70% (truth tables are the focus)
- EASY: Read output from a simple 2-variable table
- MEDIUM: Construct or verify a 3-variable truth table
- HARD: Derive expressions from complex tables, find equivalences
- Use tables to test expression evaluation skills`,

    4: `**LESSON 4: Simplification & K-Maps**
- Focus: Boolean laws, Karnaugh maps, SOP/POS optimization
- Question Types: **KARNAUGH MAPS AND ALGEBRAIC SIMPLIFICATION**
- Visual Requirement: 70-80% (K-maps for optimization, text for laws)
- EASY: Apply single law (Identity, Null), 2-variable K-map
- MEDIUM: Multi-law simplification, 3-variable K-map grouping
- HARD: Complex expressions, 4-variable K-maps, optimal grouping
- Use K-maps for visual questions, text for law application`
  };

  return guidelines[lessonId] || guidelines[1];
}

/**
 * Build the lesson-specific quiz prompt
 */
export function buildLessonQuizPrompt(context: LessonQuizContext): string {
  const topicInstructions = context.topics.map(topic => {
    const masteryPercent = Math.round(topic.mastery * 100);
    const isWeakest = topic.questionCount > 3;
    
    return `
📚 **${topic.topicTitle}** (Topic ID: ${topic.topicId})
   - User Mastery: ${masteryPercent}%
   - Difficulty: **${topic.difficulty.toUpperCase()}**
   - Questions: **${topic.questionCount}** ${isWeakest ? '🔥 (WEAKEST - BONUS QUESTION)' : ''}
   - Tags to use: ${topic.tags.join(', ')}
   - Content Summary: ${topic.contentText.substring(0, 300)}...`;
  }).join('\n');

  const difficultyGuidelines = `
📊 DIFFICULTY GUIDELINES:

**EASY Questions** (for mastery < 40%):
- Single-step problems
- Direct application of concepts
- Clear, unambiguous scenarios
- 2-variable expressions (A, B) → truth tables have 4 rows
- Confidence-building questions

**MEDIUM Questions** (for mastery 40-69%):
- Multi-step reasoning required
- Application to new scenarios
- 3-variable expressions (A, B, C) → truth tables have 8 rows
- **The expression MUST use all 3 variables!** (e.g., Y = A'B + C, NOT Y = A' + B')
- Requires connecting concepts

**HARD Questions** (for mastery ≥ 70%):
- Complex multi-step problems
- Synthesis of multiple concepts
- 3-4 variable expressions → truth tables have 8-16 rows
- **The expression MUST use all 3-4 variables!**
- Optimization and edge cases`;

  return `
You are a distinguished University Professor of Digital Logic and Boolean Algebra. Your task is to generate a focused, high-quality **10-question** assessment for a single lesson.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 LESSON: ${context.lessonTitle} (Lesson ID: ${context.lessonId})
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${getLessonGuidelines(context.lessonId)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 TOPIC-SPECIFIC REQUIREMENTS (MUST FOLLOW EXACTLY)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${topicInstructions}

${difficultyGuidelines}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 MANDATORY: GENERATE EXACTLY ${context.totalQuestions} QUESTIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️ CRITICAL RULES:
1. **MATCH DIFFICULTY TO TOPIC**: Each question's difficulty MUST match the topic's assigned difficulty
2. **EXACT QUESTION COUNT**: Generate exactly ${context.topics.map(t => t.questionCount).join(' + ')} = ${context.totalQuestions} questions
3. **CORRECT TOPIC IDs**: Each question must have the correct topicId from above
4. **NO MEMORIZATION**: Use "Calculate", "Analyze", "Design", "Simplify" - NOT "Define" or "What is"
5. **ONE CORRECT ANSWER**: Exactly one option must be correct with clear mathematical justification

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📐 VISUAL ELEMENT FORMATS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**TYPE 1: TRUTH TABLE** (for Lessons 2, 3)
{
  "type": "table",
  "table": {
    "headers": ["A", "B", "Y"],
    "rows": [["0","0","1"], ["0","1","1"], ["1","0","1"], ["1","1","0"]],
    "caption": "Analyze the logic function"
  }
}

**TYPE 2: CIRCUIT DIAGRAM** (for Lesson 2)
{
  "type": "circuit",
  "circuit": {
    "inputs": ["A", "B"],
    "gates": [
      {"id": "G1", "type": "AND", "inputs": ["A", "B"], "output": "X"},
      {"id": "G2", "type": "NOT", "inputs": ["X"], "output": "Y"}
    ],
    "finalOutput": "Y",
    "caption": "Determine the output expression"
  }
}

**TYPE 3: KARNAUGH MAP** (for Lesson 4)
{
  "type": "karnaughMap",
  "karnaughMap": {
    "headers": ["B=0", "B=1"],
    "sideLabels": ["A=0", "A=1"],
    "rows": [["1", "0"], ["1", "1"]],
    "caption": "Find the minimal SOP expression"
  }
}

**TYPE 4: TEXT-ONLY** (for Lessons 1, 3, 4 algebraic)
Just use a string: "Simplify the expression: A + A·B"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📤 OUTPUT FORMAT (JSON ARRAY)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Return ONLY a valid JSON array. No markdown, no text before/after.

[
  {
    "lessonId": ${context.lessonId},
    "topicId": <topic_id_from_above>,
    "difficulty": "<easy|medium|hard matching topic>",
    "stem": "<string OR visual object>",
    "questionType": "multiple-choice",
    "tags": ["<valid-tags-from-topic>"],
    "_reasoning": "Step-by-step verification of the correct answer",
    "options": [
      {"id": "opt_a", "text": "Option A", "isCorrect": false, "explanation": "Why wrong"},
      {"id": "opt_b", "text": "Option B", "isCorrect": true, "explanation": "Why correct"},
      {"id": "opt_c", "text": "Option C", "isCorrect": false, "explanation": "Why wrong"},
      {"id": "opt_d", "text": "Option D", "isCorrect": false, "explanation": "Why wrong"}
    ],
    "answerId": "opt_b",
    "solutionSteps": ["Step 1...", "Step 2...", "Step 3..."]
  }
]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ LOGIC VERIFICATION (MANDATORY)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

You MUST verify answers in "_reasoning" field:
- TRUTH TABLE: Check ALL rows. NAND: 0,0→1; 0,1→1; 1,0→1; 1,1→0
- CIRCUIT: Trace signal from inputs through each gate
- K-MAP: Verify groupings produce the correct minimal expression
- EXPRESSION: Show algebraic steps

**⚠️ CRITICAL: VARIABLE COUNT MUST MATCH!**
- If the expression has 2 variables (A, B): Truth table has 4 rows, headers: ["A", "B", "Y"]
- If the expression has 3 variables (A, B, C): Truth table has 8 rows, headers: ["A", "B", "C", "Y"]
- The number of variables in the expression MUST equal the number of input columns in the truth table
- Y = A' + B' uses ONLY A and B, so table has ONLY A and B columns (4 rows)
- Y = A·B + C uses A, B, and C, so table has A, B, and C columns (8 rows)
- **NEVER add extra variables that don't appear in the expression!**
- **If you want 3 variables for MEDIUM difficulty, the EXPRESSION must use 3 variables!**
- WRONG: Expression "Y = A' + B'" with table columns [A, B, C] ❌
- RIGHT: Expression "Y = A' + B' + C" with table columns [A, B, C] ✓
- RIGHT: Expression "Y = A·B·C'" with table columns [A, B, C] ✓

DO NOT HALLUCINATE. Verify before outputting.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚀 GENERATE ${context.totalQuestions} QUESTIONS NOW
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Remember:
${context.topics.map(t => `- ${t.topicTitle}: ${t.questionCount} ${t.difficulty.toUpperCase()} questions`).join('\n')}

Total: ${context.totalQuestions} questions in valid JSON array format.
`;
}
