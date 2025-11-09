# ⚡ دليل سريع: تثبيت OnlyOffice بدون Docker

## 🎯 الخطوات السريعة

### 1️⃣ تشغيل السكريبت التلقائي (الأسهل)

```bash
cd /var/www/Test-sy
sudo chmod +x SETUP_ONLYOFFICE_MANUAL.sh
sudo bash SETUP_ONLYOFFICE_MANUAL.sh
```

السكريبت سيقوم بـ:
- ✅ تثبيت المتطلبات
- ✅ إضافة مستودع OnlyOffice
- ✅ تثبيت OnlyOffice Document Server
- ✅ إعداد JWT Secret
- ✅ فتح المنافذ
- ✅ اختبار التثبيت

---

### 2️⃣ التثبيت اليدوي (خطوة بخطوة)

#### الخطوة 1: تثبيت المتطلبات

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl wget gnupg2 software-properties-common apt-transport-https ca-certificates lsb-release
```

#### الخطوة 2: إضافة مستودع OnlyOffice

```bash
curl -fsSL https://download.onlyoffice.com/GPG-KEY-ONLYOFFICE | sudo gpg --dearmor -o /usr/share/keyrings/onlyoffice.gpg
echo "deb [signed-by=/usr/share/keyrings/onlyoffice.gpg] https://download.onlyoffice.com/repo/debian squeeze main" | sudo tee /etc/apt/sources.list.d/onlyoffice.list
sudo apt update
```

#### الخطوة 3: تثبيت OnlyOffice

```bash
sudo apt install -y onlyoffice-documentserver
```

**ملاحظة**: قد يستغرق 10-15 دقيقة

#### الخطوة 4: إعداد JWT Secret

```bash
# إنشاء مفتاح عشوائي (32 حرف على الأقل)
JWT_SECRET=$(openssl rand -base64 32 | tr -d '\n')
echo "JWT Secret: $JWT_SECRET"

# نسخ ملف الإعدادات
sudo cp /etc/onlyoffice/documentserver/local.json /etc/onlyoffice/documentserver/local.json.backup

# تعديل ملف الإعدادات
sudo nano /etc/onlyoffice/documentserver/local.json
```

أضف/عدّل التالي:

```json
{
  "services": {
    "CoAuthoring": {
      "token": {
        "enable": {
          "request": {
            "inbox": true,
            "outbox": true
          },
          "browser": true
        },
        "inbox": {
          "header": "Authorization"
        },
        "outbox": {
          "header": "Authorization"
        }
      },
      "secret": {
        "inbox": {
          "string": "ضع_المفتاح_هنا_32_حرف_على_الأقل"
        },
        "outbox": {
          "string": "ضع_المفتاح_هنا_32_حرف_على_الأقل"
        },
        "browser": {
          "string": "ضع_المفتاح_هنا_32_حرف_على_الأقل"
        }
      }
    }
  }
}
```

#### الخطوة 5: إعادة تشغيل OnlyOffice

```bash
sudo supervisorctl restart all
# أو
sudo systemctl restart ds-docservice ds-metrics ds-converter
```

#### الخطوة 6: فتح المنافذ

```bash
sudo ufw allow 80/tcp
```

#### الخطوة 7: اختبار OnlyOffice

```bash
curl http://localhost/healthcheck
# يجب أن يعيد: true
```

---

### 3️⃣ إعداد التكامل مع الموقع

#### أ) تحديث Backend

```bash
cd /var/www/Test-sy/backend
nano .env
```

أضف/عدّل:

```env
# OnlyOffice Document Server
ONLYOFFICE_DOCUMENT_SERVER_URL=http://YOUR_SERVER_IP
ONLYOFFICE_SECRET=نفس_المفتاح_الذي_وضعته_في_local.json
BACKEND_URL=http://YOUR_SERVER_IP:5000
FRONTEND_URL=http://YOUR_SERVER_IP:3000
```

**مهم**: استبدل `YOUR_SERVER_IP` بعنوان IP السيرفر الفعلي

#### ب) تحديث Frontend

```bash
cd /var/www/Test-sy/frontend
nano .env.local
```

أضف/عدّل:

```env
NEXT_PUBLIC_ONLYOFFICE_DOCUMENT_SERVER_URL=http://YOUR_SERVER_IP
```

#### ج) إعادة تشغيل Backend

```bash
# إذا كان يعمل مع Docker
docker compose restart backend

