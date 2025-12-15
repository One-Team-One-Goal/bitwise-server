import { IsOptional, IsString, IsInt, IsArray, IsIn, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class FilterExamplesDto {
  @IsOptional()
  @IsIn(['beginner', 'intermediate', 'advanced'])
  difficulty?: string;

  @IsOptional()
  @IsIn(['simplification', 'distribution', 'logic', 'advanced'])
  category?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  variableCount?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

