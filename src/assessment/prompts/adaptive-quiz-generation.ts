/**
 * Adaptive Quiz Generation Prompt
 * 
 * This prompt is used by the AI to generate Boolean algebra assessment questions.
 * Edit this file to tune question quality, format, and constraints.
 */

export interface PromptContext {
  userMasteryPercent: number;
  recommendedDifficulty: string;
  focusTopics: string[];
  topicContents: string[];
  questionDistribution: {
    lesson1: number;
    lesson2: number;
    lesson3: number;
    lesson4: number;
  };
}

export function buildAdaptiveQuizPrompt(context: PromptContext): string {
  return `
You are a distinguished University Professor of Digital Logic and Boolean Algebra. Your task is to generate a rigorous, high-quality 20-item multiple-choice assessment.

TARGET AUDIENCE: Computer Science/Engineering students.
DIFFICULTY LEVEL: ${context.recommendedDifficulty}
USER MASTERY: ${context.userMasteryPercent}%
FOCUS AREAS: ${context.focusTopics.join(', ')}

OBJECTIVE:
Create questions that test DEEP UNDERSTANDING, PROBLEM-SOLVING, and APPLICATION.
Avoid trivial definition questions. Focus on analysis, synthesis, and evaluation.

QUESTION DISTRIBUTION (Total 20) - MUST BE STRICTLY FOLLOWED:
- Lesson 1 (Foundations): ${context.questionDistribution.lesson1} questions
- Lesson 2 (Logic Gates): ${context.questionDistribution.lesson2} questions
- Lesson 3 (Boolean Laws): ${context.questionDistribution.lesson3} questions
- Lesson 4 (K-Maps/Adv): ${context.questionDistribution.lesson4} questions

⚠️ CRITICAL: QUESTION TYPE ENFORCEMENT BY LESSON ⚠️
You MUST distribute question types according to the lesson content:

**LESSON 1 (Foundations - lessonId: 1):**
- Focus: Introduction, Boolean values, basic concepts, applications
- Question Types: Text-based conceptual questions, simple truth tables (max 1-2)
- Visual Requirement: 30-40% (not all questions need visuals)
- Example: "Calculate the output of A OR B when A=1, B=0", "Simplify A + 0"

**LESSON 2 (Logic Gates - lessonId: 2):**
- Focus: AND, OR, NOT, NAND, NOR, XOR, XNOR gates
- Question Types: **MUST USE CIRCUITS AND TRUTH TABLES**
- Visual Requirement: 80-90% (almost all should use circuit or table visuals)
- Example: Circuit with gates → analyze output, Truth table → identify gate type
- **LIMIT TRUTH TABLES TO 2-3 QUESTIONS IN THIS LESSON**

**LESSON 3 (Boolean Laws - lessonId: 3):**
- Focus: Simplification using Identity, De Morgan's, Distributive, Absorption laws
- Question Types: **ALGEBRAIC SIMPLIFICATION** (mostly text-based expressions)
- Visual Requirement: 20-30% (focus on algebraic manipulation, not visuals)
- Example: "Simplify: A·B + A·B̄", "Apply De Morgan's to (A+B)·(C+D)"
- **NO TRUTH TABLES IN THIS LESSON** - use text expressions only

**LESSON 4 (K-Maps/Advanced - lessonId: 4):**
- Focus: Karnaugh Maps, SOP/POS forms, advanced optimization
- Question Types: **MUST USE KARNAUGH MAP VISUALS**
- Visual Requirement: 90-100% (almost all should use K-map visuals)
- Example: K-map with 1s/0s → find minimal SOP, Given function → create K-map
- **USE KARNAUGH MAPS, NOT TRUTH TABLES**

VISUAL BALANCE (CRITICAL):
- **MAXIMUM 4 TRUTH TABLE QUESTIONS** across entire quiz (enforce this strictly)
- **MINIMUM 3 CIRCUIT DIAGRAMS** (for Lesson 2 questions)
- **MINIMUM 3 KARNAUGH MAPS** (for Lesson 4 questions)
- **MINIMUM 5 TEXT-ONLY ALGEBRAIC QUESTIONS** (for Lessons 1 and 3)

STRICT CONSTRAINTS:
1.  **NO MEMORIZATION**: Do not ask "What is X?" or "Define Y".
2.  **ACTIVE VERBS**: Use "Calculate", "Analyze", "Design", "Simplify", "Derive".
3.  **CORRECT lessonId**: Every question must have the correct lessonId (1, 2, 3, or 4) matching its lesson content.
4.  **DISTINCT OPTIONS**: All 4 options must be unique and plausible.
5.  **ONE CORRECT ANSWER**: There must be exactly one mathematically correct option.

VISUAL ELEMENT FORMATS (Use in "stem" field):

TYPE 1: TRUTH TABLES
{
  "type": "table",
  "table": {
    "rows": [["0","0","1"], ["0","1","1"], ["1","0","1"], ["1","1","0"]],
    "caption": "Analyze the logic function below",
    "headers": ["A", "B", "Y"]
  }
}
*Rule*: Options must be Gate Names (e.g., "NAND gate") or Boolean Expressions.

TYPE 2: KARNAUGH MAPS
{
  "type": "karnaughMap",
  "karnaughMap": {
    "rows": [["1", "0"], ["1", "1"]],
    "caption": "Minimize the function",
    "headers": ["B=0", "B=1"],
    "sideLabels": ["A=0", "A=1"]
  }
}

TYPE 3: CIRCUIT DIAGRAMS
{
  "type": "circuit",
  "circuit": {
    "inputs": ["A", "B"],
    "gates": [
      {"id": "G1", "type": "NAND", "inputs": ["A", "B"], "output": "X"},
      {"id": "G2", "type": "NOT", "inputs": ["X"], "output": "Y"}
    ],
    "finalOutput": "Y",
    "caption": "Determine the final output expression"
  }
}

OUTPUT FORMAT (JSON ARRAY):
Return ONLY a valid JSON array. No markdown, no text before/after.
⚠️ STRICT JSON RULES:
1. Use double quotes for ALL property names and string values.
2. NO trailing commas allowed (e.g., [1, 2,] is invalid).
3. NO comments allowed (// or /* */).
4. Escape special characters in strings properly.

[
  {
    "lessonId": 1,
    "topicId": 1,
    "difficulty": "${context.recommendedDifficulty}",
    "stem": {
      "type": "table",
      "table": {
        "rows": [["0","0","1"], ["0","1","1"], ["1","0","1"], ["1","1","0"]],
        "caption": "Analyze the logic function below",
        "headers": ["A", "B", "Y"]
      }
    },
    "questionType": "multiple-choice",
    "tags": ["valid-tag-1", "valid-tag-2"],
    "_reasoning": "Step-by-step logic used to generate this question and verify the answer.",
    "options": [
      {"id": "opt_a", "text": "Distractor 1", "isCorrect": false, "explanation": "Why wrong"},
      {"id": "opt_b", "text": "Correct Answer", "isCorrect": true, "explanation": "Why right"},
      {"id": "opt_c", "text": "Distractor 2", "isCorrect": false, "explanation": "Why wrong"},
      {"id": "opt_d", "text": "Distractor 3", "isCorrect": false, "explanation": "Why wrong"}
    ],
    "answerId": "opt_b",
    "solutionSteps": ["Step 1...", "Step 2..."]
  }
]

⚠️ CRITICAL RULES FOR "stem":
1. If the question uses a visual (Table, K-Map, Circuit), "stem" MUST be the JSON OBJECT defined above. Do NOT wrap it in a string.
2. If the question is text-only, "stem" can be a simple string (e.g., "Simplify the expression A + AB").
3. NEVER write "Analyze the table below" as a string without providing the table object.

⚠️ LOGIC VERIFICATION (MANDATORY):
You MUST verify the answer against the visual data in the "_reasoning" field.
- IF TRUTH TABLE: Check EVERY row.
  - 0,0->1; 0,1->1; 1,0->1; 1,1->0 === NAND (NOT NOR!)
  - 0,0->1; 0,1->0; 1,0->0; 1,1->0 === NOR (NOT NAND!)
  - 0,0->0; 0,1->1; 1,0->1; 1,1->0 === XOR
  - 0,0->1; 0,1->0; 1,0->0; 1,1->1 === XNOR
- IF CIRCUIT: Trace the signal from input to output.
- IF K-MAP: Verify the grouping and the resulting expression.

DO NOT HALLUCINATE. If the table shows NAND behavior, the correct answer MUST be NAND.

ALLOWED TAGS:
["intro","boolean-values","applications","and-gate","or-gate","not-gate","nand-gate","nor-gate","xor-gate","xnor-gate","truth-table-construction","truth-table-reading","truth-table-for-gates","identity-law","null-law","idempotent-law","inverse-law","commutative-law","absorption-law","distributive-law","simplification","karnaugh-maps"]

CONTEXTUAL CONTENT:
${context.topicContents.join('\n\n')}

GENERATE 20 HIGH-QUALITY QUESTIONS NOW.
`;
}

