# 🔐 دليل الأمان والحماية (Security Guide)

## نظرة عامة

هذا الدليل يغطي جميع جوانب الأمان في نظام إدارة الشركات والوثائق.

---

## 🛡️ طبقات الأمان

### 1. أمان المصادقة (Authentication Security)

#### JWT (JSON Web Tokens)
```typescript
// Token Structure
{
  // Access Token (Short-lived)
  access_token: {
    payload: {
      user_id: "uuid",
      email: "user@example.com",
      role: "employee",
      session_id: "uuid"
    },
    expiry: "15 minutes"
  },
  
  // Refresh Token (Long-lived)
  refresh_token: {
    payload: {
      user_id: "uuid",
      session_id: "uuid",
      token_version: 1
    },
    expiry: "7 days"
  }
}
```

#### أفضل الممارسات:
```typescript
// backend/src/utils/jwt.util.ts

import jwt from 'jsonwebtoken';
import crypto from 'crypto';

// توليد Access Token
export const generateAccessToken = (payload: TokenPayload): string => {
  return jwt.sign(
    payload,
    process.env.JWT_SECRET!,
    {
      expiresIn: '15m',
      algorithm: 'HS256',
      issuer: 'company-docs-api',
      audience: 'company-docs-app'
    }
  );
};

// توليد Refresh Token
export const generateRefreshToken = (payload: RefreshTokenPayload): string => {
  return jwt.sign(
    payload,
    process.env.JWT_REFRESH_SECRET!,
    {
      expiresIn: '7d',
      algorithm: 'HS256',
      issuer: 'company-docs-api',
      audience: 'company-docs-app'
    }
  );
};

// التحقق من Token
export const verifyAccessToken = (token: string): TokenPayload => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET!, {
      algorithms: ['HS256'],
      issuer: 'company-docs-api',
      audience: 'company-docs-app'
    }) as TokenPayload;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('TOKEN_EXPIRED');
    }
    throw new Error('INVALID_TOKEN');
  }
};

// توليد CSRF Token
export const generateCsrfToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};
```

#### Token Rotation Strategy
```typescript
// backend/src/services/auth.service.ts

export class AuthService {
  async refreshTokens(refreshToken: string): Promise<TokenPair> {
    // 1. التحقق من الـ refresh token
    const payload = verifyRefreshToken(refreshToken);
    
    // 2. التحقق من الجلسة في قاعدة البيانات
    const session = await prisma.session.findUnique({
      where: { refreshToken },
      include: { user: true }
    });
    
    if (!session || !session.isActive) {
      throw new Error('INVALID_SESSION');
    }
    
    // 3. التحقق من token_version لمنع replay attacks
    if (session.tokenVersion !== payload.token_version) {
      // حذف جميع جلسات المستخدم (potential security breach)
      await prisma.session.deleteMany({
        where: { userId: payload.user_id }
      });
      throw new Error('SECURITY_BREACH_DETECTED');
    }
    
    // 4. توليد tokens جديدة
    const newAccessToken = generateAccessToken({
      user_id: session.userId,
      email: session.user.email,
      role: session.user.role,
      session_id: session.id
    });
    
    const newRefreshToken = generateRefreshToken({
      user_id: session.userId,
      session_id: session.id,
      token_version: session.tokenVersion + 1
    });
    
    // 5. تحديث الجلسة
    await prisma.session.update({
      where: { id: session.id },
      data: {
        refreshToken: newRefreshToken,
        tokenVersion: session.tokenVersion + 1,
        lastUsedAt: new Date()
      }
    });
    
    return {
      access_token: newAccessToken,
      refresh_token: newRefreshToken
    };
  }
}
```

### 2. أمان كلمات المرور (Password Security)

