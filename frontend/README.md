# 🎨 Frontend - نظام إدارة الشركات والوثائق

## 📋 نظرة عامة

Frontend مبني على Next.js 14 مع TypeScript و Tailwind CSS.

## 🚀 البدء السريع

### 1. إعداد Environment Variables

```bash
# انسخ ملف env.example
cp env.example.txt .env.local
```

### 2. تشغيل المشروع

```bash
# Development
npm run dev

# Build
npm run build

# Production
npm start
```

الموقع سيعمل على: http://localhost:3000

## 📦 الحزم المثبتة

```json
{
  "dependencies": {
    "next": "^14.x",
    "react": "^18.x",
    "typescript": "^5.x",
    "tailwindcss": "^3.x",
    "axios": "^1.x",
    "zustand": "^4.x",
    "@tanstack/react-query": "^5.x",
    "lucide-react": "^latest",
    "date-fns": "^latest"
  }
}
```

## 🏗️ البنية المقترحة

```
frontend/
├── app/                        # Next.js App Router
│   ├── (auth)/
│   │   └── login/
│   │       └── page.tsx       # 🚧 صفحة تسجيل الدخول
│   ├── (dashboard)/
│   │   ├── layout.tsx         # 🚧 Layout مع Sidebar
│   │   ├── dashboard/
│   │   │   └── page.tsx       # 🚧 Dashboard الرئيسي
│   │   ├── companies/
│   │   │   ├── page.tsx       # 🚧 قائمة الشركات
│   │   │   ├── new/page.tsx   # 🚧 إنشاء شركة
│   │   │   └── [id]/
│   │   │       ├── page.tsx   # 🚧 تفاصيل الشركة
│   │   │       └── documents/
│   │   │           └── page.tsx # 🚧 وثائق الشركة
│   │   └── settings/
│   │       └── page.tsx       # 🚧 الإعدادات
│   └── layout.tsx             # ✅ Root Layout
│
├── components/                 # 🚧 UI Components
│   ├── ui/                    # Shadcn UI Components
│   ├── forms/                 # Form Components
│   ├── layout/                # Layout Components
│   │   ├── Sidebar.tsx
│   │   ├── Navbar.tsx
│   │   └── Footer.tsx
│   └── shared/                # Shared Components
│
├── lib/                        # 🚧 Utilities
│   ├── api/
│   │   ├── client.ts          # Axios client
│   │   ├── auth.ts            # Auth API calls
│   │   ├── companies.ts       # Companies API calls
│   │   └── documents.ts       # Documents API calls
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   └── useCompanies.ts
│   └── utils/
│       ├── cn.ts              # Tailwind merge utility
│       └── format.ts          # Date/Number formatting
│
├── store/                      # 🚧 Zustand Stores
│   ├── authStore.ts           # Authentication state
│   └── notificationsStore.ts # Notifications state
│
├── types/                      # 🚧 TypeScript Types
│   ├── auth.ts
│   ├── company.ts
│   └── document.ts
│
└── public/                     # Static files
```

## 🔑 مثال: API Client

```typescript
// lib/api/client.ts
import axios from 'axios';

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Handle token refresh or redirect to login
      localStorage.removeItem('access_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

export default apiClient;
```

## 🔐 مثال: Auth Store

```typescript
// store/authStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import apiClient from '@/lib/api/client';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: async (email: string, password: string) => {
        const response = await apiClient.post('/auth/login', { email, password });
        const { access_token, user } = response.data.data;
        
        localStorage.setItem('access_token', access_token);
        set({ user, token: access_token, isAuthenticated: true });
      },

      logout: () => {
        localStorage.removeItem('access_token');
        set({ user: null, token: null, isAuthenticated: false });
      },

      checkAuth: async () => {
        try {
          const response = await apiClient.get('/auth/me');
          set({ user: response.data.data.user, isAuthenticated: true });
        } catch (error) {
          set({ user: null, isAuthenticated: false });
        }
      },
    }),
    {
      name: 'auth-storage',
    },
  ),
);
```

## 📄 مثال: صفحة تسجيل الدخول

```typescript
// app/(auth)/login/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuthStore();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'فشل تسجيل الدخول');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-lg">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">
            نظام إدارة الشركات والوثائق
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            تسجيل الدخول إلى حسابك
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              البريد الإلكتروني
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="admin@companydocs.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              كلمة المرور
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
          </button>
        </form>

        <div className="text-center text-sm text-gray-500">
          <p>بيانات تجريبية:</p>
          <p className="font-mono text-xs mt-1">admin@companydocs.com / Admin@123</p>
        </div>
      </div>
    </div>
  );
}
```

## 🎨 إضافة Shadcn UI (اختياري)

```bash
npx shadcn-ui@latest init
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
npx shadcn-ui@latest add form
npx shadcn-ui@latest add input
npx shadcn-ui@latest add table
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add select
```

## 🔗 API Endpoints

جميع الـ Endpoints متوفرة على Backend:

- **Auth**: `/api/v1/auth/*`
- **Users**: `/api/v1/users/*`
- **Companies**: `/api/v1/companies/*`
- **Documents**: `/api/v1/companies/:id/documents/*`
- **Shares**: `/api/v1/shares/*`
- **Notifications**: `/api/v1/notifications/*`
- **Dashboard**: `/api/v1/dashboard/*`

راجع Swagger: http://localhost:5000/api-docs

## 📚 الموارد

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Shadcn UI](https://ui.shadcn.com/)
- [Zustand](https://docs.pmnd.rs/zustand/)
- [React Query](https://tanstack.com/query/)

## 🎯 الخطوات التالية

1. ✅ انسخ env.example.txt إلى .env.local
2. 🚧 أنشئ API client في lib/api/
3. 🚧 أنشئ Auth store في store/
4. 🚧 أنشئ صفحة تسجيل الدخول
5. 🚧 أنشئ Dashboard
6. 🚧 أنشئ صفحات الشركات
7. 🚧 أنشئ صفحات الوثائق

---

**📅 Created:** نوفمبر 2025  
**🚀 Status:** READY TO BUILD  
**📖 Backend API:** http://localhost:5000/api-docs
