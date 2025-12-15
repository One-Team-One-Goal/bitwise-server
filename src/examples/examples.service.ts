import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateExampleDto } from './dto/create-example.dto';
import { FilterExamplesDto } from './dto/filter-examples.dto';

@Injectable()
export class ExamplesService {
  private readonly logger = new Logger(ExamplesService.name);
  private cacheTimestamp: number = 0;
  private cachedExamples: any[] = [];
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor(private prisma: PrismaService) {}

  /**
   * Get all examples with optional filtering
   * Uses in-memory cache with 5-minute TTL
   */
  async findAll(filters: FilterExamplesDto = {}) {
    const cacheAge = Date.now() - this.cacheTimestamp;
    
    // Use cache if fresh and no specific filters
    if (cacheAge < this.CACHE_TTL && this.cachedExamples.length > 0 && !this.hasFilters(filters)) {
      this.logger.debug('Returning cached examples');
      return this.cachedExamples;
    }

    this.logger.debug('Fetching examples from database');
    
    const where: any = { isActive: true };

    // Apply filters
    if (filters.difficulty) {
      where.difficulty = filters.difficulty;
    }
    if (filters.category) {
      where.category = filters.category;
    }
    if (filters.variableCount !== undefined) {
      where.variableCount = filters.variableCount;
    }
    if (filters.tags && filters.tags.length > 0) {
      where.tags = {
        hasSome: filters.tags,
      };
    }

    const examples = await this.prisma.booleanExample.findMany({
      where,
      orderBy: [
        { difficulty: 'asc' },
        { variableCount: 'asc' },
        { sortOrder: 'asc' },
      ],
    });

    // Update cache only if no filters
    if (!this.hasFilters(filters)) {
      this.cachedExamples = examples;
      this.cacheTimestamp = Date.now();
    }

    return examples;
  }

  /**
   * Get a single example by ID
   */
  async findOne(id: string) {
    const example = await this.prisma.booleanExample.findUnique({
      where: { id },
    });

    if (!example) {
      throw new NotFoundException(`Example with ID ${id} not found`);
    }

    return example;
  }

  /**
   * Get a random example with optional filters
   */
  async findRandom(filters: Partial<FilterExamplesDto> = {}) {
    const examples = await this.findAll(filters);

    if (examples.length === 0) {
      throw new NotFoundException('No examples match the specified criteria');
    }

    const randomIndex = Math.floor(Math.random() * examples.length);
    return examples[randomIndex];
  }

  /**
   * Create a new example
   */
  async create(createExampleDto: CreateExampleDto) {
    const example = await this.prisma.booleanExample.create({
      data: createExampleDto,
    });

    // Invalidate cache
    this.cacheTimestamp = 0;

    this.logger.log(`Created example: ${example.title} (${example.id})`);
    return example;
  }

  /**
  /**
   * Clear the cache manually
   */
  clearCache() {
    this.cacheTimestamp = 0;
    this.cachedExamples = [];
    this.logger.log('Cache cleared');
  }

  /**
   * Extract variable names from expression (A-Z, excluding T and F)
   */
  extractVariables(expr: string): string[] {
    const matches = expr.match(/[A-Z]/g) || [];
    const uniqueVars = [...new Set(matches)].filter(v => v !== 'T' && v !== 'F');
    return uniqueVars.sort();
  }

  /**
   * Check if any filters are applied
   */
  private hasFilters(filters: FilterExamplesDto): boolean {
    return !!(
      filters.difficulty ||
      filters.category ||
      filters.variableCount !== undefined ||
      (filters.tags && filters.tags.length > 0)
    );
  }
}