#### Hashing Strategy
```typescript
// backend/src/utils/hash.util.ts

import bcrypt from 'bcrypt';

const BCRYPT_ROUNDS = 12; // توازن بين الأمان والأداء

// تشفير كلمة المرور
export const hashPassword = async (password: string): Promise<string> => {
  // التحقق من قوة كلمة المرور
  validatePasswordStrength(password);
  
  return bcrypt.hash(password, BCRYPT_ROUNDS);
};

// التحقق من كلمة المرور
export const comparePassword = async (
  password: string,
  hash: string
): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

// التحقق من قوة كلمة المرور
export const validatePasswordStrength = (password: string): boolean => {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  if (password.length < minLength) {
    throw new Error('كلمة المرور يجب أن تكون 8 أحرف على الأقل');
  }
  
  const strengthScore = [
    hasUpperCase,
    hasLowerCase,
    hasNumbers,
    hasSpecialChar
  ].filter(Boolean).length;
  
  if (strengthScore < 3) {
    throw new Error(
      'كلمة المرور يجب أن تحتوي على أحرف كبيرة وصغيرة وأرقام أو رموز خاصة'
    );
  }
  
  return true;
};

// كشف كلمات المرور الشائعة
export const isCommonPassword = (password: string): boolean => {
  const commonPasswords = [
    'password', '123456', '12345678', 'qwerty', 'abc123',
    'password123', '111111', '123123', 'admin', 'letmein'
  ];
  
  return commonPasswords.includes(password.toLowerCase());
};
```

#### حماية ضد Brute Force
```typescript
// backend/src/middlewares/rate-limit.middleware.ts

import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { redisClient } from '../config/redis';

// Rate limiter للـ login
export const loginRateLimiter = rateLimit({
  store: new RedisStore({
    client: redisClient,
    prefix: 'rl:login:'
  }),
  windowMs: 15 * 60 * 1000, // 15 دقيقة
  max: 5, // 5 محاولات كحد أقصى
  skipSuccessfulRequests: true,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'تم تجاوز عدد المحاولات المسموح. يرجى المحاولة بعد 15 دقيقة',
        retryAfter: 15 * 60
      }
    });
  },
  keyGenerator: (req) => {
    // استخدام IP + Email للـ rate limiting
    return `${req.ip}:${req.body.email || 'unknown'}`;
  }
});

// Rate limiter عام للـ API
export const apiRateLimiter = rateLimit({
  store: new RedisStore({
    client: redisClient,
    prefix: 'rl:api:'
  }),
  windowMs: 60 * 1000, // دقيقة واحدة
  max: 100, // 100 طلب في الدقيقة
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // استخدام user_id إن وجد، وإلا IP
    return req.user?.id || req.ip;
  }
});

// حماية خاصة لرفع الملفات
export const uploadRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // ساعة واحدة
  max: 50, // 50 رفع في الساعة
  skipSuccessfulRequests: false
});
```

### 3. أمان الصلاحيات (Authorization Security)

