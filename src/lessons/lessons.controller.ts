import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { LessonsService } from './lessons.service';
import { ApiBody, ApiTags } from '@nestjs/swagger';
import { CreateTopicDto, CreateTopicsDto } from './dto/create-topic.dto';

@ApiTags('lessons')
@Controller('lessons')
export class LessonsController {
  constructor(private readonly lessonsService: LessonsService) {}

  @Post()
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string', example: 'Introduction to Boolean Algebra' }
      },
      required: ['title']
    }
  })
  async createLesson(@Body('title') title: string) {
    return this.lessonsService.createLesson(title);
  }

  @Get()
  async getLessons() {
    return this.lessonsService.getLessons();
  }

  @Get(':id')
  async getLessonById(@Param('id') id: string) {
    return this.lessonsService.getLessonById(Number(id));
  }

  @Patch(':id')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string', example: 'Updated Lesson Title' }
      },
      required: ['title']
    }
  })
  async updateLesson(@Param('id') id: string, @Body('title') title: string) {
    return this.lessonsService.updateLesson(Number(id), title);
  }

  @Delete(':id')
  async deleteLesson(@Param('id') id: string) {
    return this.lessonsService.deleteLesson(Number(id));
  }

  @Post('topics')
  @ApiBody({ type: CreateTopicDto })
  async createTopic(@Body() createTopicDto: CreateTopicDto) {
    return this.lessonsService.createTopic(createTopicDto);
  }

  @Post('topics/bulk')
  @ApiBody({ schema: {
    type: 'object',
    properties: {
      topics: { type: 'array', items: { $ref: '#/components/schemas/CreateTopicDto' } }
    },
    required: ['topics']
  }})
  async createTopics(@Body() body: { topics: CreateTopicDto[] }) {
    return this.lessonsService.createTopics(body.topics);
  }
  
  @Get(':id/topics')
  async getTopicsForLesson(@Param('id') lessonId: string) {
    return this.lessonsService.getTopicsForLesson(Number(lessonId));
  }

  @Get('display-content/blocks')
  async getAllDisplayContentBlocks() {
    return this.lessonsService.getAllDisplayContentBlocks();
  }
}