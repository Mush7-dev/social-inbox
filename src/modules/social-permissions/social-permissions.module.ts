import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HttpModule } from '@nestjs/axios';
import { SocialPermissionsController } from './social-permissions.controller';
import { SocialPermissionsService } from './social-permissions.service';
import {
  SocialInboxPermission,
  SocialInboxPermissionSchema,
} from '../../schemas/social-inbox-permission.schema';
import { AuthGuard } from '../../common/guards/auth.guard';
import { AdminGuard } from '../../common/guards/admin.guard';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SocialInboxPermission.name, schema: SocialInboxPermissionSchema },
    ]),
    HttpModule,
  ],
  controllers: [SocialPermissionsController],
  providers: [SocialPermissionsService, AuthGuard, AdminGuard],
  exports: [SocialPermissionsService],
})
export class SocialPermissionsModule {}
