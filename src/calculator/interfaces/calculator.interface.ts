export interface BooleanExpression {
  toString(): string;
  equals(object: any): boolean;
  clone(): BooleanExpression;
  evaluate(variableStates: Record<string, boolean>): boolean;
}

export interface SimplificationStep {
  expression: string;
  law: string;
  lawName: string;
}

export interface SimplificationResult {
  originalExpression: string;
  simplifiedExpression: string;
  steps: SimplificationStep[];
  isValid: boolean;
}

// Token/script types for UI animation
export interface ScriptToken {
  id: string;
  text: string;
  kind: 'var' | 'op' | 'paren' | 'other';
  // optional UI flags
  isNew?: boolean;
  highlight?: boolean;
}

export interface ScriptExpressionState {
  raw: string;
  tokens: ScriptToken[];
}

export interface ScriptStep {
  id: string;
  law?: string;
  description?: string;
  before: ScriptExpressionState;
  after: ScriptExpressionState;
}

export interface FactoringDirectionScript {
  defaultExpression: string;
  steps: ScriptStep[];
}

export interface CalculationRequest {
  expression: string;
  operation: 'simplify' | 'evaluate' | 'truthTable';
  variables?: Record<string, boolean>;
}

export interface CalculationResponse {
  success: boolean;
  // result may be the legacy simplification result, a boolean (evaluation), or a tokenized script
  result: SimplificationResult | FactoringDirectionScript | boolean | any;
  error?: string;
}
