# 📄 دليل تثبيت OnlyOffice Document Server بدون Docker (يدوي)

## 📋 المتطلبات

- Ubuntu 20.04+ أو Debian 11+
- 4GB+ RAM (موصى به 8GB)
- 10GB+ مساحة قرص
- معالج 2 cores+ (موصى به 4 cores)

---

## 🔧 الخطوة 1: تثبيت المتطلبات

```bash
# تحديث النظام
sudo apt update && sudo apt upgrade -y

# تثبيت المتطلبات الأساسية
sudo apt install -y \
    curl \
    wget \
    gnupg2 \
    software-properties-common \
    apt-transport-https \
    ca-certificates \
    lsb-release
```

---

## 📦 الخطوة 2: إضافة مستودع OnlyOffice

```bash
# إضافة GPG key
curl -fsSL https://download.onlyoffice.com/GPG-KEY-ONLYOFFICE | sudo gpg --dearmor -o /usr/share/keyrings/onlyoffice.gpg

# إضافة المستودع
echo "deb [signed-by=/usr/share/keyrings/onlyoffice.gpg] https://download.onlyoffice.com/repo/debian squeeze main" | sudo tee /etc/apt/sources.list.d/onlyoffice.list

# تحديث apt
sudo apt update
```

---

## 🚀 الخطوة 3: تثبيت OnlyOffice Document Server

```bash
# تثبيت OnlyOffice Document Server
sudo apt install -y onlyoffice-documentserver

# أو إذا كان هناك مشكلة، استخدم:
# sudo apt install -y onlyoffice-documentserver-de
```

---

## ⚙️ الخطوة 4: إعداد OnlyOffice

### 4.1 إعداد JWT Secret

```bash
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
          "string": "your-secret-key-change-in-production-min-32-chars"
        },
        "outbox": {
          "string": "your-secret-key-change-in-production-min-32-chars"
        },
        "browser": {
          "string": "your-secret-key-change-in-production-min-32-chars"
        }
      }
    }
  }
}
```

**مهم**: استخدم نفس المفتاح في `ONLYOFFICE_SECRET` في Backend!

### 4.2 إعادة تشغيل OnlyOffice

```bash
# إعادة تشغيل الخدمة
sudo systemctl restart ds-docservice
sudo systemctl restart ds-metrics
sudo systemctl restart ds-converter

# أو إعادة تشغيل جميع الخدمات
sudo supervisorctl restart all

# التحقق من الحالة
sudo systemctl status ds-docservice
```

---

## 🔥 الخطوة 5: فتح المنافذ

```bash
# فتح المنفذ 80 (OnlyOffice يعمل على 80 افتراضياً)
sudo ufw allow 80/tcp

# أو إذا كان يعمل على منفذ آخر
sudo ufw allow 8080/tcp
```

---

## ✅ الخطوة 6: اختبار OnlyOffice

```bash
# اختبار Health Check
curl http://localhost/healthcheck
# يجب أن يعيد: true

# أو من عنوان IP السيرفر
curl http://YOUR_SERVER_IP/healthcheck
```

---

## 🔗 الخطوة 7: إعداد التكامل مع الموقع

### 7.1 تحديث Backend (.env)

```bash
cd /var/www/Test-sy/backend
nano .env
```

أضف/عدّل:

```env
# OnlyOffice Document Server
ONLYOFFICE_DOCUMENT_SERVER_URL=http://YOUR_SERVER_IP
# أو إذا كان على منفذ مختلف:
# ONLYOFFICE_DOCUMENT_SERVER_URL=http://YOUR_SERVER_IP:8080

ONLYOFFICE_SECRET=your-secret-key-change-in-production-min-32-chars
BACKEND_URL=http://YOUR_SERVER_IP:5000
FRONTEND_URL=http://YOUR_SERVER_IP:3000
```

### 7.2 تحديث Frontend (.env.local)

```bash
cd /var/www/Test-sy/frontend
nano .env.local
```

أضف/عدّل:

