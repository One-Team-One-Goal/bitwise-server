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
}

export function buildAdaptiveQuizPrompt(context: PromptContext): string {
  return `
You are an advanced adaptive learning assistant. Generate a 20-item multiple-choice quiz with ${context.recommendedDifficulty} difficulty level focused EXCLUSIVELY on PROBLEM-SOLVING and APPLICATION of knowledge.

CURRENT USER CONTEXT:
- User mastery level: ${context.userMasteryPercent}%
- Recommended difficulty: ${context.recommendedDifficulty}
- Focus areas: ${context.focusTopics.join(', ')}

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
    "caption": "Analyze the logic function below",
    "headers": ["Input A", "Input B", "Output Y"]
  }
}

CRITICAL TRUTH TABLE RULES:
- NEVER reveal the gate type in the caption (e.g., don't say "NAND Gate Truth Table")
- Use neutral captions: "Analyze the logic function below", "Given the following logic behavior"
- The question should ask students to IDENTIFY the gate or derive the expression
- Options must be GATE NAMES (AND, OR, NAND, NOR, XOR, XNOR) or Boolean expressions, NOT random algebra

⚠️ TRUTH TABLE VERIFICATION CHECKLIST (MANDATORY):
Before finalizing any truth table question, VERIFY the correct answer by analyzing each row:
- AND gate: Output is 1 ONLY when ALL inputs are 1 (example: 00→0, 01→0, 10→0, 11→1)
- OR gate: Output is 1 when ANY input is 1 (example: 00→0, 01→1, 10→1, 11→1)
- NAND gate: Output is 0 ONLY when ALL inputs are 1 (example: 00→1, 01→1, 10→1, 11→0)
- NOR gate: Output is 1 ONLY when ALL inputs are 0 (example: 00→1, 01→0, 10→0, 11→0)
- XOR gate: Output is 1 when inputs are DIFFERENT (example: 00→0, 01→1, 10→1, 11→0)
- XNOR gate: Output is 1 when inputs are SAME (example: 00→1, 01→0, 10→0, 11→1)

EXAMPLE TRUTH TABLE QUESTION (CORRECT):
Truth table rows: ["0","0","1"], ["0","1","1"], ["1","0","1"], ["1","1","0"]
Analysis: Output is 1 in first 3 rows (when NOT both inputs are 1), so this is NAND gate.
✅ Correct option: "NAND gate"
❌ WRONG options to avoid: Random Boolean expressions like "A·B + C" that don't match the table

For truth table identification questions:
- Options MUST be gate names: "AND gate", "OR gate", "NAND gate", "NOR gate", "XOR gate", "XNOR gate"
- OR Boolean expressions that match the truth table behavior
- NEVER use random algebra expressions as options

SELF-CHECK BEFORE OUTPUT:
- Ensure EXACTLY one option has "isCorrect": true
- For truth tables: manually verify the gate type from the rows and ensure correct option matches
- If the truth table shows NAND (00→1,01→1,10→1,11→0), the correct answer MUST be "NAND gate" or equivalent expression
- If any validation fails, REGENERATE INTERNALLY before output

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
      {
        "id": "G1",
        "type": "AND",
        "inputs": ["A", "B"],
        "output": "X"
      },
      {
        "id": "G2",
        "type": "NOT",
        "inputs": ["C"],
        "output": "Y"
      },
      {
        "id": "G3",
        "type": "OR",
        "inputs": ["X", "Y"],
        "output": "Z"
      }
    ],
    "finalOutput": "Z",
    "caption": "Analyze the circuit configuration shown above."
  }
}

ANSWER OPTIONS REQUIREMENTS

CRITICAL RULES:
1. Exactly 3-4 options per question (prefer 4 for problem-solving questions)
2. ONLY ONE CORRECT ANSWER - verify this rigorously
3. RANDOMIZE the position of the correct answer (don't always put it in position A or D)
4. Each option must be DISTINCTLY different - no duplicate logic or equivalent answers
5. Distractors must represent common student errors or misconceptions
6. All options should be plausible at first glance

EXAMPLE OF BAD OPTIONS (DON'T DO THIS):
❌ For a truth table question, do NOT use random Boolean expressions as options
❌ A. A·B + C
❌ B. AB + C  [Same as A - just different notation]
❌ C. (A AND B) OR C  [Same as A - just different format]

EXAMPLE OF GOOD OPTIONS FOR TRUTH TABLE:
✅ A. AND gate
✅ B. OR gate
✅ C. NAND gate  [This is correct for 00→1,01→1,10→1,11→0]
✅ D. NOR gate

REQUIRED JSON FORMAT

Each question MUST follow this exact structure:
{
  "lessonId": 1,
  "topicId": 1,
  "difficulty": "${context.recommendedDifficulty}",
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
  ]
}

⚠️ CRITICAL: DO NOT include "sourcePassages" field - it is not needed and causes errors

PROBLEM-SOLVING QUESTION TEMPLATES

EASY DIFFICULTY:
- "Given the circuit above with inputs A=1, B=0, what is the output?"
- "Simplify the expression: A·A + B"
- "Which logic gate does the truth table represent?"
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
- Basic truth tables (2-3 variables) asking for gate identification
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

${context.topicContents.join('\n\n')}

FINAL INSTRUCTIONS

1. Generate EXACTLY 20 questions
2. Each question MUST require problem-solving, not memorization
3. Verify each question has ONLY ONE correct answer
4. Randomize correct answer positions across all questions
5. Use visual elements (tables, K-maps, circuits) for at least 50% of questions
6. Never reveal answers in captions or question stems
7. Make distractors represent realistic student errors
8. Ensure all options are genuinely distinct
9. FOR TRUTH TABLES: Options must be gate names or matching Boolean expressions, NOT random algebra

CRITICAL OUTPUT FORMAT REQUIREMENTS:
⚠️ Your response MUST be a valid JSON array starting with [ and ending with ]
⚠️ Do NOT wrap the JSON in markdown code blocks (no \`\`\`json)
⚠️ Do NOT include any explanatory text before or after the JSON
⚠️ The response must be ONLY the JSON array, nothing else
⚠️ Ensure proper JSON syntax: all strings in double quotes, no trailing commas

Example of CORRECT output format:
[
  {
    "lessonId": 2,
    "topicId": 8,
    "difficulty": "${context.recommendedDifficulty}",
    "stem": {
      "type": "table",
      "table": {
        "rows": [["0","0","1"],["0","1","1"],["1","0","1"],["1","1","0"]],
        "caption": "Analyze the logic function below",
        "headers": ["Input A", "Input B", "Output Y"]
      }
    },
    "options": [
      {"id": "opt_a", "text": "AND gate", "isCorrect": false, "explanation": "Incorrect - AND outputs 1 only when all inputs are 1"},
      {"id": "opt_b", "text": "NAND gate", "isCorrect": true, "explanation": "Correct - Output is 1 except when both inputs are 1"},
      {"id": "opt_c", "text": "OR gate", "isCorrect": false, "explanation": "Incorrect - OR would have 0 only in first row"},
      {"id": "opt_d", "text": "NOR gate", "isCorrect": false, "explanation": "Incorrect - NOR outputs 1 only when all inputs are 0"}
    ],
    "answerId": "opt_b",
    "solutionSteps": ["Analyze each row", "NAND is opposite of AND", "Verify: 00→1, 01→1, 10→1, 11→0"]
  },
  ...19 more questions...
]

START YOUR RESPONSE WITH [ AND END WITH ] - NOTHING ELSE
`;
}
