import { ApiProperty } from '@nestjs/swagger';

export class SubmitAttemptDto {
  @ApiProperty({ example: 1, description: 'Attempt ID' })
  attemptId: number;

  @ApiProperty({
    example: [
      { questionId: 1, chosenOption: 'opt_a', isCorrect: false },
      { questionId: 2, chosenOption: 'opt_b', isCorrect: true }
    ],
    description: 'Array of responses for the attempt'
  })
  responses: Array<{
    questionId: number;
    chosenOption: string;
    isCorrect: boolean;
  }>;
}