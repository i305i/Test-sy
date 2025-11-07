# 🔄 دليل الانتقال من Express إلى NestJS

## نظرة عامة

هذا الدليل يوضح الاختلافات الرئيسية بين Express و NestJS وكيفية الانتقال بينهما.

---

## 🎯 لماذا NestJS؟

### مميزات NestJS على Express

| الميزة | Express | NestJS |
|--------|---------|--------|
| **البنية** | مرنة جداً، قد تؤدي للفوضى | منظمة ومعيارية |
| **TypeScript** | يحتاج إعداد يدوي | Native و First-class |
| **Dependency Injection** | غير موجود | مدمج بالكامل |
| **Decorators** | غير موجود | مستخدم بكثرة |
| **Testing** | يحتاج setup يدوي | مدمج وسهل |
| **Documentation** | Swagger يدوي | Swagger مدمج |
| **Modularity** | يدوي | مدمج في البنية |
| **WebSocket** | مكتبة خارجية | مدمج |
| **GraphQL** | مكتبة خارجية | مدمج |
| **Microservices** | يدوي | مدمج |

---

## 📊 مقارنة الكود

### 1. إنشاء Route

#### Express
```typescript
// routes/companies.routes.ts
import { Router } from 'express';
import { CompaniesController } from '../controllers/companies.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { validateRequest } from '../middlewares/validation.middleware';
import { createCompanySchema } from '../validators/companies.validator';

const router = Router();
const companiesController = new CompaniesController();

router.post(
  '/',
  authMiddleware,
  validateRequest(createCompanySchema),
  companiesController.create
);

router.get(
  '/',
  authMiddleware,
  companiesController.findAll
);

export default router;
```

#### NestJS
```typescript
// companies/companies.controller.ts
import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { CompaniesService } from './companies.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('companies')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('companies')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Post()
  create(@Body() dto: CreateCompanyDto, @CurrentUser() user) {
    return this.companiesService.create(dto, user.id);
  }

  @Get()
  findAll(@CurrentUser() user) {
    return this.companiesService.findAll(user.id);
  }
}
```

**الفرق الرئيسي**: NestJS يستخدم Decorators بشكل مكثف ويدمج التوثيق تلقائياً.

---

### 2. Service Layer

#### Express
```typescript
// services/companies.service.ts
import { prisma } from '../config/database';
import { CreateCompanyDto } from '../types/companies.types';

export class CompaniesService {
  async create(data: CreateCompanyDto, userId: string) {
    return prisma.company.create({
      data: {
        ...data,
        ownerId: userId,
      },
    });
  }

  async findAll(userId: string) {
    return prisma.company.findMany({
      where: { ownerId: userId },
    });
  }
}

export const companiesService = new CompaniesService();
```

#### NestJS
```typescript
// companies/companies.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateCompanyDto } from './dto/create-company.dto';

@Injectable()
export class CompaniesService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateCompanyDto, userId: string) {
    return this.prisma.company.create({
      data: {
        ...data,
        ownerId: userId,
      },
    });
  }

  async findAll(userId: string) {
    return this.prisma.company.findMany({
      where: { ownerId: userId },
    });
  }
}
```

**الفرق الرئيسي**: NestJS يستخدم Dependency Injection، لا حاجة لـ singleton patterns يدوية.

---

### 3. Validation

#### Express (Zod)
```typescript
// validators/companies.validator.ts
import { z } from 'zod';

export const createCompanySchema = z.object({
  name: z.string().min(3).max(255),
  description: z.string().max(1000).optional(),
  commercialRegistration: z.string().regex(/^\d{10}$/).optional(),
});

// middleware
export const validateRequest = (schema: z.ZodSchema) => {
  return (req, res, next) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      res.status(400).json({ success: false, error: error.errors });
    }
  };
};
```

#### NestJS (class-validator)
```typescript
// dto/create-company.dto.ts
import { IsString, IsOptional, MinLength, MaxLength, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCompanyDto {
  @ApiProperty()
  @IsString()
  @MinLength(3)
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Matches(/^\d{10}$/)
  commercialRegistration?: string;
}
```

