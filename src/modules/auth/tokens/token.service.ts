import { Injectable } from '@nestjs/common';
import { sha256 } from 'src/common/utils/hash';
import { PrismaService } from 'src/modules/shared/prisma.service';

@Injectable()
export class TokenService {
  constructor(private readonly prisma: PrismaService) {}

  // 🔥 Logout device hiện tại
  async logout(refreshToken: string): Promise<void> {
    const hashed = sha256(refreshToken);

    const token = await this.prisma.refresh_tokens.findFirst({
      where: {
        token_hash: hashed,
        revoked_at: null,
        expires_at: { gt: new Date() },
      },
    });

    if (!token) return;

    await this.prisma.refresh_tokens.update({
      where: { id: token.id },
      data: {
        revoked_at: new Date(),
      },
    });
  }

  // 🔥 Logout tất cả thiết bị
  async logoutAll(userId: string): Promise<void> {
    console.log('TokenService.logoutAll userId:', userId);
    await this.prisma.refresh_tokens.updateMany({
      where: {
        user_id: userId,
        revoked_at: null,
      },
      data: {
        revoked_at: new Date(),
      },
    });
  }
}
