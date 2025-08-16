import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SimplifyExpressionDto {
  @ApiProperty({
    description: 'Boolean expression to simplify',
    example: '¬((A v B) ^ (¬C v D)) v (E ^ (A v ¬D))',
    type: String,
  })
  @IsString()
  expression: string;
}
