/**
 * Script to populate BooleanExample table with existing examples from frontend
 * Usage: npx tsx scripts/populate-examples.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Helper to extract variables from expression
function extractVariables(expr: string): string[] {
  const matches = expr.match(/[A-Z]/g) || [];
  return [...new Set(matches)].filter(v => v !== 'T' && v !== 'F').sort();
}

// All 20 examples from calculatorExamples.ts
const examples = [
  // ========== BEGINNER ==========
  {
    title: 'Double Negation Basics',
    expression: '¬¬A',
    difficulty: 'beginner',
    description: 'Learn how double negations cancel out',
    lawsUsed: ['doubleNegation'],
    learningFocus: 'Understanding double negation elimination',
    category: 'simplification',
    tags: ['negation', 'basics'],
    sortOrder: 1,
  },
  {
    title: 'Identity Elements',
    expression: '(A ∧ T) ∨ F',
    difficulty: 'beginner',
    description: 'See how T and F identities work',
    lawsUsed: ['identity'],
    learningFocus: 'Understanding identity law with T and F',
    category: 'simplification',
    tags: ['identity', 'constants'],
    sortOrder: 2,
  },
  {
    title: 'Simple Contradiction',
    expression: 'A ∧ ¬A',
    difficulty: 'beginner',
    description: 'A variable AND its negation always equals False',
    lawsUsed: ['negation'],
    learningFocus: 'Understanding contradictions',
    category: 'logic',
    tags: ['negation', 'contradiction'],
    sortOrder: 3,
  },
  {
    title: 'Simple Tautology',
    expression: 'B ∨ ¬B',
    difficulty: 'beginner',
    description: 'A variable OR its negation always equals True',
    lawsUsed: ['negation'],
    learningFocus: 'Understanding tautologies',
    category: 'logic',
    tags: ['negation', 'tautology'],
    sortOrder: 4,
  },

  // ========== INTERMEDIATE ==========
  {
    title: 'Factoring Common Terms',
    expression: '(A ∨ B) ∧ (A ∨ ¬B)',
    difficulty: 'intermediate',
    description: 'Factor out A, then simplify the negation',
    lawsUsed: ['distributive', 'negation', 'identity'],
    learningFocus: 'Using distribution to factor common terms',
    category: 'distribution',
    tags: ['factoring', 'distribution', 'classic'],
    sortOrder: 10,
  },
  {
    title: 'De Morgan\'s in Action',
    expression: '¬(A ∧ B) ∨ (A ∧ B)',
    difficulty: 'intermediate',
    description: 'Apply De Morgan\'s law then recognize a tautology',
    lawsUsed: ['deMorgans', 'negation'],
    learningFocus: 'De Morgan\'s Law transformation',
    category: 'logic',
    tags: ['demorgans', 'negation'],
    sortOrder: 11,
  },
  {
    title: 'Absorption Pattern',
    expression: 'X ∨ (X ∧ Y)',
    difficulty: 'intermediate',
    description: 'See how X absorbs the redundant AND term',
    lawsUsed: ['absorption'],
    learningFocus: 'Understanding absorption law',
    category: 'simplification',
    tags: ['absorption', 'redundancy'],
    sortOrder: 12,
  },
  {
    title: 'Idempotent Duplicates',
    expression: '(A ∨ B) ∨ (A ∨ B)',
    difficulty: 'intermediate',
    description: 'Remove duplicate terms using idempotent law',
    lawsUsed: ['idempotent'],
    learningFocus: 'Eliminating duplicates',
    category: 'simplification',
    tags: ['idempotent', 'duplicates'],
    sortOrder: 13,
  },
  {
    title: 'Triple Negation',
    expression: '¬¬¬A ∨ B',
    difficulty: 'intermediate',
    description: 'Multiple negations simplify step by step',
    lawsUsed: ['doubleNegation'],
    learningFocus: 'Repeated negation elimination',
    category: 'simplification',
    tags: ['negation', 'multi-step'],
    sortOrder: 14,
  },

  // ========== ADVANCED ==========
  {
    title: 'De Morgan + Distribution',
    expression: '¬(A ∧ B) ∧ (A ∨ C)',
    difficulty: 'advanced',
    description: 'Apply De Morgan\'s, then distribute and simplify',
    lawsUsed: ['deMorgans', 'distributive', 'negation', 'identity'],
    learningFocus: 'Combining De Morgan\'s with distribution',
    category: 'advanced',
    tags: ['demorgans', 'distribution', 'complex'],
    sortOrder: 20,
  },
  {
    title: 'Complex Factoring',
    expression: '(A ∧ B) ∨ (A ∧ C) ∨ (A ∧ D)',
    difficulty: 'advanced',
    description: 'Factor out A from multiple terms',
    lawsUsed: ['distributive', 'associative'],
    learningFocus: 'Multi-term factoring',
    category: 'distribution',
    tags: ['factoring', 'multi-term'],
    sortOrder: 21,
  },
  {
    title: 'Nested De Morgan\'s',
    expression: '¬(¬A ∨ ¬B)',
    difficulty: 'advanced',
    description: 'De Morgan\'s followed by double negation',
    lawsUsed: ['deMorgans', 'doubleNegation'],
    learningFocus: 'Nested negations with De Morgan\'s',
    category: 'logic',
    tags: ['demorgans', 'nested', 'negation'],
    sortOrder: 22,
  },
  {
    title: 'Universal Bound Domination',
    expression: '(A ∨ B ∨ C) ∧ F',
    difficulty: 'advanced',
    description: 'See how False dominates the entire expression',
    lawsUsed: ['universalBound'],
    learningFocus: 'Understanding domination by constants',
    category: 'simplification',
    tags: ['universal-bound', 'domination'],
    sortOrder: 23,
  },
  {
    title: 'Distribution Expansion',
    expression: 'X ∧ (Y ∨ Z ∨ W)',
    difficulty: 'advanced',
    description: 'Distribute AND over multiple OR terms',
    lawsUsed: ['distributive', 'associative'],
    learningFocus: 'Distribution with multiple terms',
    category: 'distribution',
    tags: ['distribution', 'expansion'],
    sortOrder: 24,
  },
  {
    title: 'Absorption + Identity',
    expression: '(P ∨ (P ∧ Q)) ∧ T',
    difficulty: 'advanced',
    description: 'Combine absorption and identity laws',
    lawsUsed: ['absorption', 'identity'],
    learningFocus: 'Multiple law application',
    category: 'simplification',
    tags: ['absorption', 'identity', 'combo'],
    sortOrder: 25,
  },

  // ========== XOR EXAMPLES ==========
  {
    title: 'Basic XOR Expansion',
    expression: '(A ⊕ B) ∧ (¬A ∨ C)',
    difficulty: 'intermediate',
    description: 'XOR expands then distributes with the second term',
    lawsUsed: ['xor', 'distributive', 'associative'],
    learningFocus: 'Understanding XOR expansion and distribution',
    category: 'logic',
    tags: ['xor', 'distribution', 'expansion'],
    sortOrder: 15,
  },
  {
    title: 'Nested XOR Operations',
    expression: '(A ∨ B) ⊕ (C ∧ D)',
    difficulty: 'advanced',
    description: 'XOR with compound operands - expands to complex AND/OR form',
    lawsUsed: ['xor', 'distributive', 'deMorgans'],
    learningFocus: 'XOR with complex expressions',
    category: 'advanced',
    tags: ['xor', 'nested', 'complex'],
    sortOrder: 26,
  },
  {
    title: 'Associative XOR Chain',
    expression: 'A ⊕ (B ⊕ C)',
    difficulty: 'advanced',
    description: 'Multiple XOR operations showing associative property',
    lawsUsed: ['xor', 'associative', 'distributive'],
    learningFocus: 'Chained XOR simplification',
    category: 'logic',
    tags: ['xor', 'associative', 'chain'],
    sortOrder: 27,
  },
  {
    title: 'XOR with Common Terms',
    expression: '(A ∧ B) ⊕ (A ∧ ¬C)',
    difficulty: 'advanced',
    description: 'XOR can factor out common terms for simplification',
    lawsUsed: ['xor', 'distributive', 'absorption'],
    learningFocus: 'Factoring in XOR expressions',
    category: 'advanced',
    tags: ['xor', 'factoring', 'optimization'],
    sortOrder: 28,
  },
  {
    title: 'Compound XOR Expression',
    expression: '(A ⊕ B) ∨ (C ⊕ D)',
    difficulty: 'advanced',
    description: 'Multiple XOR operations combined with OR',
    lawsUsed: ['xor', 'distributive', 'associative'],
    learningFocus: 'Complex XOR combinations',
    category: 'advanced',
    tags: ['xor', 'compound', 'multiple'],
    sortOrder: 29,
  },
];

async function main() {
  console.log('🚀 Starting Boolean Examples population...\n');

  let created = 0;
  let skipped = 0;
  let errors = 0;

  for (const example of examples) {
    try {
      // Extract variables
      const actualVariables = extractVariables(example.expression);
      const variableCount = actualVariables.length;

      // Check if already exists
      const existing = await prisma.booleanExample.findUnique({
        where: { expression: example.expression },
      });

      if (existing) {
        console.log(`⏭️  Skipping "${example.title}" (already exists)`);
        skipped++;
        continue;
      }

      // Create example
      await prisma.booleanExample.create({
        data: {
          ...example,
          actualVariables,
          variableCount,
          isActive: true,
        },
      });

      console.log(
        `✅ Created "${example.title}" (${variableCount} vars: ${actualVariables.join(', ')})`
      );
      created++;
    } catch (error: any) {
      console.error(`❌ Error creating "${example.title}":`, error.message);
      errors++;
    }
  }

  console.log('\n📊 Summary:');
  console.log(`   ✅ Created: ${created}`);
  console.log(`   ⏭️  Skipped: ${skipped}`);
  console.log(`   ❌ Errors: ${errors}`);
  console.log(`   📦 Total: ${examples.length}`);
}

main()
  .catch((e) => {
    console.error('💥 Fatal error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