```env
NEXT_PUBLIC_ONLYOFFICE_DOCUMENT_SERVER_URL=http://YOUR_SERVER_IP
# أو إذا كان على منفذ مختلف:
# NEXT_PUBLIC_ONLYOFFICE_DOCUMENT_SERVER_URL=http://YOUR_SERVER_IP:8080
```

---

## 🔄 الخطوة 8: إعادة تشغيل الخدمات

```bash
# إعادة تشغيل Backend
docker compose restart backend

# أو إذا كان Backend يعمل بدون Docker
pm2 restart company-docs-backend
# أو
systemctl restart your-backend-service
```

---

## 🧪 الخطوة 9: اختبار التكامل

### 9.1 اختبار من Backend

```bash
# اختبار OnlyOffice Config API
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://YOUR_SERVER_IP:5000/api/v1/onlyoffice/config/DOCUMENT_ID
```

### 9.2 اختبار من المتصفح

1. افتح: `http://YOUR_SERVER_IP:3000`
2. سجّل الدخول
3. افتح شركة وانتقل إلى الملفات
4. اضغط على زر "تحرير" بجانب ملف Word أو Excel
5. يجب أن يفتح محرر OnlyOffice

---

## 🔧 إعدادات إضافية

### تغيير المنفذ الافتراضي (اختياري)

إذا كنت تريد تشغيل OnlyOffice على منفذ غير 80:

```bash
# تعديل إعدادات Nginx
sudo nano /etc/nginx/conf.d/ds.conf
```

عدّل:

```nginx
server {
    listen 8080;
    server_name _;
    
    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

ثم:

```bash
sudo systemctl restart nginx
```

---

## 🐛 استكشاف الأخطاء

### OnlyOffice لا يعمل

```bash
# التحقق من حالة الخدمات
sudo systemctl status ds-docservice
sudo systemctl status ds-metrics
sudo systemctl status ds-converter

# عرض السجلات
sudo tail -f /var/log/onlyoffice/documentserver/docservice/out.log
sudo tail -f /var/log/onlyoffice/documentserver/converter/out.log

# إعادة تشغيل جميع الخدمات
sudo supervisorctl restart all
```

### خطأ في الاتصال من Backend

1. **تحقق من JWT Secret**: يجب أن يكون نفس المفتاح في Backend و OnlyOffice
2. **تحقق من CORS**: OnlyOffice يجب أن يسمح بالطلبات من نطاقك
3. **تحقق من Firewall**: تأكد من أن المنافذ مفتوحة

### Callback لا يعمل

1. **تحقق من Callback URL**: يجب أن يكون `{BACKEND_URL}/api/v1/onlyoffice/callback`
2. **تحقق من السجلات**: `docker compose logs backend`
3. **تحقق من أن Backend يمكنه الوصول إلى OnlyOffice**

---

## 📝 ملاحظات مهمة

1. **JWT Secret**: يجب أن يكون نفس المفتاح في:
   - `/etc/onlyoffice/documentserver/local.json`
   - `backend/.env` (ONLYOFFICE_SECRET)

2. **المنفذ الافتراضي**: OnlyOffice يعمل على المنفذ 80 افتراضياً

3. **الذاكرة**: OnlyOffice يحتاج 4GB+ RAM للعمل بشكل جيد

4. **النسخ الاحتياطي**: احتفظ بنسخة احتياطية من:
   - `/etc/onlyoffice/documentserver/local.json`
   - `/var/lib/onlyoffice/documentserver/Data`

---

## 🔄 التحديث

```bash
# تحديث OnlyOffice
sudo apt update
sudo apt upgrade onlyoffice-documentserver

# إعادة تشغيل الخدمات
sudo supervisorctl restart all
```

---

## 🆘 الدعم

- [وثائق OnlyOffice](https://api.onlyoffice.com/)
- [دليل التثبيت الرسمي](https://helpcenter.onlyoffice.com/installation/docs-community-install-ubuntu.aspx)

