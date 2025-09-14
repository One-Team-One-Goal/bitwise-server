import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { BookmarkModule } from './bookmark/bookmark.module';
import { CalculatorModule } from './calculator/calculator.module';
import { LessonsModule } from './lessons/lessons.module';
import { AssessmentModule } from './assessment/assessment.module';
import { PrismaModule } from 'prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    AuthModule, 
    UserModule, 
    BookmarkModule,
    CalculatorModule,
    LessonsModule,
    AssessmentModule,
    PrismaModule,
  ],
})
export class AppModule {}
