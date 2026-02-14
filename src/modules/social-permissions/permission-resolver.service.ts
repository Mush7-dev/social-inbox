import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  SocialInboxPermission,
  SocialInboxPermissionDocument,
  PlatformPermission,
} from '../../schemas/social-inbox-permission.schema';
import {
  SocialPlatform,
  SocialInboxAccessType,
  SocialInboxPermissionType,
} from '../../common/enums/social-platform.enum';

export interface UserContext {
  _id: string;
  id?: string;
  teamIds?: string[];
  userType?: string;
}

export interface ResolvedPermission {
  platform: SocialPlatform;
  type: SocialInboxPermissionType;
  isDenied: boolean;
  source: 'individual' | 'team' | 'role' | 'none';
  sourceId?: string;
}

@Injectable()
export class PermissionResolverService {
  private readonly logger = new Logger(PermissionResolverService.name);

  constructor(
    @InjectModel(SocialInboxPermission.name)
    private permissionModel: Model<SocialInboxPermissionDocument>,
  ) {}

  /**
   * Resolves effective permissions for a user across all platforms
   * Priority: Individual > Team > Role
   */
  async getEffectivePermissions(
    userContext: UserContext,
  ): Promise<ResolvedPermission[]> {
    const userId = userContext._id || userContext.id || '';
    const teamIds = userContext.teamIds || [];
    const userType = userContext.userType;

    this.logger.debug(
      `Resolving permissions for user: ${userId}, teams: ${teamIds}, role: ${userType}`,
    );

    // Fetch all relevant permissions in parallel
    const [individualPerms, teamPerms, rolePerms] = await Promise.all([
      this.getIndividualPermissions(userId),
      this.getTeamPermissions(teamIds),
      this.getRolePermissions(userType),
    ]);

    // Get all unique platforms
    const allPlatforms = Object.values(SocialPlatform);

    // Resolve permissions for each platform
    const resolvedPermissions: ResolvedPermission[] = [];

    for (const platform of allPlatforms) {
      const resolved = this.resolvePlatformPermission(
        platform,
        individualPerms,
        teamPerms,
        rolePerms,
      );
      if (resolved) {
        resolvedPermissions.push(resolved);
      }
    }

    return resolvedPermissions;
  }

  /**
   * Resolves permission for a specific platform
   * Returns null if no access
   */
  async getEffectivePermissionForPlatform(
    userContext: UserContext,
    platform: SocialPlatform,
  ): Promise<ResolvedPermission | null> {
    const userId = userContext._id || userContext.id || '';
    const teamIds = userContext.teamIds || [];
    const userType = userContext.userType;

    const [individualPerms, teamPerms, rolePerms] = await Promise.all([
      this.getIndividualPermissions(userId),
      this.getTeamPermissions(teamIds),
      this.getRolePermissions(userType),
    ]);

    return this.resolvePlatformPermission(
      platform,
      individualPerms,
      teamPerms,
      rolePerms,
    );
  }

  /**
   * Core resolution logic for a single platform
   * Priority: Individual (with denial check) > Team (most permissive) > Role
   */
  private resolvePlatformPermission(
    platform: SocialPlatform,
    individualPerms: PlatformPermission[],
    teamPerms: PlatformPermission[][],
    rolePerms: PlatformPermission[],
  ): ResolvedPermission | null {
    // Step 1: Check Individual permissions
    const individualPerm = individualPerms.find((p) => p.platform === platform);
    if (individualPerm) {
      if (individualPerm.isDenied) {
        // Explicit denial - block access regardless of team/role
        this.logger.debug(
          `User explicitly denied access to ${platform} (individual)`,
        );
        return {
          platform,
          type: individualPerm.type,
          isDenied: true,
          source: 'individual',
        };
      }
      // Individual permission found (not denied)
      this.logger.debug(`Using individual permission for ${platform}`);
      return {
        platform,
        type: individualPerm.type,
        isDenied: false,
        source: 'individual',
      };
    }

    // Step 2: Check Team permissions (use most permissive if multiple teams)
    let teamPerm: PlatformPermission | null = null;
    for (const perms of teamPerms) {
      const perm = perms.find((p) => p.platform === platform);
      if (perm && !perm.isDenied) {
        if (
          !teamPerm ||
          this.isMorePermissive(perm.type, teamPerm.type)
        ) {
          teamPerm = perm;
        }
      }
    }

    if (teamPerm) {
      this.logger.debug(`Using team permission for ${platform}`);
      return {
        platform,
        type: teamPerm.type,
        isDenied: false,
        source: 'team',
      };
    }

    // Step 3: Check Role permissions
    const rolePerm = rolePerms.find((p) => p.platform === platform);
    if (rolePerm && !rolePerm.isDenied) {
      this.logger.debug(`Using role permission for ${platform}`);
      return {
        platform,
        type: rolePerm.type,
        isDenied: false,
        source: 'role',
      };
    }

    // No permission found
    this.logger.debug(`No permission found for ${platform}`);
    return null;
  }

  /**
   * Fetch individual (user-specific) permissions
   */
  private async getIndividualPermissions(
    userId: string,
  ): Promise<PlatformPermission[]> {
    const permission = await this.permissionModel.findOne({
      accessType: SocialInboxAccessType.USER,
      targetId: userId,
      isActive: true,
      deletedAt: null,
    });

    return permission?.permissions || [];
  }

  /**
   * Fetch team permissions for all user's teams
   */
  private async getTeamPermissions(
    teamIds: string[],
  ): Promise<PlatformPermission[][]> {
    if (!teamIds || teamIds.length === 0) {
      return [];
    }

    const permissions = await this.permissionModel.find({
      accessType: SocialInboxAccessType.TEAM,
      targetId: { $in: teamIds },
      isActive: true,
      deletedAt: null,
    });

    return permissions.map((p) => p.permissions);
  }

  /**
   * Fetch role-based permissions
   */
  private async getRolePermissions(
    userType?: string,
  ): Promise<PlatformPermission[]> {
    if (!userType) {
      return [];
    }

    const permission = await this.permissionModel.findOne({
      accessType: SocialInboxAccessType.ROLE,
      targetId: userType,
      isActive: true,
      deletedAt: null,
    });

    return permission?.permissions || [];
  }

  /**
   * Compare permission levels
   * VIEW_AND_ANSWER is more permissive than VIEW_ONLY
   */
  private isMorePermissive(
    type1: SocialInboxPermissionType,
    type2: SocialInboxPermissionType,
  ): boolean {
    const permissionHierarchy = {
      [SocialInboxPermissionType.VIEW_ONLY]: 1,
      [SocialInboxPermissionType.VIEW_AND_ANSWER]: 2,
    };

    return permissionHierarchy[type1] > permissionHierarchy[type2];
  }
}
