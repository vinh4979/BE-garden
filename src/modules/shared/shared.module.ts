import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { AppLoggerService } from './logger.service';

@Global()
@Module({
  providers: [PrismaService, AppLoggerService],
  exports: [PrismaService, AppLoggerService],
})
export class SharedModule {}
