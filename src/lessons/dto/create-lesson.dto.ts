import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';

export const CreateLessonDtoSchema = z.object({
  title: z.string().min(1, 'Lesson title is required'),
});

export class CreateLessonDto {
  @ApiProperty({ example: 'Introduction to Boolean Algebra' })
  title: string;
}