**الفرق الرئيسي**: NestJS يستخدم class-validator مع decorators، والتوثيق مدمج مع Swagger تلقائياً.

---

### 4. Authentication Middleware/Guard

#### Express
```typescript
// middlewares/auth.middleware.ts
import jwt from 'jsonwebtoken';

export const authMiddleware = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        error: 'No token provided' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ 
      success: false, 
      error: 'Invalid token' 
    });
  }
};
```

#### NestJS
```typescript
// auth/guards/jwt-auth.guard.ts
import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(
      IS_PUBLIC_KEY,
      [context.getHandler(), context.getClass()],
    );
    
    if (isPublic) {
      return true;
    }
    
    return super.canActivate(context);
  }
}

// auth/strategies/jwt.strategy.ts
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.get('JWT_SECRET'),
    });
  }

  async validate(payload: any) {
    return { 
      id: payload.sub, 
      email: payload.email, 
      role: payload.role 
    };
  }
}
```

**الفرق الرئيسي**: NestJS يستخدم Passport Strategies مع Guards، أكثر تنظيماً وقابلية للتوسع.

---

### 5. Error Handling

#### Express
```typescript
// middlewares/error.middleware.ts
export const errorMiddleware = (err, req, res, next) => {
  console.error(err.stack);

  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';

  res.status(status).json({
    success: false,
    error: {
      message,
      status,
    },
  });
};

// app.ts
app.use(errorMiddleware);
```

#### NestJS
```typescript
// common/filters/http-exception.filter.ts
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal server error';

    response.status(status).json({
      success: false,
      error: {
        message,
        status,
        timestamp: new Date().toISOString(),
      },
    });
  }
}

// main.ts
app.useGlobalFilters(new AllExceptionsFilter());
```

**الفرق الرئيسي**: NestJS يستخدم Exception Filters مع دعم أفضل للـ types و context.

---

### 6. Dependency Injection

#### Express (Manual)
```typescript
// services/companies.service.ts
import { prisma } from '../config/database';
import { storageService } from './storage.service';
import { notificationsService } from './notifications.service';

export class CompaniesService {
  constructor() {
    this.prisma = prisma;
    this.storageService = storageService;
    this.notificationsService = notificationsService;
  }

  // methods...
}

export const companiesService = new CompaniesService();
```

#### NestJS (Automatic DI)
```typescript
// companies/companies.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { StorageService } from '../storage/storage.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class CompaniesService {
  constructor(
    private prisma: PrismaService,
    private storageService: StorageService,
    private notificationsService: NotificationsService,
  ) {}

  // methods...
}

// companies/companies.module.ts
@Module({
  providers: [CompaniesService, PrismaService, StorageService, NotificationsService],
  // NestJS handles injection automatically!
})
export class CompaniesModule {}
```

**الفرق الرئيسي**: NestJS يدير الـ dependencies تلقائياً، مما يسهل Testing و Mocking.

---

### 7. Testing

#### Express
```typescript
// companies.service.test.ts
import { CompaniesService } from './companies.service';
import { prisma } from '../config/database';

// Manual mocking
jest.mock('../config/database', () => ({
  prisma: {
    company: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
  },
}));

describe('CompaniesService', () => {
  let service: CompaniesService;

  beforeEach(() => {
    service = new CompaniesService();
  });

  it('should create a company', async () => {
    const mockCompany = { id: '1', name: 'Test' };
    (prisma.company.create as jest.Mock).mockResolvedValue(mockCompany);

    const result = await service.create({ name: 'Test' }, 'user-id');
    expect(result).toEqual(mockCompany);
  });
});
```

