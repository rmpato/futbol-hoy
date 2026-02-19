import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';


async function bootstrap() {
  const app = await NestFactory.create(AppModule);

   const config = new DocumentBuilder()
    .setTitle('API')
    .setDescription('Test API')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  // http://localhost:3000/api para ver swagger
  SwaggerModule.setup('api', app, document);


  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
