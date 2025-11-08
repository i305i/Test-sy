# 🔧 إصلاح أخطاء البناء

## ❌ المشكلة 1: خطأ TypeScript

```
Type error: Argument of type 'string | undefined' is not assignable to parameter of type 'string'.
```

**السبب:** `ALLOWED_BACKEND_URLS` يحتوي على قيم قد تكون `undefined`.

**✅ تم الإصلاح:** تم تحديث الملفات:
- `frontend/app/api/documents/download/[token]/route.ts`
- `frontend/app/api/documents/stream/[token]/route.ts`

---

## ❌ المشكلة 2: 404 Not Found من Nginx

**السبب:** Nginx غير مُعد بشكل صحيح أو التطبيقات غير مشغلة.

---

## ✅ الحل الكامل:

### 1. إصلاح خطأ TypeScript (تم):

الملفات تم تحديثها. الآن شغّل:

```bash
cd /var/www/Test-sy/frontend
npm run build
```

### 2. إعداد Nginx:

```bash
sudo nano /etc/nginx/sites-available/company-docs
```

**المحتوى:**
```nginx
server {
    listen 80;
    server_name 93.127.160.182;

    client_max_body_size 100M;

    location /api/ {
        proxy_pass http://localhost:5000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/company-docs /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default  # حذف الافتراضي
sudo nginx -t
sudo systemctl reload nginx
```

### 3. التحقق من التطبيقات:

```bash
# التحقق من PM2
pm2 status

# إذا لم تكن مشغلة، شغّلها:
cd /var/www/Test-sy/backend
pm2 start npm --name "company-docs-backend" -- start

cd /var/www/Test-sy/frontend
pm2 start npm --name "company-docs-frontend" -- start

pm2 save
```

### 4. التحقق من البورتات:

```bash
# التحقق من أن التطبيقات تعمل
netstat -tulpn | grep :3000
netstat -tulpn | grep :5000

# إذا لم تكن تعمل، شغّلها
```

---

## ✅ بعد الإصلاح:

1. ✅ أعد بناء Frontend: `npm run build`
2. ✅ أعد تشغيل PM2: `pm2 restart all`
3. ✅ أعد تحميل Nginx: `sudo systemctl reload nginx`
4. ✅ افتح: `http://93.127.160.182`

---

## 📝 ملاحظات:

- تأكد من أن Backend يعمل على البورت 5000
- تأكد من أن Frontend يعمل على البورت 3000
- تأكد من أن Nginx يعمل: `sudo systemctl status nginx`

