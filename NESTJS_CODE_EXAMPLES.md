# 💻 أمثلة كود NestJS (NestJS Code Examples)

هذا الملف يحتوي على أمثلة عملية لكيفية بناء الـ Backend باستخدام NestJS.

---

## 📦 الإعداد الأولي

### تثبيت NestJS CLI

```bash
npm i -g @nestjs/cli
nest new company-docs-backend
cd company-docs-backend
```

### تثبيت الحزم المطلوبة

```bash
# Core packages
npm install @nestjs/config @nestjs/jwt @nestjs/passport
npm install @nestjs/swagger @nestjs/throttler
npm install @nestjs/bull @nestjs/cache-manager

# Auth
npm install passport passport-jwt passport-local bcrypt
npm install @types/passport-jwt @types/passport-local @types/bcrypt -D

# Validation
npm install class-validator class-transformer

# Database
npm install @prisma/client
npm install prisma -D

# Storage & Cache
npm install minio bull cache-manager cache-manager-redis-store redis

# Utilities
npm install winston nodemailer
```

---

## 🏗️ البنية الأساسية

### 1. main.ts - Bootstrap

```typescript
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global Prefix
  app.setGlobalPrefix('api/v1');

  // CORS
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });

  // Security
  app.use(helmet());
  app.use(cookieParser());

  // Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Swagger Documentation
  const config = new DocumentBuilder()
    .setTitle('Company Docs Manager API')
    .setDescription('نظام إدارة الشركات والوثائق - API Documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('auth', 'Authentication endpoints')
    .addTag('companies', 'Companies management')
    .addTag('documents', 'Documents management')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  // Start Server
  const port = process.env.PORT || 5000;
  await app.listen(port);
  
  console.log(`🚀 Application is running on: http://localhost:${port}`);
  console.log(`📚 API Documentation: http://localhost:${port}/api-docs`);
}

bootstrap();
```

### 2. app.module.ts - Root Module

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { BullModule } from '@nestjs/bull';
import { CacheModule } from '@nestjs/cache-manager';
import * as redisStore from 'cache-manager-redis-store';

// Feature Modules
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { CompaniesModule } from './modules/companies/companies.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { SharesModule } from './modules/shares/shares.module';
import { NotificationsModule } from './modules/notifications/notifications.module';

// Core Modules
import { DatabaseModule } from './database/database.module';
import { StorageModule } from './storage/storage.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Rate Limiting
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests
      },
    ]),

    // Cache
    CacheModule.register({
      isGlobal: true,
      store: redisStore,
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT) || 6379,
      password: process.env.REDIS_PASSWORD,
      ttl: 3600, // 1 hour default
    }),

    // Queue
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT) || 6379',
        password: process.env.REDIS_PASSWORD,
      },
    }),

    // Core Modules
    DatabaseModule,
    StorageModule,

    // Feature Modules
    AuthModule,
    UsersModule,
    CompaniesModule,
    DocumentsModule,
    SharesModule,
    NotificationsModule,
  ],
})
export class AppModule {}
```

---

## 🔐 نظام المصادقة (Authentication)

### Auth Module

```typescript
// auth/auth.module.ts
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get('JWT_SECRET'),
        signOptions: { expiresIn: config.get('JWT_EXPIRY') || '15m' },
      }),
    }),
    UsersModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, LocalStrategy, JwtStrategy, JwtRefreshStrategy],
  exports: [AuthService],
})
export class AuthModule {}
```

### Auth Service

```typescript
// auth/auth.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
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

  async login(user: any) {
    const payload = { 
      sub: user.id, 
      email: user.email, 
      role: user.role 
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get('JWT_REFRESH_EXPIRY') || '7d',
    });

    // Save refresh token to database
    await this.usersService.updateRefreshToken(user.id, refreshToken);

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_in: 900, // 15 minutes in seconds
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
    const user = await this.usersService.findById(userId);
    
    if (!user || !user.refreshToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Verify refresh token
    const isValid = await bcrypt.compare(refreshToken, user.refreshToken);
    
    if (!isValid) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const payload = { 
      sub: user.id, 
      email: user.email, 
      role: user.role 
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      access_token: accessToken,
      expires_in: 900,
    };
  }

  async logout(userId: string) {
    await this.usersService.updateRefreshToken(userId, null);
    return { message: 'تم تسجيل الخروج بنجاح' };
  }
}
```

