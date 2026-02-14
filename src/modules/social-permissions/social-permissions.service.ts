import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  SocialInboxPermission,
  SocialInboxPermissionDocument,
} from '../../schemas/social-inbox-permission.schema';
import {
  CreateSocialInboxPermissionDto,
  UpdateSocialInboxPermissionDto,
  EffectivePermissionsResponseDto,
  EffectivePermissionDto,
} from './dto/social-inbox-permission.dto';
import {
  PermissionResolverService,
  UserContext,
} from './permission-resolver.service';
import { SocialInboxAccessType } from '../../common/enums/social-platform.enum';

@Injectable()
export class SocialPermissionsService {
  private readonly logger = new Logger(SocialPermissionsService.name);

  constructor(
    @InjectModel(SocialInboxPermission.name)
    private permissionModel: Model<SocialInboxPermissionDocument>,
    private permissionResolver: PermissionResolverService,
  ) {}

  /**
   * Get raw permissions for current user (individual only, for backward compatibility)
   */
  async getMyPermissions(
    userId: string,
  ): Promise<SocialInboxPermissionDocument | null> {
    const permission = await this.permissionModel.findOne({
      accessType: SocialInboxAccessType.USER,
      targetId: userId,
      isActive: true,
      deletedAt: null,
    });

    return permission;
  }

  /**
   * Get effective (resolved) permissions for a user
   * This resolves individual + team + role permissions with proper priority
   */
  async getEffectivePermissions(
    userContext: UserContext,
  ): Promise<EffectivePermissionsResponseDto> {
    const userId = userContext._id || userContext.id || '';
    const resolved = await this.permissionResolver.getEffectivePermissions(
      userContext,
    );

    const permissions: EffectivePermissionDto[] = resolved.map((r) => ({
      platform: r.platform,
      type: r.type,
      isDenied: r.isDenied,
      source: r.source,
    }));

    return {
      userId,
      permissions,
    };
  }

  /**
   * Get specific user permissions by ID (Admin only)
   */
  async getUserPermissions(
    userId: string,
  ): Promise<SocialInboxPermissionDocument> {
    const permission = await this.permissionModel.findOne({
      accessType: SocialInboxAccessType.USER,
      targetId: userId,
      deletedAt: null,
    });

    if (!permission) {
      throw new NotFoundException(`Permissions not found for user: ${userId}`);
    }

    return permission;
  }

  /**
   * Get all permissions (all types: user, team, role)
   */
  async getAllPermissions(): Promise<SocialInboxPermissionDocument[]> {
    return this.permissionModel.find({ deletedAt: null }).exec();
  }

  /**
   * Get permissions by access type
   */
  async getPermissionsByType(
    accessType: SocialInboxAccessType,
  ): Promise<SocialInboxPermissionDocument[]> {
    return this.permissionModel
      .find({
        accessType,
        deletedAt: null,
      })
      .exec();
  }

  /**
   * Get permissions by target ID
   */
  async getPermissionsByTargetId(
    targetId: string,
  ): Promise<SocialInboxPermissionDocument[]> {
    return this.permissionModel
      .find({
        targetId,
        deletedAt: null,
      })
      .exec();
  }

  /**
   * Create new permission (user, team, or role-based)
   */
  async createPermission(
    dto: CreateSocialInboxPermissionDto,
    createdById: string,
  ): Promise<SocialInboxPermissionDocument> {
    // Check if permission already exists for this accessType + targetId
    const existing = await this.permissionModel.findOne({
      accessType: dto.accessType,
      targetId: dto.targetId,
      deletedAt: null,
    });

    if (existing) {
      throw new ConflictException(
        `Permissions already exist for ${dto.accessType}: ${dto.targetId}`,
      );
    }

    const permission = new this.permissionModel({
      accessType: dto.accessType,
      targetId: dto.targetId,
      permissions: dto.permissions.map((p) => ({
        platform: p.platform,
        type: p.type,
        isDenied: p.isDenied ?? false,
      })),
      // Keep userId for backward compatibility (only for USER type)
      userId:
        dto.accessType === SocialInboxAccessType.USER ? dto.targetId : null,
      createdById,
    });

    await permission.save();
    this.logger.log(
      `Created ${dto.accessType} permissions for: ${dto.targetId}`,
    );

    return permission;
  }

  /**
   * Update existing permission
   */
  async updatePermission(
    id: string,
    dto: UpdateSocialInboxPermissionDto,
    updatedById: string,
  ): Promise<SocialInboxPermissionDocument> {
    const permission = await this.permissionModel.findOne({
      _id: id,
      deletedAt: null,
    });

    if (!permission) {
      throw new NotFoundException(`Permission not found: ${id}`);
    }

    if (dto.permissions !== undefined) {
      permission.permissions = dto.permissions.map((p) => ({
        platform: p.platform,
        type: p.type,
        isDenied: p.isDenied ?? false,
      }));
    }

    if (dto.isActive !== undefined) {
      permission.isActive = dto.isActive;
    }

    permission.updatedById = updatedById;
    await permission.save();

    this.logger.log(`Updated permissions: ${id}`);
    return permission;
  }

  /**
   * Soft delete permission
   */
  async deletePermission(id: string, deletedById: string): Promise<void> {
    const permission = await this.permissionModel.findOne({
      _id: id,
      deletedAt: null,
    });

    if (!permission) {
      throw new NotFoundException(`Permission not found: ${id}`);
    }

    permission.deletedAt = new Date();
    permission.updatedById = deletedById;
    await permission.save();

    this.logger.log(
      `Deleted ${permission.accessType} permissions: ${permission.targetId}`,
    );
  }
}
