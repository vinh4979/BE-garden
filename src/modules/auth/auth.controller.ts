import {
  Body,
  Controller,
  Post,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';

import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { TokenService } from './tokens/token.service';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import type { JwtPayload } from './types/jwt-payload.type';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly tokenService: TokenService,
  ) {}

  // ---------------- LOGIN ----------------

  @Post('login')
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  // ---------------- REFRESH ----------------

  @Post('refresh')
  refresh(@Body() body: { refresh_token: string; device_id: string }) {
    return this.authService.refresh(body.refresh_token, body.device_id);
  }

  // ---------------- LOGOUT DEVICE ----------------
  // dùng refresh token trong header

  @Post('logout')
  async logout(@Body('refresh_token') refreshToken: string) {
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token missing');
    }

    await this.authService.logout(refreshToken);

    return {
      message: 'Logged out successfully',
    };
  }

  // ---------------- LOGOUT ALL ----------------
  // dùng access token

  @Post('logout-all')
  @UseGuards(JwtAuthGuard)
  async logoutAll(@CurrentUser() user: JwtPayload) {
    await this.tokenService.logoutAll(user.userId);
    return { message: 'Logged out from all devices' };
  }

  // ---------------- PRIVATE ----------------

  private extractRefreshToken(req: Request): string | null {
    const authHeader = req.headers['authorization'] as string;
    if (!authHeader) return null;

    const parts = authHeader.split(' ');
    if (parts.length !== 2) return null;

    const [type, token] = parts;
    if (type !== 'Bearer') return null;

    return token;
  }
}
