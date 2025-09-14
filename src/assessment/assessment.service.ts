import { Injectable } from '@nestjs/common';
import { CreateAssessmentDto } from './dto/create-assessment.dto';
import { UpdateAssessmentDto } from './dto/update-assessment.dto';
import { firstValueFrom } from 'rxjs';
import axios from 'axios';
import { groq } from '@ai-sdk/groq';
import { generateText } from 'ai';

@Injectable()
export class AssessmentService {
  httpService: any;
  create(createAssessmentDto: CreateAssessmentDto) {
    return 'This action adds a new assessment';
  }

  findAll() {
    return `This action returns all assessment`;
  }

  findOne(id: number) {
    return `This action returns a #${id} assessment`;
  }

  update(id: number, updateAssessmentDto: UpdateAssessmentDto) {
    return `This action updates a #${id} assessment`;
  }

  remove(id: number) {
    return `This action removes a #${id} assessment`;
  }

  async extractJsonArray(text: string): Promise<any> {
    // Try to find a JSON array inside the response
    const jsonArrayMatch = text.match(/```json\s*([\s\S]*?)```/i) || text.match(/(\[\s*{[\s\S]*}\s*\])/);
    let jsonString = '';

    if (jsonArrayMatch) {
      jsonString = jsonArrayMatch[1] || jsonArrayMatch[0];
    } else {
      // Fallback: try to find the first array in the text
      const arrayStart = text.indexOf('[');
      const arrayEnd = text.lastIndexOf(']');
      if (arrayStart !== -1 && arrayEnd !== -1) {
        jsonString = text.substring(arrayStart, arrayEnd + 1);
      }
    }

    try {
      return JSON.parse(jsonString);
    } catch (err) {
      return { raw: text, error: "Could not parse response as JSON.", details: err.message };
    }
  }

  async generateQuiz(lessonContent: string, difficulty: string, allowedTags: string[]) {
    const prompt = `
      You are an adaptive learning assistant. Based only on the following lesson content, generate 5 quiz questions for the lesson "${lessonContent}".
      - Difficulty must be "${difficulty}".
      - Tags MUST ONLY come from this allowed list: [${allowedTags.join(", ")}].
      - Do not invent or add any other tags outside this list.
      - If a question does not match any allowed tag, do not generate it.

      Each question should follow this exact JSON format:
      {
        "difficulty": "${difficulty}",
        "cognitiveLevel": "recall|apply|analyze|evaluate",
        "stem": "Question text here",
        "questionType": "multiple-choice",
        "tags": ["tag1", "tag2"],   // strictly from the allowedTags list
        "options": [
          {
            "id": "opt_a",
            "text": "Option text",
            "isCorrect": true|false,
            "explanation": "Explanation text"
          }
        ],
        "answerId": "opt_a",
        "solutionSteps": ["Step 1", "Step 2"],
        "sourcePassages": ["Relevant passage from lesson"]
      }

      Lesson Content: ${lessonContent}
      Return a JSON array of 5 such questions, valid JSON only, no extra text.
    `;

    const { text } = await generateText({
      model: groq("llama-3.1-8b-instant"),
      prompt,
    });
    return this.extractJsonArray(text);
  }

}
