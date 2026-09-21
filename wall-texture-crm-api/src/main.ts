import { NestFactory, Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { AppConfig } from './config/configuration';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';

// whatsapp-web.js runs its own async cleanup on session LOGOUT and can throw
// (e.g. EBUSY while Chrome still holds session files on Windows) outside any
// promise chain we own — without this, that takes the whole API down.
process.on('unhandledRejection', (reason) => {
  // eslint-disable-next-line no-console
  console.error('Unhandled rejection (ignored, API stays up):', reason);
});

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: false });
  const configService = app.get(ConfigService);
  const config = configService.get<AppConfig>('app')!;

  app.use(helmet({ crossOriginResourcePolicy: false }));
  app.use(compression());
  app.use(cookieParser());

  app.enableCors({
    origin: config.corsOrigin.split(',').map((o) => o.trim()),
    credentials: true,
  });

  app.setGlobalPrefix(config.apiPrefix);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new TransformInterceptor());
  app.useGlobalGuards(new JwtAuthGuard(app.get(Reflector)));

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Wall Texture & Decorative Surface CRM API')
    .setDescription(
      'Enterprise CRM & Quotation Management System — Lead → Site Visit → Quotation → Project Tracking → Follow-up → WhatsApp → Gallery',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('Auth')
    .addTag('Dashboard')
    .addTag('Analytics')
    .addTag('Customers')
    .addTag('Quotations')
    .addTag('Project Tracking')
    .addTag('Gallery')
    .addTag('WhatsApp')
    .addTag('Settings')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  await app.listen(config.port);

  console.log(
    `🚀 API running on http://localhost:${config.port}/${config.apiPrefix}`,
  );

  console.log(`📚 Swagger docs on http://localhost:${config.port}/api`);
}
bootstrap();
