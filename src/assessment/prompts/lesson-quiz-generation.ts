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
- Focus: Reading and analyzing truth tables to derive expressions
- Question Types: **TRUTH TABLES AND ALGEBRAIC EXPRESSIONS** (READ ONLY - DO NOT ASK TO CONSTRUCT)
- Visual Requirement: 60-70% (truth tables are the focus)
- EASY: Read output from a simple 2-variable table, identify the expression
- MEDIUM: Analyze a 3-variable truth table to find the equivalent Boolean expression
- HARD: Derive minimal expressions from complex tables, find logical equivalences
- **CRITICAL**: Always provide the truth table in the question. Ask students to READ/ANALYZE it, NOT to construct it
- Example: "Given the truth table below, which expression represents the output Y?"`,

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
- **solutionSteps**: 2-3 clear, simple steps showing the basic process

**MEDIUM Questions** (for mastery 40-69%):
- Multi-step reasoning required
- Application to new scenarios
- 3-variable expressions (A, B, C) → truth tables have 8 rows
- **The expression MUST use all 3 variables!** (e.g., Y = A'B + C, NOT Y = A' + B')
- Requires connecting concepts
- **solutionSteps**: 3-5 detailed steps showing intermediate calculations and reasoning

**HARD Questions** (for mastery ≥ 70%):
- Complex multi-step problems
- Synthesis of multiple concepts
- 3-4 variable expressions → truth tables have 8-16 rows
- **The expression MUST use all 3-4 variables!**
- Optimization and edge cases
- **solutionSteps**: 5-7 comprehensive steps with full mathematical derivations`;

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
    "inputs": ["A", "B", "C"],  // List all input variables
    "gates": [
      {
        "id": "G1",
        "type": "NOT",           // Gate types: NOT, AND, OR, NAND, NOR, XOR, XNOR
        "inputs": ["A"],         // Input(s) - can be input variables or outputs from other gates
        "output": "A_NOT",       // Unique identifier for this gate's output
        "position": {"x": 1, "y": 1}  // Grid position for layout (x=column, y=row)
      },
      {
        "id": "G2",
        "type": "AND",
        "inputs": ["A_NOT", "B"],  // Uses output from G1 and input B
        "output": "G2_OUT",
        "position": {"x": 2, "y": 1}
      },
      {
        "id": "G3",
        "type": "OR",
        "inputs": ["G2_OUT", "C"],  // Uses output from G2 and input C
        "output": "Y",              // Final output
        "position": {"x": 3, "y": 1}
      }
    ],
    "finalOutput": "Y",           // Must match the output of the last gate
    "caption": "Analyze the circuit to determine the Boolean expression for Y"
  }
}

**CIRCUIT DIAGRAM RULES:**
- **Gate Order**: Gates MUST be listed in topological order (dependencies first)
- **Input References**: Each gate's "inputs" array references either:
  - Original input variables (A, B, C, etc.)
  - Output identifiers from previous gates (e.g., "A_NOT", "G2_OUT")
- **Output Naming**: Use descriptive names like "A_NOT" for NOT gates, "G2_OUT" for intermediate outputs
- **Position Grid**: x=column (left to right), y=row (top to bottom). Space gates appropriately
- **Final Output**: Must be the output of the last gate in the signal path
- **Complexity Levels**:
  - EASY: 1-2 gates, single path (e.g., NOT→AND or just AND)
  - MEDIUM: 2-3 gates, may have parallel paths converging
  - HARD: 3-5 gates, multiple levels, parallel paths, requires careful tracing

