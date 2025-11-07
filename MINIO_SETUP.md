# إعداد MinIO بدون Docker

## الطريقة 1: تحميل وتشغيل MinIO مباشرة (Windows)

### الخطوة 1: تحميل MinIO
1. افتح المتصفح واذهب إلى: https://dl.min.io/server/minio/release/windows-amd64/minio.exe
2. احفظ الملف في مجلد مثل: `C:\minio\`
3. أو استخدم PowerShell:
```powershell
# إنشاء مجلد
New-Item -ItemType Directory -Path C:\minio -Force

# تحميل MinIO
Invoke-WebRequest -Uri "https://dl.min.io/server/minio/release/windows-amd64/minio.exe" -OutFile "C:\minio\minio.exe"
```

### الخطوة 2: تشغيل MinIO
```powershell
# في PowerShell (كمسؤول)
cd C:\minio
.\minio.exe server C:\minio\data --console-address ":9001"
```

### الخطوة 3: الوصول إلى MinIO
- **MinIO API**: http://localhost:9000
- **MinIO Console**: http://localhost:9001
- **Username**: minioadmin
- **Password**: minioadmin123 (أو ما وضعته في .env)

### الخطوة 4: إنشاء Bucket
1. افتح http://localhost:9001
2. سجل دخول بـ minioadmin / minioadmin123
3. اضغط على "Create Bucket"
4. اسم الـ Bucket: `company-docs-bucket`
5. اضغط "Create Bucket"

---

## الطريقة 2: استخدام Docker (إذا غيرت رأيك)

```powershell
# تشغيل MinIO فقط
docker run -d `
  -p 9000:9000 `
  -p 9001:9001 `
  -e "MINIO_ROOT_USER=minioadmin" `
  -e "MINIO_ROOT_PASSWORD=minioadmin123" `
  --name minio `
  -v C:\minio-data:/data `
  minio/minio server /data --console-address ":9001"
```

---

## الطريقة 3: تعطيل MinIO مؤقتاً (للتطوير فقط)

إذا كنت تريد المتابعة بدون MinIO، يمكنك تعديل الكود ليتخطى MinIO، لكن لن تتمكن من رفع الملفات.

---

## التحقق من أن MinIO يعمل

```powershell
# تحقق من أن MinIO يعمل
curl http://localhost:9000/minio/health/live
```

إذا رأيت `OK`، يعني MinIO يعمل بشكل صحيح.

