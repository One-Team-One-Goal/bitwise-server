import { IsString, IsOptional, IsObject, IsEnum } from 'class-validator';

export enum CalculationOperation {
  SIMPLIFY = 'simplify',
  EVALUATE = 'evaluate',
  TRUTH_TABLE = 'truthTable',
}

export class CalculateExpressionDto {
  @IsString()
  expression: string;

  @IsEnum(CalculationOperation)
  operation: CalculationOperation;

  @IsOptional()
  @IsObject()
  variables?: Record<string, boolean>;
}
