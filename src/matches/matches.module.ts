import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { MatchesController } from './matches.controller';
import { MatchesService } from './matches.service';

@Module({
  imports: [
    CacheModule.register({
      ttl: 300, // segundos (5 min)
      isGlobal: true, // 👈 MUY recomendado
    }),
  ],
  controllers: [MatchesController],
  providers: [MatchesService],
  exports: [MatchesService], 
})
export class MatchesModule {}