**Example HARD Circuit** (3-variable, 4 gates):
{
  "type": "circuit",
  "circuit": {
    "inputs": ["A", "B", "C"],
    "gates": [
      {"id": "G1", "type": "NOT", "inputs": ["A"], "output": "A_NOT", "position": {"x": 1, "y": 0}},
      {"id": "G2", "type": "NOT", "inputs": ["B"], "output": "B_NOT", "position": {"x": 1, "y": 2}},
      {"id": "G3", "type": "AND", "inputs": ["A_NOT", "C"], "output": "G3_OUT", "position": {"x": 2, "y": 0}},
      {"id": "G4", "type": "OR", "inputs": ["G3_OUT", "B_NOT"], "output": "Y", "position": {"x": 3, "y": 1}}
    ],
    "finalOutput": "Y",
    "caption": "Determine the Boolean expression: Y = (A'·C) + B'"
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
    "_reasoning": "Internal verification of the correct answer (not shown to user)",
    "options": [
      {
        "id": "opt_a", 
        "text": "Option A", 
        "isCorrect": false, 
        "rationale": "Detailed explanation why this is WRONG. Point out the specific error or misconception."
      },
      {
        "id": "opt_b", 
        "text": "Option B", 
        "isCorrect": true, 
        "rationale": "Comprehensive explanation why this is CORRECT. Justify with mathematical reasoning, show verification, and connect to concepts."
      },
      {
        "id": "opt_c", 
        "text": "Option C", 
        "isCorrect": false, 
        "rationale": "Detailed explanation why this is WRONG. Identify the mistake made."
      },
      {
        "id": "opt_d", 
        "text": "Option D", 
        "isCorrect": false, 
        "rationale": "Detailed explanation why this is WRONG. Clarify the misconception."
      }
    ],
    "answerId": "opt_b",
    "solutionSteps": [
      "Step 1: [For Lessons 2-4] Begin with the given information or expression. State what we're solving for.",
      "Step 2: Show the first calculation or transformation. Be specific with values.",
      "Step 3: Continue with intermediate steps. Show ALL work, don't skip steps.",
      "Step 4: Apply relevant rules/laws/techniques (name them explicitly).",
      "Step 5: [If needed] Verify the result by substitution or alternative method.",
      "Final Step: State the answer clearly and connect it back to the question."
    ]
  }
]

⚠️ **CRITICAL REQUIREMENTS FOR solutionSteps AND rationale:**

**For solutionSteps (Lessons 2, 3, 4 - PROBLEM SOLVING):**
- **LESSON 2 (Logic Gates)**: 
  - Step 1: Identify the gate types and inputs
  - Step 2: Trace signal through first gate with specific values
  - Step 3: Show intermediate outputs
  - Step 4: Trace through subsequent gates
  - Step 5: Derive final expression or output
  - Example: "Apply NOT to A (1) → A' = 0", "AND gate: A'(0) AND B(1) = 0"

- **LESSON 3 (Truth Tables)**:
  - Step 1: Examine the provided truth table and identify the pattern
  - Step 2: Look at rows where output Y = 1 (identify minterms)
  - Step 3: Write the expression for each minterm (e.g., A'B'C for row where A=0, B=0, C=1 gives Y=1)
  - Step 4: Combine minterms with OR operations to form Sum of Products (SOP)
  - Step 5: Simplify if possible using Boolean laws
  - Step 6: Verify by checking the expression against the table
  - Example: "Rows with Y=1: [0,0,0], [0,1,1] → Minterms: A'B'C' + A'BC → Expression found"

- **LESSON 4 (Simplification & K-Maps)**:
  - Step 1: Write the original expression
  - Step 2: Identify groupings in K-map or applicable Boolean law
  - Step 3: Apply law/grouping (show explicitly: A + A'B = A + B by Absorption)
  - Step 4: Continue simplification with next law
  - Step 5: Verify by truth table or expansion
  - Example: "Group cells [1,3]: A'B' + A'B = A'(B'+B) = A'(1) = A'"

- **LESSON 1**: Can use simpler steps (2-3 steps) for conceptual questions

**For rationale (ALL OPTIONS):**
- **Correct option**: 3-4 sentences minimum
  - Sentence 1: State why it's correct
  - Sentence 2: Show mathematical verification
  - Sentence 3: Connect to underlying concept/rule
  - Sentence 4: Optional - relate to common applications

- **Incorrect options**: 2-3 sentences minimum
  - Sentence 1: Identify the specific error or misconception
  - Sentence 2: Explain what would be needed for this to be correct
  - Sentence 3: Optional - show correct calculation for comparison

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
