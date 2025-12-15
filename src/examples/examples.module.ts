import { Module } from '@nestjs/common';
import { ExamplesController } from './examples.controller';
import { ExamplesService } from './examples.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { CalculatorModule } from '../calculator/calculator.module';

@Module({
  imports: [PrismaModule, CalculatorModule],
  controllers: [ExamplesController],
  providers: [ExamplesService],
  exports: [ExamplesService],
})
export class ExamplesModule {}
