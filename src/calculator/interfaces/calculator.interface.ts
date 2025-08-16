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

export interface CalculationRequest {
  expression: string;
  operation: 'simplify' | 'evaluate' | 'truthTable';
  variables?: Record<string, boolean>;
}

export interface CalculationResponse {
  success: boolean;
  result: SimplificationResult | boolean | any;
  error?: string;
}
