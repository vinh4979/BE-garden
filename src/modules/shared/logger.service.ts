import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppLoggerService {
  private readonly logger = new Logger();

  constructor(private readonly configService: ConfigService) {}

  private get isDev(): boolean {
    return this.configService.get<string>('NODE_ENV') === 'development';
  }

  log(message: string, context?: string) {
    if (this.isDev) {
      this.logger.log(context, message);
    }
  }

  debug(message: string, context?: string) {
    if (this.isDev) {
      this.logger.debug(context, message);
    }
  }

  warn(message: string, context?: string) {
    this.logger.warn(context, message);
  }

  error(message: string, trace?: string, context?: string) {
    this.logger.error(context, message, trace);
  }
}