### Auth Controller

```typescript
// auth/auth.controller.ts
import { Controller, Post, Body, UseGuards, Request, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Public } from './decorators/public.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import { LoginDto } from './dto/login.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @UseGuards(LocalAuthGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'تسجيل الدخول' })
  @ApiResponse({ status: 200, description: 'تم تسجيل الدخول بنجاح' })
  @ApiResponse({ status: 401, description: 'بيانات الدخول غير صحيحة' })
  async login(@Request() req, @Body() loginDto: LoginDto) {
    return {
      success: true,
      data: await this.authService.login(req.user),
    };
  }

  @Public()
  @UseGuards(JwtRefreshGuard)
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'تحديث الـ access token' })
  async refreshToken(@Request() req) {
    return {
      success: true,
      data: await this.authService.refreshToken(
        req.user.sub,
        req.user.refreshToken,
      ),
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'تسجيل الخروج' })
  async logout(@CurrentUser() user) {
    return {
      success: true,
      data: await this.authService.logout(user.id),
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('me')
  @ApiOperation({ summary: 'الحصول على بيانات المستخدم الحالي' })
  getProfile(@CurrentUser() user) {
    return {
      success: true,
      data: { user },
    };
  }
}
```

### JWT Strategy

```typescript
// auth/strategies/jwt.strategy.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET'),
    });
  }

  async validate(payload: any) {
    const user = await this.usersService.findById(payload.sub);
    
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedException('User is not active');
    }

    return {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
    };
  }
}
```

### DTOs

```typescript
// auth/dto/login.dto.ts
import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail({}, { message: 'البريد الإلكتروني غير صالح' })
  email: string;

  @ApiProperty({ example: 'Password@123' })
  @IsString()
  @MinLength(8, { message: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل' })
  password: string;
}
```

### Custom Decorators

```typescript
// auth/decorators/current-user.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
```

```typescript
// auth/decorators/roles.decorator.ts
import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../../common/enums/user-role.enum';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
```

```typescript
// auth/decorators/public.decorator.ts
import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
```

### Guards

```typescript
// auth/guards/roles.guard.ts
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.some((role) => user.role === role);
  }
}
```

---

## 🏢 إدارة الشركات (Companies Module)

### Companies Module

```typescript
// companies/companies.module.ts
import { Module } from '@nestjs/common';
import { CompaniesController } from './companies.controller';
import { CompaniesService } from './companies.service';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [CompaniesController],
  providers: [CompaniesService],
  exports: [CompaniesService],
})
export class CompaniesModule {}
```

### Companies Service

```typescript
// companies/companies.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { QueryCompanyDto } from './dto/query-company.dto';

@Injectable()
export class CompaniesService {
  constructor(private prisma: PrismaService) {}

  async create(createCompanyDto: CreateCompanyDto, userId: string) {
    return this.prisma.company.create({
      data: {
        ...createCompanyDto,
        ownerId: userId,
      },
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  async findAll(query: QueryCompanyDto, userId: string, userRole: string) {
    const { page = 1, limit = 20, status, search, sort = 'createdAt', order = 'desc' } = query;
    const skip = (page - 1) * limit;

    // Build where clause based on user role
    const where: any = {};

    if (userRole === 'EMPLOYEE') {
      // Employees only see their own companies or shared companies
      where.OR = [
        { ownerId: userId },
        {
          shares: {
            some: {
              sharedWithUserId: userId,
              status: 'ACTIVE',
            },
          },
        },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { commercialRegistration: { contains: search } },
        { taxNumber: { contains: search } },
      ];
    }

    const [companies, total] = await Promise.all([
      this.prisma.company.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sort]: order },
        include: {
          owner: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          _count: {
            select: {
              documents: true,
            },
          },
        },
      }),
      this.prisma.company.count({ where }),
    ]);

    return {
      companies,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const company = await this.prisma.company.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        _count: {
          select: {
            documents: true,
            shares: true,
          },
        },
      },
    });

    if (!company) {
      throw new NotFoundException('الشركة غير موجودة');
    }

    return company;
  }

  async update(id: string, updateCompanyDto: UpdateCompanyDto) {
    await this.findOne(id); // Check if exists

    return this.prisma.company.update({
      where: { id },
      data: updateCompanyDto,
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id); // Check if exists

    return this.prisma.company.delete({
      where: { id },
    });
  }

  async calculateCompletion(id: string): Promise<number> {
    // Implementation for calculating completion percentage
    const documents = await this.prisma.document.count({
      where: {
        companyId: id,
        status: 'APPROVED',
        isLatestVersion: true,
      },
    });

    // Get required documents count from template
    // For now, assume 10 documents required
    const requiredDocuments = 10;
    const completion = Math.round((documents / requiredDocuments) * 100);

    await this.prisma.company.update({
      where: { id },
      data: { completionPercentage: completion },
    });

    return completion;
  }
}
```