# أو إذا كان يعمل بدون Docker
pm2 restart company-docs-backend
# أو
systemctl restart your-backend-service
```

---

### 4️⃣ اختبار التكامل

#### اختبار من Terminal

```bash
# اختبار Health Check
curl http://YOUR_SERVER_IP/healthcheck

# اختبار OnlyOffice Config API (يحتاج token)
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://YOUR_SERVER_IP:5000/api/v1/onlyoffice/config/DOCUMENT_ID
```

#### اختبار من المتصفح

1. افتح: `http://YOUR_SERVER_IP:3000`
2. سجّل الدخول
3. افتح شركة → الملفات
4. اضغط على زر "✏️ تحرير" بجانب ملف Word أو Excel
5. يجب أن يفتح محرر OnlyOffice

---

## 🔍 استكشاف الأخطاء

### OnlyOffice لا يعمل

```bash
# التحقق من حالة الخدمات
sudo systemctl status ds-docservice
sudo systemctl status ds-metrics
sudo systemctl status ds-converter

# عرض السجلات
sudo tail -f /var/log/onlyoffice/documentserver/docservice/out.log

# إعادة تشغيل
sudo supervisorctl restart all
```

### خطأ في الاتصال من Backend

1. **تحقق من JWT Secret**: يجب أن يكون نفس المفتاح في:
   - `/etc/onlyoffice/documentserver/local.json`
   - `backend/.env` (ONLYOFFICE_SECRET)

2. **تحقق من URL**: تأكد من أن `ONLYOFFICE_DOCUMENT_SERVER_URL` صحيح

3. **تحقق من Firewall**: تأكد من أن المنفذ 80 مفتوح

### Callback لا يعمل

1. **تحقق من Callback URL**: يجب أن يكون `{BACKEND_URL}/api/v1/onlyoffice/callback`
2. **تحقق من السجلات**: `docker compose logs backend` أو `pm2 logs`
3. **تحقق من أن Backend يمكنه الوصول إلى OnlyOffice**

---

## 📋 ملخص المتغيرات المطلوبة

### Backend (.env)
```env
ONLYOFFICE_DOCUMENT_SERVER_URL=http://YOUR_SERVER_IP
ONLYOFFICE_SECRET=your-secret-key-32-chars-minimum
BACKEND_URL=http://YOUR_SERVER_IP:5000
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_ONLYOFFICE_DOCUMENT_SERVER_URL=http://YOUR_SERVER_IP
```

### OnlyOffice (/etc/onlyoffice/documentserver/local.json)
```json
{
  "services": {
    "CoAuthoring": {
      "secret": {
        "inbox": { "string": "نفس_المفتاح" },
        "outbox": { "string": "نفس_المفتاح" },
        "browser": { "string": "نفس_المفتاح" }
      }
    }
  }
}
```

---

## ✅ التحقق من نجاح التثبيت

```bash
# 1. OnlyOffice يعمل
curl http://localhost/healthcheck
# النتيجة: true

# 2. الخدمات نشطة
sudo systemctl status ds-docservice
# النتيجة: active (running)

# 3. Backend يمكنه الوصول
curl http://YOUR_SERVER_IP/healthcheck
# النتيجة: true

# 4. اختبار من المتصفح
# افتح ملف Word/Excel واضغط "تحرير"
# يجب أن يفتح محرر OnlyOffice
```

---

## 🆘 الدعم

- 📚 الدليل الكامل: `INSTALL_ONLYOFFICE_MANUAL.md`
- 🔧 السكريبت التلقائي: `SETUP_ONLYOFFICE_MANUAL.sh`
- 📖 [وثائق OnlyOffice الرسمية](https://api.onlyoffice.com/)

