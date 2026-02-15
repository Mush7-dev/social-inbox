import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';

interface RequestWithUser extends Request {
  user: {
    userType?: string;
    [key: string]: any;
  };
}

@Injectable()
export class AdminGuard implements CanActivate {
  private readonly allowedUserTypes = ['General Manager', 'Super Admin'];

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user;
    if (!user) {
      throw new ForbiddenException('User not found');
    }

    if (!user.userType || !this.allowedUserTypes.includes(user.userType)) {
      throw new ForbiddenException(
        'Only General Manager or Super Admin can perform this action',
      );
    }

    return true;
  }
}