### Companies Controller

```typescript
// companies/companies.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CompaniesService } from './companies.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { QueryCompanyDto } from './dto/query-company.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../../common/enums/user-role.enum';

@ApiTags('companies')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('companies')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Post()
  @ApiOperation({ summary: 'إنشاء شركة جديدة' })
  @ApiResponse({ status: 201, description: 'تم إنشاء الشركة بنجاح' })
  async create(
    @Body() createCompanyDto: CreateCompanyDto,
    @CurrentUser() user,
  ) {
    return {
      success: true,
      data: {
        company: await this.companiesService.create(createCompanyDto, user.id),
      },
    };
  }

  @Get()
  @ApiOperation({ summary: 'الحصول على قائمة الشركات' })
  async findAll(@Query() query: QueryCompanyDto, @CurrentUser() user) {
    return {
      success: true,
      data: await this.companiesService.findAll(query, user.id, user.role),
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'الحصول على شركة محددة' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return {
      success: true,
      data: {
        company: await this.companiesService.findOne(id),
      },
    };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'تحديث بيانات الشركة' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateCompanyDto: UpdateCompanyDto,
  ) {
    return {
      success: true,
      data: {
        company: await this.companiesService.update(id, updateCompanyDto),
      },
    };
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'حذف الشركة' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.companiesService.remove(id);
    return {
      success: true,
      message: 'تم حذف الشركة بنجاح',
    };
  }
}
```

### DTOs

```typescript
// companies/dto/create-company.dto.ts
import {
  IsString,
  IsOptional,
  IsEnum,
  IsEmail,
  IsDateString,
  IsArray,
  IsObject,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CompanyType } from '@prisma/client';

export class CreateCompanyDto {
  @ApiProperty({ description: 'اسم الشركة' })
  @IsString()
  @MinLength(3, { message: 'اسم الشركة يجب أن يكون 3 أحرف على الأقل' })
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({ description: 'اسم الشركة بالعربية' })
  @IsOptional()
  @IsString()
  nameArabic?: string;

  @ApiPropertyOptional({ description: 'وصف الشركة' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({ enum: CompanyType })
  @IsOptional()
  @IsEnum(CompanyType)
  companyType?: CompanyType;

  @ApiPropertyOptional({ description: 'رقم السجل التجاري' })
  @IsOptional()
  @IsString()
  @Matches(/^\d{10}$/, { message: 'رقم السجل التجاري يجب أن يكون 10 أرقام' })
  commercialRegistration?: string;

  @ApiPropertyOptional({ description: 'الرقم الضريبي' })
  @IsOptional()
  @IsString()
  @Matches(/^\d{15}$/, { message: 'الرقم الضريبي يجب أن يكون 15 رقم' })
  taxNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  establishmentDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  primaryEmail?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  primaryPhone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  customFields?: Record<string, any>;
}
```

```typescript
// companies/dto/query-company.dto.ts
import { IsOptional, IsInt, Min, Max, IsEnum, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CompanyStatus } from '@prisma/client';

export class QueryCompanyDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({ enum: CompanyStatus })
  @IsOptional()
  @IsEnum(CompanyStatus)
  status?: CompanyStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ default: 'createdAt' })
  @IsOptional()
  @IsString()
  sort?: string = 'createdAt';

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'desc' })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  order?: 'asc' | 'desc' = 'desc';
}
```