#### Role-Based Access Control (RBAC)
```typescript
// backend/src/middlewares/permissions.middleware.ts

import { Request, Response, NextFunction } from 'express';
import { UserRole } from '@prisma/client';

// التحقق من الدور
export const requireRole = (...allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'يجب تسجيل الدخول'
        }
      });
    }
    
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'لا تملك الصلاحية للوصول لهذا المورد'
        }
      });
    }
    
    next();
  };
};

// التحقق من الصلاحية على مورد معين
export const requirePermission = (
  resource: string,
  action: 'read' | 'create' | 'update' | 'delete'
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const { user } = req;
    
    // Super admin له صلاحية كاملة
    if (user.role === UserRole.SUPER_ADMIN) {
      return next();
    }
    
    // التحقق من الصلاحية حسب المورد
    const hasPermission = await checkPermission(
      user.id,
      user.role,
      resource,
      action,
      req.params
    );
    
    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'لا تملك الصلاحية لتنفيذ هذا الإجراء'
        }
      });
    }
    
    next();
  };
};

// التحقق من ملكية المورد
export const requireOwnership = (resourceType: 'company' | 'document') => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const { user } = req;
    const resourceId = req.params.id;
    
    // Admins يتجاوزون فحص الملكية
    if ([UserRole.SUPER_ADMIN, UserRole.ADMIN].includes(user.role)) {
      return next();
    }
    
    let isOwner = false;
    
    if (resourceType === 'company') {
      const company = await prisma.company.findUnique({
        where: { id: resourceId },
        select: { ownerId: true }
      });
      isOwner = company?.ownerId === user.id;
    } else if (resourceType === 'document') {
      const document = await prisma.document.findUnique({
        where: { id: resourceId },
        include: { company: { select: { ownerId: true } } }
      });
      isOwner = document?.company.ownerId === user.id;
    }
    
    if (!isOwner) {
      // التحقق من المشاركة
      const hasAccess = await checkSharedAccess(user.id, resourceId, resourceType);
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'لا تملك الصلاحية للوصول لهذا المورد'
          }
        });
      }
    }
    
    next();
  };
};

// مصفوفة الصلاحيات
const PERMISSIONS = {
  [UserRole.SUPER_ADMIN]: {
    companies: ['read', 'create', 'update', 'delete'],
    documents: ['read', 'create', 'update', 'delete', 'approve', 'reject'],
    users: ['read', 'create', 'update', 'delete'],
    settings: ['read', 'update'],
    audit: ['read']
  },
  [UserRole.ADMIN]: {
    companies: ['read', 'create', 'update', 'delete'],
    documents: ['read', 'create', 'update', 'delete', 'approve', 'reject'],
    users: ['read', 'create', 'update'],
    settings: ['read'],
    audit: ['read']
  },
  [UserRole.SUPERVISOR]: {
    companies: ['read'],
    documents: ['read', 'approve', 'reject'],
    users: ['read'],
    settings: [],
    audit: []
  },
  [UserRole.EMPLOYEE]: {
    companies: ['read', 'create', 'update'], // own only
    documents: ['read', 'create', 'update'], // own only
    users: ['read'],
    settings: [],
    audit: []
  },
  [UserRole.AUDITOR]: {
    companies: ['read'],
    documents: ['read'],
    users: ['read'],
    settings: [],
    audit: ['read']
  }
};
```

### 4. أمان الملفات (File Security)

#### File Upload Security
```typescript
// backend/src/middlewares/upload.middleware.ts

import multer from 'multer';
import path from 'path';
import crypto from 'crypto';

// الأنواع المسموحة
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/gif',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
];

// الامتدادات المسموحة
const ALLOWED_EXTENSIONS = [
  '.pdf', '.jpg', '.jpeg', '.png', '.gif',
  '.doc', '.docx', '.xls', '.xlsx'
];

// الحد الأقصى لحجم الملف (50MB)
const MAX_FILE_SIZE = 50 * 1024 * 1024;

// إعداد multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, process.env.UPLOAD_DIR || './uploads/temp');
  },
  filename: (req, file, cb) => {
    // توليد اسم فريد للملف
    const uniqueName = `${crypto.randomUUID()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

// File filter
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // التحقق من MIME type
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    return cb(new Error(`نوع الملف ${file.mimetype} غير مسموح`));
  }
  
  // التحقق من الامتداد
  const ext = path.extname(file.originalname).toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return cb(new Error(`امتداد الملف ${ext} غير مسموح`));
  }
  
  // التحقق من اسم الملف (منع path traversal)
  if (file.originalname.includes('..') || file.originalname.includes('/')) {
    return cb(new Error('اسم ملف غير صالح'));
  }
  
  cb(null, true);
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 10 // حد أقصى 10 ملفات في المرة الواحدة
  }
});

// Virus scanning
export const scanForVirus = async (filePath: string): Promise<boolean> => {
  if (!process.env.VIRUS_SCAN_ENABLED) {
    return true;
  }
  
  // استخدام ClamAV للفحص
  const NodeClam = require('clamscan');
  
  const clamscan = await new NodeClam().init({
    clamdscan: {
      host: process.env.CLAMAV_HOST || 'localhost',
      port: process.env.CLAMAV_PORT || 3310
    }
  });
  
  const { isInfected, viruses } = await clamscan.isInfected(filePath);
  
  if (isInfected) {
    console.error(`Virus detected in ${filePath}:`, viruses);
    // حذف الملف المصاب
    await fs.unlink(filePath);
    return false;
  }
  
  return true;
};

