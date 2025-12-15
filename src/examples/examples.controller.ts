import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ExamplesService } from './examples.service';
import { CreateExampleDto } from './dto/create-example.dto';
import { FilterExamplesDto } from './dto/filter-examples.dto';

@Controller('examples')
export class ExamplesController {
  private readonly logger = new Logger(ExamplesController.name);

  constructor(private readonly examplesService: ExamplesService) {}

  /**
   * GET /examples
   * Get all examples with optional filtering
   */
  @Get()
  async findAll(@Query() filters: FilterExamplesDto) {
    this.logger.debug(`GET /examples with filters: ${JSON.stringify(filters)}`);
    return this.examplesService.findAll(filters);
  }

  /**
   * GET /examples/random
   * Get a random example (must be before /:id route)
   */
  @Get('random')
  async findRandom(@Query() filters: Partial<FilterExamplesDto>) {
    this.logger.debug(`GET /examples/random with filters: ${JSON.stringify(filters)}`);
    return this.examplesService.findRandom(filters);
  }

  /**
   * GET /examples/:id
   * Get a single example by ID
   */
  @Get(':id')
  async findOne(@Param('id') id: string) {
    this.logger.debug(`GET /examples/${id}`);
    return this.examplesService.findOne(id);
  }

  /**
   * POST /examples
   * Create a new example (for manual population)
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createExampleDto: CreateExampleDto) {
    this.logger.log(`POST /examples - Creating: ${createExampleDto.title}`);
    return this.examplesService.create(createExampleDto);
  }



  /**
   * POST /examples/clear-cache
   * Manually clear the cache
   */
  @Post('clear-cache')
  @HttpCode(HttpStatus.OK)
  clearCache() {
    this.logger.log('POST /examples/clear-cache');
    this.examplesService.clearCache();
    return { message: 'Cache cleared successfully' };
  }
}
