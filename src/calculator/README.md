# Boolean Calculator Service

This service provides a TypeScript wrapper around the JavaScript boolean algebra calculator, preserving the original algorithm while providing type-safe integration with your NestJS application.

## Features

- **Expression Simplification**: Simplify boolean expressions with step-by-step explanations
- **Expression Evaluation**: Evaluate expressions with given variable values
- **Truth Table Generation**: Generate complete truth tables for expressions
- **Type Safety**: Full TypeScript interfaces and validation
- **Preserved Algorithm**: Original JavaScript logic untouched

## API Endpoints

### POST `/calculator/calculate`
General calculation endpoint that supports all operations.

**Request Body:**
```json
{
  "expression": "A ∧ B ∨ ¬A",
  "operation": "simplify",
  "variables": { "A": true, "B": false }
}
```

### POST `/calculator/simplify`
Simplify a boolean expression with steps.

**Request Body:**
```json
{
  "expression": "A ∧ A ∨ B"
}
```

**Response:**
```json
{
  "success": true,
  "result": {
    "originalExpression": "A ∧ A ∨ B",
    "simplifiedExpression": "A ∨ B",
    "steps": [
      {
        "expression": "A ∧ A ∨ B",
        "law": "Original",
        "lawName": "Original Expression"
      },
      {
        "expression": "A ∨ B",
        "law": "idempotent",
        "lawName": "Idempotent"
      }
    ],
    "isValid": true
  }
}
```

### POST `/calculator/evaluate`
Evaluate an expression with specific variable values.

**Request Body:**
```json
{
  "expression": "A ∧ B",
  "variables": { "A": true, "B": false }
}
```

**Response:**
```json
{
  "success": true,
  "result": false
}
```

### POST `/calculator/truth-table`
Generate a truth table for an expression.

**Request Body:**
```json
{
  "expression": "A ∧ B"
}
```

**Response:**
```json
{
  "success": true,
  "result": {
    "expression": "A ∧ B",
    "variables": ["A", "B"],
    "rows": [
      {
        "variables": { "A": false, "B": false },
        "result": false
      },
      {
        "variables": { "A": false, "B": true },
        "result": false
      },
      {
        "variables": { "A": true, "B": false },
        "result": false
      },
      {
        "variables": { "A": true, "B": true },
        "result": true
      }
    ]
  }
}
```

## Supported Boolean Operators

- **AND**: `∧`, `and`, `^`
- **OR**: `∨`, `or`, `v`
- **NOT**: `¬`, `~`, `-`, `!`, `not`
- **XOR**: `⊕`, `xor`
- **IMPLICATION**: `→`, `->`, `then`
- **BICONDITIONAL**: `↔`, `<->`

## Supported Laws

The calculator applies the following boolean algebra laws:

- **Identity**: `A ∧ T = A`, `A ∨ F = A`
- **Negation**: `A ∧ ¬A = F`, `A ∨ ¬A = T`
- **Double Negation**: `¬¬A = A`
- **Idempotent**: `A ∧ A = A`, `A ∨ A = A`
- **Universal Bound**: `A ∧ F = F`, `A ∨ T = T`
- **Commutative**: `A ∧ B = B ∧ A`, `A ∨ B = B ∨ A`
- **Associative**: `(A ∧ B) ∧ C = A ∧ (B ∧ C)`
- **Distributive**: `A ∧ (B ∨ C) = (A ∧ B) ∨ (A ∧ C)`
- **De Morgan's**: `¬(A ∧ B) = ¬A ∨ ¬B`, `¬(A ∨ B) = ¬A ∧ ¬B`
- **Absorption**: `A ∧ (A ∨ B) = A`, `A ∨ (A ∧ B) = A`

## Implementation Details

### Architecture
- **JavaScript VM Context**: Uses Node.js VM module to execute the original JavaScript code
- **Type Safety**: TypeScript interfaces ensure type safety at the API boundary
- **Error Handling**: Comprehensive error handling for invalid expressions
- **Security**: Input sanitization to prevent code injection

### File Structure
```
src/calculator/
├── calculator.module.ts          # NestJS module
├── calculator.service.ts         # Main service with JS wrapper
├── calculator.controller.ts      # REST API endpoints
├── dto/
│   └── calculate-expression.dto.ts
├── interfaces/
│   └── calculator.interface.ts
└── calculator.service.spec.ts    # Unit tests
```

## Usage in Frontend

Update your React calculator service to call these endpoints:

```typescript
// src/services/calculator.service.ts
export const calculatorService = {
  async simplify(expression: string) {
    const response = await api.post('/calculator/simplify', { expression });
    return response.data;
  },

  async evaluate(expression: string, variables: Record<string, boolean>) {
    const response = await api.post('/calculator/evaluate', { 
      expression, 
      variables 
    });
    return response.data;
  },

  async generateTruthTable(expression: string) {
    const response = await api.post('/calculator/truth-table', { expression });
    return response.data;
  }
};
```

## Testing

Run the tests to verify the service works correctly:

```bash
npm run test calculator.service.spec.ts
```

## Notes

- The original JavaScript algorithm is preserved completely
- All boolean algebra laws are applied automatically during simplification
- The service is stateless and thread-safe
- Error handling provides meaningful feedback for invalid expressions
- Input sanitization prevents security issues while maintaining functionality
