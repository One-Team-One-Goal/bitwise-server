import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { AssessmentService } from './assessment.service';
import { CreateAssessmentDto } from './dto/create-assessment.dto';
import { UpdateAssessmentDto } from './dto/update-assessment.dto';
import { LessonsService } from 'src/lessons/lessons.service';

@Controller('assessment')
export class AssessmentController {
  constructor(private readonly assessmentService: AssessmentService,
              private readonly lessonsService: LessonsService
  ) {}

  @Post()
  create(@Body() createAssessmentDto: CreateAssessmentDto) {
    return this.assessmentService.create(createAssessmentDto);
  }

  @Get()
  findAll() {
    return this.assessmentService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.assessmentService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateAssessmentDto: UpdateAssessmentDto) {
    return this.assessmentService.update(+id, updateAssessmentDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.assessmentService.remove(+id);
  }

  @Post('generate-quiz')
  async generateQuiz(@Body() body: { topic?: string }) {
    const lessonContent = "Boolean algebra is a branch of mathematics that deals with variables that have two possible values: true or false. The basic operations are AND, OR, and NOT.";
    const topic = body?.topic ?? "Boolean Algebra";
    const difficulty = "EASY";
    const allowedTags = [
      "intro",                 
      "boolean-values",        
      "applications",         
      "and-gate", "or-gate", "not-gate",         
      "nand-gate", "nor-gate",                   
      "xor-gate", "xnor-gate",                
      "truth-table-construction",              
      "truth-table-reading",               
      "identity-law","null-law","idempotent-law",
      "inverse-law","commutative-law","associative-law",
      "distributive-law","absorption-law","demorgan-law", 
      "kmap-2var","kmap-3var","kmap-4var",
      "simplification-practice"
    ];
    return await this.assessmentService.generateQuiz(lessonContent, difficulty, allowedTags);
  }
}