// Image sanitization (إزالة metadata)
export const sanitizeImage = async (filePath: string): Promise<void> => {
  const sharp = require('sharp');
  
  const tempPath = `${filePath}.temp`;
  
  await sharp(filePath)
    .rotate() // تصحيح التوجيه
    .withMetadata(false) // إزالة EXIF metadata
    .toFile(tempPath);
  
  await fs.rename(tempPath, filePath);
};

// حساب checksum للملف
export const calculateChecksum = async (filePath: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);
    
    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', reject);
  });
};
```

### 5. أمان قاعدة البيانات (Database Security)

#### SQL Injection Prevention
```typescript
// استخدام Prisma يمنع SQL injection تلقائياً

// ❌ خطأ - raw SQL بدون parameterization
const unsafeQuery = await prisma.$queryRawUnsafe(
  `SELECT * FROM users WHERE email = '${email}'`
);

// ✅ صحيح - استخدام parameterized queries
const safeQuery = await prisma.$queryRaw`
  SELECT * FROM users WHERE email = ${email}
`;

// ✅ الأفضل - استخدام Prisma Client
const user = await prisma.user.findUnique({
  where: { email }
});
```

#### Database Connection Security
```typescript
// backend/src/config/database.ts

import { PrismaClient } from '@prisma/client';

const prismaOptions = {
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  },
  log: process.env.NODE_ENV === 'development' 
    ? ['query', 'error', 'warn'] 
    : ['error']
};

// Connection pooling
const prisma = new PrismaClient({
  ...prismaOptions,
  // تشفير الاتصال
  datasources: {
    db: {
      url: `${process.env.DATABASE_URL}?sslmode=require&sslcert=/path/to/cert.pem`
    }
  }
});

// مراقبة الاتصالات
prisma.$on('query', (e) => {
  if (e.duration > 1000) {
    console.warn(`Slow query detected: ${e.query} (${e.duration}ms)`);
  }
});

export default prisma;
```

#### Row-Level Security
```sql
-- تفعيل RLS على جدول الشركات
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- سياسة القراءة: المستخدم يرى شركاته أو المشاركة معه فقط
CREATE POLICY company_read_policy ON companies
  FOR SELECT
  USING (
    owner_id = current_setting('app.current_user_id')::UUID
    OR id IN (
      SELECT company_id FROM company_shares 
      WHERE shared_with_user_id = current_setting('app.current_user_id')::UUID
        AND status = 'active'
    )
    OR current_setting('app.current_user_role') IN ('super_admin', 'admin', 'supervisor')
  );

-- سياسة التعديل: المالك فقط أو الـ admin
CREATE POLICY company_update_policy ON companies
  FOR UPDATE
  USING (
    owner_id = current_setting('app.current_user_id')::UUID
    OR current_setting('app.current_user_role') IN ('super_admin', 'admin')
  );
```

### 6. أمان الـ API (API Security)

#### Input Validation
```typescript
// backend/src/validators/companies.validator.ts

import { z } from 'zod';

// مخطط إنشاء شركة
export const createCompanySchema = z.object({
  name: z.string()
    .min(3, 'اسم الشركة يجب أن يكون 3 أحرف على الأقل')
    .max(255, 'اسم الشركة يجب ألا يتجاوز 255 حرف')
    .trim(),
  
  description: z.string()
    .max(1000, 'الوصف يجب ألا يتجاوز 1000 حرف')
    .optional(),
  
  commercialRegistration: z.string()
    .regex(/^\d{10}$/, 'رقم السجل التجاري يجب أن يكون 10 أرقام')
    .optional(),
  
  taxNumber: z.string()
    .regex(/^\d{15}$/, 'الرقم الضريبي يجب أن يكون 15 رقم')
    .optional(),
  
  primaryEmail: z.string()
    .email('البريد الإلكتروني غير صالح')
    .optional(),
  
  primaryPhone: z.string()
    .regex(/^\+?[1-9]\d{1,14}$/, 'رقم الهاتف غير صالح')
    .optional(),
  
  website: z.string()
    .url('رابط الموقع غير صالح')
    .optional(),
  
  tags: z.array(z.string())
    .max(10, 'يمكن إضافة 10 وسوم كحد أقصى')
    .optional()
});

