import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { Logger, ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  try {
    const app = await NestFactory.create<NestFastifyApplication>(
      AppModule,
      new FastifyAdapter(),
      { bufferLogs: true },
    );

    const globalPrefix = process.env.GLOBAL_PREFIX ?? 'api';
    app.setGlobalPrefix(globalPrefix);
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );

    app.enableShutdownHooks();

    const allowedOrigins = [
      process.env.FRONTEND_URL,
      process.env.LOCALHOST_URL,
      ...(process.env.CORS_ALLOWED_ORIGINS?.split(',') ?? []),
    ]
      .map((origin) => origin?.trim())
      .filter((origin): origin is string => Boolean(origin?.length));

    const allowLocalFallback = (origin?: string) =>
      !!origin?.match(/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/);

    app.enableCors({
      origin: (origin, callback) => {
        if (!origin || allowLocalFallback(origin) || allowedOrigins.includes(origin)) {
          return callback(null, true);
        }
        return callback(new Error(`Cors not allowed for origin: ${origin}`), false);
      },
      credentials: true,
      methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    });

    const enableSwagger =
      process.env.NODE_ENV !== 'production' || process.env.ENABLE_SWAGGER === 'true';

    if (enableSwagger) {
      const config = new DocumentBuilder()
        .setTitle('Bitwise Server V2')
        .setDescription('Bitwise Server API documentation for MARS BENITEZ')
        .setVersion('2.0')
        .addTag('bitwise')
        .build();

      const documentFactory = () => SwaggerModule.createDocument(app, config);
      SwaggerModule.setup('bitwise-api', app, documentFactory, {
        yamlDocumentUrl: '/bitwise-api/bitwise-api.yaml',
      });
      logger.log('Swagger enabled at /bitwise-api');
    } else {
      logger.log('Swagger disabled (production)');
    }

    const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
    const host = process.env.HOST ?? '0.0.0.0';

    await app.listen({ port, host });
    logger.log(`Listening on ${host}:${port} (env=${process.env.NODE_ENV || 'unknown'})`);
  } catch (err) {
    logger.error('Failed to bootstrap app', err instanceof Error ? err.stack : undefined);
    process.exit(1);
  }
}

bootstrap();