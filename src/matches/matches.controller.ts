import { Controller, Get } from '@nestjs/common';
import { MatchesService } from './matches.service';

@Controller('matches')
export class MatchesController {
  constructor(private readonly matchesService: MatchesService) {}

  @Get('today')
  getTodayMatches() {
    return this.matchesService.getTodayMatches();
  }
}
