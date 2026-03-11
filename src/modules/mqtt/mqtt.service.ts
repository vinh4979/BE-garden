/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { MqttClient, connect } from 'mqtt';
import { RabbitMQService } from '../rabbitmq/rabbitmq.service';

import {
  MQTT_BROKER_URL,
  MQTT_SENSOR_TOPIC,
} from 'src/constants/mqtt.constants';

@Injectable()
export class MqttService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MqttService.name);
  private client: MqttClient | null = null;

  constructor(private readonly rabbit: RabbitMQService) {}

  onModuleInit(): void {
    this.connectBroker();
  }

  onModuleDestroy(): void {
    if (this.client) {
      this.client.end();
      this.logger.log('MQTT client disconnected');
    }
  }

  private connectBroker(): void {
    this.client = connect(MQTT_BROKER_URL);

    this.client.on('connect', () => {
      this.logger.log(`Connected to MQTT broker: ${MQTT_BROKER_URL}`);

      this.client?.subscribe(MQTT_SENSOR_TOPIC, (error) => {
        if (error) {
          this.logger.error(`Subscribe failed: ${error.message}`);
          return;
        }

        this.logger.log(`Subscribed to topic: ${MQTT_SENSOR_TOPIC}`);
      });
    });

    this.client.on('message', (topic: string, payload: Buffer) => {
      const message = payload.toString();

      this.logger.log(
        `Received MQTT message | topic=${topic} | payload=${message}`,
      );

      try {
        const data = JSON.parse(message);

        // 🔥 gửi sang RabbitMQ
        this.rabbit.publish(data);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        this.logger.error('Failed to parse MQTT message');
      }
    });

    this.client.on('error', (error: Error) => {
      this.logger.error(`MQTT error: ${error.message}`);
    });

    this.client.on('reconnect', () => {
      this.logger.warn('Reconnecting to MQTT broker...');
    });

    this.client.on('close', () => {
      this.logger.warn('MQTT connection closed');
    });
  }
}
