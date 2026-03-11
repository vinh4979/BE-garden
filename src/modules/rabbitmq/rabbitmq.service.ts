import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as amqp from 'amqplib';

@Injectable()
export class RabbitMQService implements OnModuleInit {
  constructor(private readonly configService: ConfigService) {}
  private connection!: amqp.ChannelModel;
  private channel!: amqp.Channel;

  private queueName = 'sensor_jobs';

  async onModuleInit() {
    // amqp://bzing:0000@localhost:5672
    const rabbitmqUrl = this.configService.get<string>('RABBITMQ_URL');
    if (!rabbitmqUrl) {
      throw new Error('RABBITMQ_URL environment variable is not set');
    }

    this.connection = await amqp.connect(rabbitmqUrl);

    this.channel = await this.connection.createChannel();

    await this.channel.assertQueue(this.queueName, {
      durable: true,
    });

    console.log('RabbitMQ connected');

    await this.startConsumer();
  }

  publish(job: unknown) {
    const message = Buffer.from(JSON.stringify(job));

    this.channel.sendToQueue(this.queueName, message, {
      persistent: true,
    });

    console.log('Job published:', job);
  }

  async startConsumer() {
    await this.channel.consume(this.queueName, (msg) => {
      if (!msg) return;

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const data = JSON.parse(msg.content.toString());

      console.log('Sensor job received:', data);

      this.channel.ack(msg);
    });

    console.log('Consumer started');
  }
}
