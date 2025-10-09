import { PartialType } from '@nestjs/swagger';
import { CreateAdaptiveDto } from './create-adaptive.dto';

export class UpdateAdaptiveDto extends PartialType(CreateAdaptiveDto) {}
