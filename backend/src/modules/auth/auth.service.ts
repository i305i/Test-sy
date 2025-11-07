import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    
    if (!user) {
      throw new UnauthorizedException('بيانات الدخول غير صحيحة');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    
    if (!isPasswordValid) {
      throw new UnauthorizedException('بيانات الدخول غير صحيحة');
    }

    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedException('الحساب غير نشط');
    }

    const { passwordHash, ...result } = user;
    return result;
  }

  async login(user: any, ipAddress?: string, userAgent?: string) {
    const payload = { 
      sub: user.id, 
      email: user.email, 
      role: user.role 
    };

    // إضافة timestamp فريد للـ payload لضمان uniqueness
    const uniquePayload = {
      ...payload,
      iat: Math.floor(Date.now() / 1000),
      jti: `${user.id}-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(uniquePayload, {
      secret: this.configService.get('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get('JWT_REFRESH_EXPIRY') || '7d',
    });

    // حذف sessions القديمة المنتهية أو غير النشطة للمستخدم
    await this.prisma.session.deleteMany({
      where: {
        OR: [
          { userId: user.id, isActive: false },
          { userId: user.id, expiresAt: { lt: new Date() } },
        ],
      },
    });

    // Save new session
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.prisma.session.create({
      data: {
        userId: user.id,
        refreshToken,
        ipAddress,
        userAgent,
        expiresAt,
      },
    });

    // Update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_in: 900, // 15 minutes
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    };
  }

  async refreshToken(userId: string, refreshToken: string) {
    const session = await this.prisma.session.findUnique({
      where: { refreshToken },
      include: { user: true },
    });
    
    if (!session || !session.isActive || session.userId !== userId) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (new Date() > session.expiresAt) {
      throw new UnauthorizedException('Refresh token expired');
    }

    const payload = { 
      sub: session.user.id, 
      email: session.user.email, 
      role: session.user.role 
    };

    const accessToken = this.jwtService.sign(payload);

    // Update last used
    await this.prisma.session.update({
      where: { id: session.id },
      data: { lastUsedAt: new Date() },
    });

    return {
      access_token: accessToken,
      expires_in: 900,
    };
  }

  async logout(userId: string, refreshToken?: string) {
    if (refreshToken) {
      await this.prisma.session.updateMany({
        where: { 
          userId,
          refreshToken,
        },
        data: { isActive: false },
      });
    } else {
      // Logout from all devices
      await this.prisma.session.updateMany({
        where: { userId },
        data: { isActive: false },
      });
    }
    
    return { message: 'تم تسجيل الخروج بنجاح' };
  }
}

