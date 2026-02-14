import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsArray,
  IsBoolean,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  SocialPlatform,
  SocialInboxPermissionType,
  SocialInboxAccessType,
} from '../../../common/enums/social-platform.enum';

export class PlatformPermissionDto {
  @ApiProperty({
    enum: SocialPlatform,
    description: 'Social media platform',
    example: SocialPlatform.FACEBOOK,
  })
  @IsEnum(SocialPlatform)
  platform: SocialPlatform;

  @ApiProperty({
    enum: SocialInboxPermissionType,
    description: 'Permission level for the platform',
    example: SocialInboxPermissionType.VIEW_AND_ANSWER,
  })
  @IsEnum(SocialInboxPermissionType)
  type: SocialInboxPermissionType;

  @ApiPropertyOptional({
    description:
      'If true, explicitly denies access to this platform (blocks user even if team/role has access)',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isDenied?: boolean;
}

export class CreateSocialInboxPermissionDto {
  @ApiProperty({
    enum: SocialInboxAccessType,
    description:
      'Type of access: USER (individual), TEAM (all team members), or ROLE (all users with specific role)',
    example: SocialInboxAccessType.USER,
    default: SocialInboxAccessType.USER,
  })
  @IsEnum(SocialInboxAccessType)
  accessType: SocialInboxAccessType;

  @ApiProperty({
    description:
      'Target ID: userId for USER type, teamId for TEAM type, or role name (e.g., "General Manager") for ROLE type',
    example: 'user123',
  })
  @IsString()
  targetId: string;

  @ApiProperty({
    type: [PlatformPermissionDto],
    description: 'Array of platform permissions',
    example: [
      {
        platform: SocialPlatform.FACEBOOK,
        type: SocialInboxPermissionType.VIEW_AND_ANSWER,
        isDenied: false,
      },
      {
        platform: SocialPlatform.INSTAGRAM,
        type: SocialInboxPermissionType.VIEW_ONLY,
        isDenied: false,
      },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PlatformPermissionDto)
  permissions: PlatformPermissionDto[];
}

export class UpdateSocialInboxPermissionDto {
  @ApiPropertyOptional({
    type: [PlatformPermissionDto],
    description: 'Updated platform permissions',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PlatformPermissionDto)
  permissions?: PlatformPermissionDto[];

  @ApiPropertyOptional({
    description: 'Enable or disable this permission',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class SocialInboxPermissionResponseDto {
  @ApiProperty({ description: 'Permission record ID' })
  _id: string;

  @ApiProperty({
    enum: SocialInboxAccessType,
    description: 'Access type: user, team, or role',
  })
  accessType: SocialInboxAccessType;

  @ApiProperty({
    description: 'Target ID (userId, teamId, or role name)',
  })
  targetId: string;

  @ApiProperty({
    type: [PlatformPermissionDto],
    description: 'Platform-specific permissions',
  })
  permissions: PlatformPermissionDto[];

  @ApiProperty({ description: 'Whether this permission is active' })
  isActive: boolean;

  @ApiProperty({ description: 'Created by user ID' })
  createdById?: string;

  @ApiProperty({ description: 'Last updated by user ID' })
  updatedById?: string;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: Date;

  @ApiPropertyOptional({ description: 'Soft delete timestamp' })
  deletedAt?: Date;
}

export class EffectivePermissionDto {
  @ApiProperty({
    enum: SocialPlatform,
    description: 'Social media platform',
  })
  platform: SocialPlatform;

  @ApiProperty({
    enum: SocialInboxPermissionType,
    description: 'Effective permission level',
  })
  type: SocialInboxPermissionType;

  @ApiProperty({
    description: 'Whether access is denied',
  })
  isDenied: boolean;

  @ApiProperty({
    description: 'Source of this permission: individual, team, or role',
    example: 'team',
  })
  source: string;
}

export class EffectivePermissionsResponseDto {
  @ApiProperty({ description: 'User ID' })
  userId: string;

  @ApiProperty({
    type: [EffectivePermissionDto],
    description: 'Resolved effective permissions across all platforms',
  })
  permissions: EffectivePermissionDto[];
}
