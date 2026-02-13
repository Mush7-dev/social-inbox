import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsArray,
  IsBoolean,
  IsUUID,
} from 'class-validator';
import {
  SocialPlatform,
  SocialInboxPermissionType,
  SocialInboxAccessType,
} from '../../../common/enums/social-platform.enum';

export class CreateSocialInboxPermissionDto {
  @ApiProperty({ enum: SocialInboxAccessType })
  @IsEnum(SocialInboxAccessType)
  accessType: SocialInboxAccessType;

  @ApiProperty()
  @IsUUID()
  accessId: string;

  @ApiProperty({ enum: SocialInboxPermissionType })
  @IsEnum(SocialInboxPermissionType)
  permissionType: SocialInboxPermissionType;

  @ApiPropertyOptional({
    enum: SocialPlatform,
    isArray: true,
    default: ['facebook', 'instagram', 'whatsapp', 'gmail'],
  })
  @IsOptional()
  @IsArray()
  @IsEnum(SocialPlatform, { each: true })
  platforms?: SocialPlatform[];
}

export class UpdateSocialInboxPermissionDto {
  @ApiPropertyOptional({ enum: SocialInboxPermissionType })
  @IsOptional()
  @IsEnum(SocialInboxPermissionType)
  permissionType?: SocialInboxPermissionType;

  @ApiPropertyOptional({
    enum: SocialPlatform,
    isArray: true,
  })
  @IsOptional()
  @IsArray()
  @IsEnum(SocialPlatform, { each: true })
  platforms?: SocialPlatform[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class SocialInboxPermissionResponseDto {
  @ApiProperty()
  _id: string;

  @ApiProperty({ enum: SocialInboxAccessType })
  accessType: SocialInboxAccessType;

  @ApiProperty()
  accessId: string;

  @ApiProperty()
  accessName: string; // Name of user/team/role

  @ApiProperty({ enum: SocialInboxPermissionType })
  permissionType: SocialInboxPermissionType;

  @ApiProperty({ enum: SocialPlatform, isArray: true })
  platforms: SocialPlatform[];

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  createdByName?: string;
}

export class AssignableEntityDto {
  @ApiProperty()
  _id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ enum: SocialInboxAccessType })
  type: SocialInboxAccessType;

  @ApiPropertyOptional()
  hasAccess?: boolean;

  @ApiPropertyOptional({ enum: SocialInboxPermissionType })
  permissionType?: SocialInboxPermissionType;

  @ApiPropertyOptional({ enum: SocialPlatform, isArray: true })
  platforms?: SocialPlatform[];
}