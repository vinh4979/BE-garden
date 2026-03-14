import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { SharedModule } from './modules/shared/shared.module';
import { ConfigModule } from '@nestjs/config';
import { validateEnv } from './config/env.validate';
import { AppLoggerService } from './modules/shared/logger.service';
import { MqttModule } from './modules/mqtt/mqtt.module';
import { RabbitMQModule } from './modules/rabbitmq/rabbitmq.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
      envFilePath: ['.env'],
      ignoreEnvFile: false,
      expandVariables: true,
      cache: false,
    }),
    AuthModule,
    UsersModule,
    SharedModule,
    MqttModule,
    RabbitMQModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
  constructor(private readonly logger: AppLoggerService) {
    this.logger.log('AppModule initialized', '123');

    console.log('---- ENV DEBUG ----');
    // console.log('NODE_ENV =', process.env.NODE_ENV);
    console.log('DATABASE_URL =', process.env.DATABASE_URL);
    console.log('RABBITMQ_URL =', process.env.RABBITMQ_URL);
    console.log('-------------------');
  }
}

// console.log('ENV:', process.env.NODE_ENV);
// console.log('DB:', process.env.DATABASE_URL);
// console.log('NODE_ENV =', process.env.NODE_ENV);
// console.log('NODE_ENV =', process.env.NODE_ENV);
// console.log('JWT_REFRESH_EXPIRES_IN =', process.env.JWT_REFRESH_EXPIRES_IN);
// console.log('NODE_ENV AT START =', process.env.NODE_ENV);
// console.log('Expected file =', `.env.${process.env.NODE_ENV ?? 'development'}`);