// Middleware للتحقق
export const validateRequest = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'خطأ في البيانات المدخلة',
            details: error.errors.reduce((acc, err) => {
              acc[err.path.join('.')] = err.message;
              return acc;
            }, {})
          }
        });
      }
      next(error);
    }
  };
};
```

#### XSS Prevention
```typescript
// backend/src/utils/sanitize.util.ts

import DOMPurify from 'isomorphic-dompurify';

// تنظيف HTML
export const sanitizeHtml = (dirty: string): string => {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
    ALLOWED_ATTR: ['href']
  });
};

// تنظيف النصوص
export const sanitizeText = (text: string): string => {
  return text
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

// تنظيف الكائنات
export const sanitizeObject = (obj: any): any => {
  if (typeof obj === 'string') {
    return sanitizeText(obj);
  }
  
  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }
  
  if (typeof obj === 'object' && obj !== null) {
    const sanitized: any = {};
    for (const key in obj) {
      sanitized[key] = sanitizeObject(obj[key]);
    }
    return sanitized;
  }
  
  return obj;
};
```

#### CORS Configuration
```typescript
// backend/src/middlewares/cors.middleware.ts

import cors from 'cors';

const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:3000',
  'https://companydocs.com',
  'https://www.companydocs.com'
].filter(Boolean);

export const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // السماح بـ requests بدون origin (mobile apps, postman, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'X-CSRF-Token'
  ],
  exposedHeaders: [
    'X-RateLimit-Limit',
    'X-RateLimit-Remaining',
    'X-RateLimit-Reset'
  ],
  maxAge: 86400 // 24 hours
};
```

#### CSRF Protection
```typescript
// backend/src/middlewares/csrf.middleware.ts

import csrf from 'csurf';

export const csrfProtection = csrf({
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  }
});

// إرسال CSRF token للـ frontend
export const sendCsrfToken = (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      csrfToken: req.csrfToken()
    }
  });
};
```

### 7. أمان MinIO (Storage Security)

#### MinIO Configuration
```typescript
// backend/src/config/minio.ts

import { Client } from 'minio';

export const minioClient = new Client({
  endPoint: process.env.MINIO_ENDPOINT!,
  port: parseInt(process.env.MINIO_PORT || '9000'),
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY!,
  secretKey: process.env.MINIO_SECRET_KEY!
});

// إنشاء bucket مع سياسة أمان
export const initializeBucket = async () => {
  const bucketName = process.env.MINIO_BUCKET!;
  
  const exists = await minioClient.bucketExists(bucketName);
  
  if (!exists) {
    await minioClient.makeBucket(bucketName, 'us-east-1');
    
    // تعيين سياسة الوصول (private by default)
    const policy = {
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Deny',
          Principal: '*',
          Action: ['s3:GetObject'],
          Resource: [`arn:aws:s3:::${bucketName}/*`]
        }
      ]
    };
    
    await minioClient.setBucketPolicy(bucketName, JSON.stringify(policy));
    
    // تفعيل التشفير
    await minioClient.setBucketEncryption(bucketName, {
      Rule: [{
        ApplyServerSideEncryptionByDefault: {
          SSEAlgorithm: 'AES256'
        }
      }]
    });
    
    // تفعيل versioning
    await minioClient.setBucketVersioning(bucketName, {
      Status: 'Enabled'
    });
  }
};

// توليد presigned URL آمن
export const getPresignedDownloadUrl = async (
  objectName: string,
  expirySeconds: number = 3600 // ساعة واحدة
): Promise<string> => {
  return minioClient.presignedGetObject(
    process.env.MINIO_BUCKET!,
    objectName,
    expirySeconds
  );
};

