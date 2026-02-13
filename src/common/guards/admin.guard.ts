import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';

@Injectable()
export class AdminGuard implements CanActivate {
  private readonly allowedUserTypes = ['General manager', 'Super Admin'];

  canActivate(context: ExecutionContext): boolean {
    console.log('dsknf');

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    console.log(user);
    if (!user) {
      throw new ForbiddenException('User not found');
    }

    if (!this.allowedUserTypes.includes(user.userType)) {
      throw new ForbiddenException(
        'Only General Manager or Super Admin can perform this action',
      );
    }

    return true;
  }
}
