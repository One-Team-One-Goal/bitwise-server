import { Injectable } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { CreateTopicDto } from './dto/create-topic.dto';

@Injectable()
export class LessonsService {
  constructor(private prisma: PrismaService) {}

  // Create a new lesson
  async createLesson(title: string) {
    return this.prisma.lesson.create({
      data: {
        title
      }
    });
  }

  // Get all lessons with topics and their content blocks
  async getLessons() {
    return this.prisma.lesson.findMany({
      include: {
        topics: true
      }
    });
  }

  // Get a single lesson by ID
  async getLessonById(id: number) {
    return this.prisma.lesson.findUnique({
      where: { id },
      include: {
        topics: {
          orderBy: { id: 'asc' } // Order topics by id ascending
        }
      }
    });
  }

  // Update a lesson
  async updateLesson(id: number, title: string) {
    return this.prisma.lesson.update({
      where: { id },
      data: { title }
    });
  }

  // Delete a lesson
  async deleteLesson(id: number) {
    return this.prisma.lesson.delete({
      where: { id }
    });
  }

  async createTopic(createTopicDto: CreateTopicDto) {
    return this.prisma.topic.create({
      data: {
        title: createTopicDto.title,
        lessonId: createTopicDto.lessonId,
        tags: createTopicDto.tags ?? [],
        contentText: createTopicDto.contentText ?? '',
        displayContent: createTopicDto.displayContent,
      }
    });
  }

  async createTopics(topics: CreateTopicDto[]) {
    return this.prisma.topic.createMany({
      data: topics.map(topic => ({
        title: topic.title,
        lessonId: topic.lessonId,
        tags: topic.tags ?? [],
        contentText: topic.contentText ?? '',
        displayContent: topic.displayContent,
      })),
    });
  }

  // Get topics for a lesson
  async getTopicsForLesson(lessonId: number) {
    return this.prisma.topic.findMany({
      where: { lessonId }
    });
  }

  async getAllDisplayContentBlocks() {
    return this.prisma.topic.findMany({
      select: {
        id: true,
        displayContent: true
      }
    });
  }
}