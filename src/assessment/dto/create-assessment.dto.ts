import { ApiProperty } from '@nestjs/swagger';

export class CreateAssessmentDto {
  @ApiProperty({ example: 1, description: 'Lesson ID for the assessment' })
  lessonId: number;

  @ApiProperty({ example: 1, description: 'User ID taking the assessment' })
  userId: number;

  @ApiProperty({ example: 'easy', description: 'Difficulty level (easy, medium, hard)' })
  difficulty: string;
}