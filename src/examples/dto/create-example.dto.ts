import { 
  IsString, 
  IsInt, 
  IsArray, 
  IsOptional, 
  IsBoolean,
  IsIn,
  Min, 
  Max 
} from 'class-validator';

export class CreateExampleDto {
  @IsString()
  title: string;

  @IsString()
  expression: string;

  @IsString()
  description: string;

  @IsString()
  learningFocus: string;

  @IsIn(['beginner', 'intermediate', 'advanced'])
  difficulty: string;

  @IsIn(['simplification', 'distribution', 'logic', 'advanced'])
  category: string;

  @IsInt()
  @Min(1)
  @Max(5)
  variableCount: number;

  @IsArray()
  @IsString({ each: true })
  lawsUsed: string[];

  @IsArray()
  @IsString({ each: true })
  tags: string[];

  @IsArray()
  @IsString({ each: true })
  actualVariables: string[];

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

