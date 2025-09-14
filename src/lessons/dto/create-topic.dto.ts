import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const CreateTopicSchema = z.object({
  title: z.string().min(1, "Title is required"),
  lessonId: z.number(),
  tags: z.array(z.string()).optional(),
  contentText: z.string().optional(),
  displayContent: z.any().optional(), // Accepts any JSON value
});

// Accepts an array of topics
export const CreateTopicsSchema = z.object({
  topics: z.array(CreateTopicSchema)
});

export class CreateTopicDto extends createZodDto(CreateTopicSchema) {}
export class CreateTopicsDto extends createZodDto(CreateTopicsSchema) {}