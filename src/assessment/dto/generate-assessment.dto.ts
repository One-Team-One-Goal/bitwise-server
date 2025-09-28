import { ApiProperty } from '@nestjs/swagger';

export class GenerateQuizDto {
  @ApiProperty({ example: 'Boolean algebra basics', description: 'Topic content text' })
  lessonContent: string;

  @ApiProperty({ example: 'easy', description: 'Difficulty level' })
  difficulty: string;

  @ApiProperty({ example: ['definition', 'application'], description: 'Allowed tags for questions' })
  allowedTags: string[];
}