// رفع ملف مع تشفير
export const uploadFileSecurely = async (
  objectName: string,
  filePath: string,
  metadata: any = {}
): Promise<void> => {
  await minioClient.fPutObject(
    process.env.MINIO_BUCKET!,
    objectName,
    filePath,
    {
      ...metadata,
      'x-amz-server-side-encryption': 'AES256'
    }
  );
};
```

### 8. Audit Logging

#### Comprehensive Audit Trail
```typescript
// backend/src/services/audit.service.ts

export class AuditService {
  static async log(params: AuditLogParams): Promise<void> {
    const {
      userId,
      action,
      resourceType,
      resourceId,
      ipAddress,
      userAgent,
      status,
      details,
      oldValues,
      newValues
    } = params;
    
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        resourceType,
        resourceId,
        ipAddress,
        userAgent,
        status,
        details,
        oldValues: oldValues ? JSON.stringify(oldValues) : null,
        newValues: newValues ? JSON.stringify(newValues) : null
      }
    });
    
    // إرسال تنبيه للأحداث الحساسة
    if (isSensitiveAction(action)) {
      await notifySensitiveAction(params);
    }
  }
  
  // تنبيه الأحداث المشبوهة
  static async detectSuspiciousActivity(userId: string): Promise<void> {
    const recentLogs = await prisma.auditLog.findMany({
      where: {
        userId,
        createdAt: {
          gte: new Date(Date.now() - 3600000) // آخر ساعة
        }
      }
    });
    
    // كشف النشاط غير الطبيعي
    const failedAttempts = recentLogs.filter(log => 
      log.status === 'failure' && 
      ['LOGIN', 'DOWNLOAD'].includes(log.action)
    );
    
    if (failedAttempts.length > 10) {
      // إيقاف الحساب مؤقتاً
      await prisma.user.update({
        where: { id: userId },
        data: { status: 'SUSPENDED' }
      });
      
      // إرسال تنبيه للمدراء
      await notifyAdmins({
        type: 'SUSPICIOUS_ACTIVITY',
        userId,
        details: `تم إيقاف الحساب مؤقتاً بسبب ${failedAttempts.length} محاولة فاشلة`
      });
    }
  }
}
```

---

## 🔒 Security Checklist

### Pre-Deployment
- [ ] تحديث جميع dependencies
- [ ] تفعيل HTTPS
- [ ] تغيير جميع المفاتيح الافتراضية (JWT, DB, MinIO)
- [ ] تفعيل rate limiting
- [ ] تفعيل CSRF protection
- [ ] إعداد WAF (Web Application Firewall)
- [ ] تفعيل DDoS protection
- [ ] إعداد backup تلقائي
- [ ] تفعيل audit logging
- [ ] مراجعة permissions matrix
- [ ] اختبار penetration testing

### Post-Deployment
- [ ] مراقبة logs بشكل دوري
- [ ] مراجعة audit logs
- [ ] تحديث security patches
- [ ] اختبارات أمان دورية
- [ ] مراجعة access controls
- [ ] فحص الثغرات

---

## 🚨 Incident Response Plan

### في حالة اختراق أمني:

1. **احتواء الحادث**
   - عزل النظام المخترق
   - إيقاف الخدمات المتأثرة
   - حفظ الأدلة

2. **التحقيق**
   - فحص audit logs
   - تحديد نقطة الاختراق
   - تقييم الأضرار

3. **الاستجابة**
   - إصلاح الثغرة
   - تغيير جميع المفاتيح والكلمات
   - تحديث النظام
   - إعادة التشغيل

4. **الإبلاغ**
   - إخطار المستخدمين المتأثرين
   - توثيق الحادث
   - تحديث سياسات الأمان

5. **الوقاية**
   - تحسين الأمان
   - تدريب الفريق
   - تحديث الإجراءات

---

## 📚 مراجع إضافية

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [CWE/SANS Top 25](https://cwe.mitre.org/top25/)
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)

