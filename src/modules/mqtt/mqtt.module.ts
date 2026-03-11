import { Module } from '@nestjs/common';
import { MqttService } from './mqtt.service';
import { RabbitMQModule } from '../rabbitmq/rabbitmq.module';

@Module({
  imports: [RabbitMQModule],

  providers: [MqttService],
  exports: [MqttService],
})
export class MqttModule {}