#### NestJS
```typescript
// companies.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { CompaniesService } from './companies.service';
import { PrismaService } from '../database/prisma.service';

describe('CompaniesService', () => {
  let service: CompaniesService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CompaniesService,
        {
          provide: PrismaService,
          useValue: {
            company: {
              create: jest.fn(),
              findMany: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<CompaniesService>(CompaniesService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should create a company', async () => {
    const mockCompany = { id: '1', name: 'Test' };
    jest.spyOn(prisma.company, 'create').mockResolvedValue(mockCompany);

    const result = await service.create({ name: 'Test' }, 'user-id');
    expect(result).toEqual(mockCompany);
  });
});
```

**الفرق الرئيسي**: NestJS يوفر Testing Module مدمج يسهل الـ mocking و DI في الاختبارات.

---

## 🔧 خطوات الانتقال

### 1. إعداد مشروع NestJS جديد

```bash
npm i -g @nestjs/cli
nest new company-docs-backend
cd company-docs-backend
```

### 2. تثبيت الحزم المطلوبة

```bash
# نفس الحزم من Express + حزم NestJS
npm install @nestjs/config @nestjs/jwt @nestjs/passport
npm install @nestjs/swagger @nestjs/throttler
npm install passport passport-jwt bcrypt
npm install @prisma/client class-validator class-transformer
```

### 3. نقل الكود تدريجياً

#### الخطوة 1: نقل الـ Models/Entities
- نقل Prisma Schema كما هو
- إنشاء PrismaService في NestJS

#### الخطوة 2: نقل Services
- تحويل Services لاستخدام `@Injectable()`
- استخدام DI للـ dependencies

#### الخطوة 3: نقل Controllers
- تحويل Routes إلى Controllers مع Decorators
- إضافة DTOs للـ validation

#### الخطوة 4: نقل Middlewares
- تحويل Middlewares إلى Guards/Interceptors/Filters حسب الحاجة

#### الخطوة 5: إنشاء Modules
- تنظيم الكود في Modules
- إعداد الـ imports/exports

### 4. اختبار كل جزء

```bash
npm run test
npm run test:e2e
```

---

## 📚 الموارد المفيدة

### التوثيق الرسمي
- [NestJS Documentation](https://docs.nestjs.com/)
- [NestJS Recipes](https://docs.nestjs.com/recipes/prisma)
- [NestJS DevTools](https://docs.nestjs.com/devtools/overview)

### أمثلة Projects
- [NestJS Sample Projects](https://github.com/nestjs/nest/tree/master/sample)
- [Awesome NestJS](https://github.com/nestjs/awesome-nestjs)

---

## ✅ Checklist للانتقال

- [ ] إعداد مشروع NestJS جديد
- [ ] نقل Prisma Schema
- [ ] إنشاء PrismaModule و PrismaService
- [ ] نقل Auth System (JWT Strategy, Guards)
- [ ] نقل Services مع DI
- [ ] نقل Controllers مع Decorators
- [ ] إنشاء DTOs للـ validation
- [ ] إعداد Swagger Documentation
- [ ] نقل Error Handling (Exception Filters)
- [ ] نقل Middlewares (Guards/Interceptors)
- [ ] إعداد Configuration Module
- [ ] إعداد Testing
- [ ] تحديث Docker Configuration
- [ ] اختبار جميع الـ Endpoints

---

## 🎯 الخلاصة

| المعيار | Express | NestJS |
|---------|---------|--------|
| **منحنى التعلم** | سهل | متوسط |
| **التنظيم** | يدوي | تلقائي |
| **المرونة** | عالية جداً | عالية |
| **للمشاريع الصغيرة** | ممتاز | جيد |
| **للمشاريع الكبيرة** | يحتاج انضباط | ممتاز |
| **الصيانة** | صعبة بدون تنظيم | سهلة |
| **Testing** | يدوي | مدمج |

**التوصية**: لمشروع بحجم "نظام إدارة الشركات والوثائق"، NestJS هو الخيار الأفضل للأسباب التالية:
1. ✅ بنية منظمة من البداية
2. ✅ سهولة الصيانة والتوسع
3. ✅ DI مدمج يسهل Testing
4. ✅ توثيق Swagger تلقائي
5. ✅ دعم مدمج للـ WebSocket و Microservices

---

**آخر تحديث**: نوفمبر 2025

