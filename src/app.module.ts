import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { MatchesModule } from './matches/matches.module';
import { CacheModule } from '@nestjs/cache-manager';


@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MatchesModule,
    CacheModule.register({
      ttl: 5000,
      max: 100,
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
