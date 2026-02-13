import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { HttpModule } from '@nestjs/axios';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SocialMessageModule } from './modules/social-message/social-message.module';
import { GmailModule } from './modules/gmail/gmail.module';
import { FacebookWebhookModule } from './modules/facebook-webhook/facebook-webhook.module';
import { SocialPermissionsModule } from './modules/social-permissions/social-permissions.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRoot(
      process.env.MONGODB_URI || 'mongodb://localhost:27017/social-inbox',
    ),
    HttpModule.register({
      global: true,
      timeout: 10000,
      maxRedirects: 3,
    }),
    SocialMessageModule,
    GmailModule,
    FacebookWebhookModule,
    SocialPermissionsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
