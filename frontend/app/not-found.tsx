import Link from 'next/link';
import { Button } from '@/components/ui';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-900">404</h1>
        <p className="text-xl text-gray-600 mt-4">الصفحة غير موجودة</p>
        <p className="text-gray-500 mt-2">
          عذراً، الصفحة التي تبحث عنها غير موجودة.
        </p>
        <div className="mt-8">
          <Link href="/dashboard">
            <Button>العودة إلى الرئيسية</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

