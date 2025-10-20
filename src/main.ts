import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  try {
    const app = await NestFactory.create<NestFastifyApplication>(
      AppModule,
      new FastifyAdapter(),
    );

    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
    app.enableCors({
      origin: (origin, callback) => {
        if (!origin || origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
          return callback(null, true);
        }
        const allowedOrigins = [
          process.env.FRONTEND_URL,
          process.env.LOCALHOST_URL,
        ].filter(Boolean);
        if (allowedOrigins.includes(origin)) {
          return callback(null, true);
        }
        return callback(new Error('Cors not allowed for this origin'), false);
      },
      credentials: true,
      methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    });

    const enableSwagger = process.env.NODE_ENV !== 'production' || process.env.ENABLE_SWAGGER === 'true';

    if (enableSwagger) {
      const config = new DocumentBuilder()
        .setTitle('Bitwise Server V2')
        .setDescription('Bitwise Server API documentation for MARS BENITEZ')
        .setVersion('2.0')
        .addTag('bitwise')
        .build();

      const documentFactory = () => SwaggerModule.createDocument(app, config);
      SwaggerModule.setup('bitwise-api', app, documentFactory, { yamlDocumentUrl: '/bitwise-api/bitwise-api.yaml' });
      console.log('Swagger enabled at /bitwise-api');
    } else {
      console.log('Swagger disabled (production)');
    }

    const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
    const host = '0.0.0.0';

    await app.listen(port, host);
    console.log(`Listening on ${host}:${port} (env=${process.env.NODE_ENV || 'unknown'})`);
  } catch (err) {
    console.error('Failed to bootstrap app:', err);
    process.exit(1);
  }
}

bootstrap();