---

## 📄 رفع الملفات (File Upload)

### File Upload Interceptor

```typescript
// storage/interceptors/file-upload.interceptor.ts
import { Injectable, NestInterceptor, ExecutionContext, CallHandler, BadRequestException } from '@nestjs/common';
import { Observable } from 'rxjs';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuid } from 'uuid';

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/gif',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export function FileUploadInterceptor(fieldName: string = 'file') {
  return FileInterceptor(fieldName, {
    storage: diskStorage({
      destination: process.env.UPLOAD_DIR || './uploads/temp',
      filename: (req, file, cb) => {
        const uniqueName = `${uuid()}${extname(file.originalname)}`;
        cb(null, uniqueName);
      },
    }),
    fileFilter: (req, file, cb) => {
      if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        return cb(
          new BadRequestException(`نوع الملف ${file.mimetype} غير مسموح`),
          false,
        );
      }
      cb(null, true);
    },
    limits: {
      fileSize: MAX_FILE_SIZE,
    },
  });
}
```

### Documents Controller with File Upload

```typescript
// documents/documents.controller.ts
import {
  Controller,
  Post,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Body,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FileUploadInterceptor } from '../../storage/interceptors/file-upload.interceptor';
import { DocumentsService } from './documents.service';
import { UploadDocumentDto } from './dto/upload-document.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('documents')
@UseGuards(JwtAuthGuard)
@Controller('companies/:companyId/documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post()
  @UseInterceptors(FileUploadInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        name: { type: 'string' },
        category: { type: 'string' },
        description: { type: 'string' },
      },
    },
  })
  async uploadDocument(
    @Param('companyId', ParseUUIDPipe) companyId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() uploadDocumentDto: UploadDocumentDto,
    @CurrentUser() user,
  ) {
    return {
      success: true,
      data: {
        document: await this.documentsService.upload(
          companyId,
          file,
          uploadDocumentDto,
          user.id,
        ),
      },
    };
  }
}
```

---

## 🌐 WebSocket للإشعارات

### Notifications Gateway

```typescript
// notifications/notifications.gateway.ts
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { WsJwtGuard } from './guards/ws-jwt.guard';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
})
export class NotificationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private connectedUsers = new Map<string, string>(); // userId -> socketId

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    // Remove user from connected users
    for (const [userId, socketId] of this.connectedUsers.entries()) {
      if (socketId === client.id) {
        this.connectedUsers.delete(userId);
        break;
      }
    }
    console.log(`Client disconnected: ${client.id}`);
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('register')
  handleRegister(client: Socket, userId: string) {
    this.connectedUsers.set(userId, client.id);
    client.emit('registered', { success: true });
  }

  // Send notification to specific user
  sendToUser(userId: string, event: string, data: any) {
    const socketId = this.connectedUsers.get(userId);
    if (socketId) {
      this.server.to(socketId).emit(event, data);
    }
  }

  // Broadcast to all connected clients
  broadcast(event: string, data: any) {
    this.server.emit(event, data);
  }
}
```

---

## 🛡️ Global Exception Filter

```typescript
// common/filters/all-exceptions.filter.ts
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'حدث خطأ داخلي في الخادم';
    let code = 'INTERNAL_ERROR';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object') {
        message = exceptionResponse['message'] || message;
        code = exceptionResponse['error'] || code;
      } else {
        message = exceptionResponse;
      }
    }

    response.status(status).json({
      success: false,
      error: {
        code,
        message,
        statusCode: status,
        timestamp: new Date().toISOString(),
      },
    });
  }
}
```

---

## 📚 للمزيد

راجع الملفات الأخرى:
- [API_DOCUMENTATION.md](API_DOCUMENTATION.md) - توثيق الـ API الكامل
- [SECURITY_GUIDE.md](SECURITY_GUIDE.md) - دليل الأمان
- [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md) - بنية المشروع

---

**آخر تحديث**: نوفمبر 2025

