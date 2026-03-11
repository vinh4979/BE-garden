import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomBytes } from 'crypto';
import bcrypt from 'bcrypt';

import { LoginDto } from './dto/login.dto';
import { PrismaService } from '../shared/prisma.service';
import type { JwtAccessClaims } from './types/jwt-access-claims.type';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  // ================= LOGIN =================

  async login(dto: LoginDto) {
    if (!dto.device_id || dto.device_id.trim().length < 4) {
      throw new BadRequestException('device_id is required');
      // throw new UnauthorizedException('device_id is required');
    }

    const user = await this.prisma.users.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordMatch: boolean = await bcrypt.compare(
      dto.password,
      user.password_hash,
    );
    if (!passwordMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload: JwtAccessClaims = {
      sub: user.id,
      email: user.email,
      role: user.role as JwtAccessClaims['role'],
    };

    const accessToken = await this.jwtService.signAsync(payload);

    // ====== CREATE REFRESH TOKEN (opaque) ======
    const rawRefresh = randomBytes(64).toString('hex');
    const refreshHash = createHash('sha256').update(rawRefresh).digest('hex');
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await this.prisma.refresh_tokens.upsert({
      where: {
        user_id_device_id: {
          user_id: user.id,
          device_id: dto.device_id,
        },
      },
      update: {
        token_hash: refreshHash,
        expires_at: expiresAt,
        revoked_at: null,
        updated_at: new Date(),
      },
      create: {
        user_id: user.id,
        device_id: dto.device_id,
        token_hash: refreshHash,
        expires_at: expiresAt,
      },
    });

    return {
      access_token: accessToken,
      refresh_token: rawRefresh,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    };
  }

  // ================= REFRESH =================

  async refresh(rawToken: string, deviceId: string) {
    if (!rawToken || rawToken.length < 32) {
      throw new BadRequestException('refresh_token is required');
    }
    if (!deviceId || deviceId.trim().length < 4) {
      throw new BadRequestException('device_id is required');
    }

    const tokenHash = createHash('sha256').update(rawToken).digest('hex');

    const tokenRecord = await this.prisma.refresh_tokens.findFirst({
      where: {
        token_hash: tokenHash,
        device_id: deviceId,
      },
      include: {
        users: true,
      },
    });

    if (!tokenRecord) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (tokenRecord.revoked_at) {
      throw new UnauthorizedException('Token revoked');
    }

    if (tokenRecord.expires_at < new Date()) {
      throw new UnauthorizedException('Token expired');
    }

    // ====== ISSUE NEW ACCESS TOKEN ======
    const payload: JwtAccessClaims = {
      sub: tokenRecord.users.id,
      email: tokenRecord.users.email,
      role: tokenRecord.users.role as JwtAccessClaims['role'],
    };

    const accessToken = await this.jwtService.signAsync(payload);

    // ====== ROTATE REFRESH TOKEN ======
    const newRawRefresh = randomBytes(64).toString('hex');
    const newHash = createHash('sha256').update(newRawRefresh).digest('hex');
    const newExpires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await this.prisma.refresh_tokens.update({
      where: {
        user_id_device_id: {
          user_id: tokenRecord.users.id,
          device_id: deviceId,
        },
      },
      data: {
        token_hash: newHash,
        expires_at: newExpires,
        revoked_at: null,
        updated_at: new Date(),
      },
    });

    return {
      access_token: accessToken,
      refresh_token: newRawRefresh,
    };
  }

  // ================= LOGOUT DEVICE =================

  async logout(rawToken: string) {
    if (!rawToken || rawToken.length < 32) return;

    const tokenHash = createHash('sha256').update(rawToken).digest('hex');

    const tokenRecord = await this.prisma.refresh_tokens.findFirst({
      where: { token_hash: tokenHash },
    });

    if (!tokenRecord) return;

    await this.prisma.refresh_tokens.update({
      where: { id: tokenRecord.id },
      data: { revoked_at: new Date() },
    });
  }

  // ================= LOGOUT ALL =================

  //   async logoutAll(userId: string) {
  //     await this.prisma.refresh_tokens.updateMany({
  //       where: {
  //         user_id: userId,
  //         revoked_at: null,
  //       },
  //       data: { revoked_at: new Date() },
  //     });
  //   }
}
