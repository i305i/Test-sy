# خطوات إكمال إعداد MinIO

## ✅ الخطوة 1: MinIO يعمل الآن
MinIO يعمل على:
- **API**: http://127.0.0.1:9000
- **Console**: http://127.0.0.1:9001
- **Username**: minioadmin
- **Password**: minioadmin

## 📦 الخطوة 2: إنشاء Bucket

### الطريقة 1: من خلال Web Console (أسهل)
1. افتح المتصفح واذهب إلى: http://127.0.0.1:9001
2. سجل دخول بـ:
   - Username: `minioadmin`
   - Password: `minioadmin`
3. اضغط على "Create Bucket" (أو "إنشاء حاوية")
4. أدخل اسم الـ Bucket: `company-docs-bucket`
5. اضغط "Create Bucket"

### الطريقة 2: من خلال Command Line
```powershell
# تحميل MinIO Client (mc)
Invoke-WebRequest -Uri "https://dl.min.io/client/mc/release/windows-amd64/mc.exe" -OutFile "C:\minio\mc.exe"

# إعداد الاتصال
C:\minio\mc.exe alias set myminio http://127.0.0.1:9000 minioadmin minioadmin

# إنشاء Bucket
C:\minio\mc.exe mb myminio/company-docs-bucket
```

## ✅ الخطوة 3: إعادة تشغيل Backend
بعد إنشاء Bucket، أعد تشغيل Backend:
```powershell
cd C:\Users\Admin\Desktop\Systym_ms\backend
npm run start:dev
```

يجب أن ترى رسالة:
```
✅ Connected to MinIO bucket: company-docs-bucket
```

## 🔍 التحقق من أن كل شيء يعمل
بعد إعادة تشغيل Backend، يجب أن ترى:
- ✅ لا توجد أخطاء MinIO
- ✅ رسالة نجاح الاتصال بـ MinIO

إذا رأيت أي أخطاء، تأكد من:
1. MinIO يعمل (افتح http://127.0.0.1:9001)
2. Bucket `company-docs-bucket` موجود
3. ملف `.env` يحتوي على `MINIO_SECRET_KEY=minioadmin` (بدون 123)

