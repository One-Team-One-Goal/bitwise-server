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

      this.logger.log(`Simplifying: ${simplifyDto.expression}`);
      
      const result = await this.calculatorService.simplifyExpression(simplifyDto.expression);

      if (!result.success) {
        throw new HttpException(
          result.error || 'Simplification failed',
          HttpStatus.BAD_REQUEST,
        );
      }

      return result;
    } catch (error) {
      this.logger.error('Error in simplify endpoint:', error);
      
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        'Internal server error during simplification',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
