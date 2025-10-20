import {
  Controller,
  Post,
  Body,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { CalculatorService } from './calculator.service';
import { SimplifyExpressionDto } from './dto/simplify-expression.dto';
import { CalculationResponse } from './interfaces/calculator.interface';

@Controller('calculator')
export class CalculatorController {
  private readonly logger = new Logger(CalculatorController.name);

  constructor(private readonly calculatorService: CalculatorService) {}

  @Post('simplify')
  async simplify(@Body() simplifyDto: SimplifyExpressionDto): Promise<CalculationResponse> {
    try {
      if (!simplifyDto.expression) {
        throw new HttpException(
          'Expression is required',
          HttpStatus.BAD_REQUEST,
        );
      }
      
      const result = await this.calculatorService.simplifyExpression(simplifyDto.expression);

      if (!result.success) {
        throw new HttpException(
          result.error || 'Simplification failed',
          HttpStatus.BAD_REQUEST,
        );
      }

      return result;
    } catch (error) {
      
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        'Internal server error during simplification',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('evaluate')
  async evaluate(
    @Body() body: { expression: string; variables: Record<string, boolean> }
  ): Promise<CalculationResponse> {
    try {
      if (!body.expression) {
        throw new HttpException(
          'Expression is required',
          HttpStatus.BAD_REQUEST,
        );
      }

      if (!body.variables) {
        throw new HttpException(
          'Variables are required',
          HttpStatus.BAD_REQUEST,
        );
      }

      const result = await this.calculatorService.evaluateExpression(
        body.expression,
        body.variables
      );

      if (!result.success) {
        throw new HttpException(
          result.error || 'Evaluation failed',
          HttpStatus.BAD_REQUEST,
        );
      }

      return result;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      this.logger.error('Error evaluating expression:', error);
      throw new HttpException(
        'Internal server error during evaluation',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('truth-table')
  async generateTruthTable(
    @Body() body: { expression: string }
  ): Promise<CalculationResponse> {
    try {
      if (!body.expression) {
        throw new HttpException(
          'Expression is required',
          HttpStatus.BAD_REQUEST,
        );
      }

      const result = await this.calculatorService.generateTruthTable(body.expression);

      if (!result.success) {
        throw new HttpException(
          result.error || 'Truth table generation failed',
          HttpStatus.BAD_REQUEST,
        );
      }

      return result;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      this.logger.error('Error generating truth table:', error);
      throw new HttpException(
        'Internal server error during truth table generation',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
