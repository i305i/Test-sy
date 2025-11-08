# 🔧 إصلاح 404 Not Found من Nginx

## ❌ المشكلة:

```
404 Not Found
nginx/1.24.0 (Ubuntu)
```

**السبب:** Nginx غير مُعد بشكل صحيح أو التطبيقات غير مشغلة.

---

## ✅ الحل:

### 1. التحقق من التطبيقات:

```bash
# التحقق من Backend
netstat -tulpn | grep :5000
# أو
pm2 status

# التحقق من Frontend
netstat -tulpn | grep :3000
```

### 2. إذا لم تكن مشغلة، شغّلها:

```bash
# Backend
cd /var/www/Test-sy/backend
pm2 start npm --name "company-docs-backend" -- start

# Frontend
cd /var/www/Test-sy/frontend
pm2 start npm --name "company-docs-frontend" -- start

pm2 save
```

### 3. إعداد Nginx:

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
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
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

### 4. تفعيل الموقع:

```bash
# حذف الافتراضي (إذا كان موجوداً)
sudo rm /etc/nginx/sites-enabled/default

# تفعيل الموقع الجديد
sudo ln -s /etc/nginx/sites-available/company-docs /etc/nginx/sites-enabled/

# اختبار الإعداد
sudo nginx -t

# إعادة تحميل Nginx
sudo systemctl reload nginx
```

### 5. التحقق من السجلات:

```bash
# سجلات Nginx
sudo tail -f /var/log/nginx/error.log

# سجلات PM2
pm2 logs
```

---

## ✅ بعد الإصلاح:

افتح: **http://93.127.160.182**

يجب أن يعمل الموقع الآن! 🎉

---

## 📝 قائمة التحقق:

- [ ] Backend يعمل على البورت 5000
- [ ] Frontend يعمل على البورت 3000
- [ ] Nginx config صحيح
- [ ] Nginx يعمل: `sudo systemctl status nginx`
- [ ] البورتات مفتوحة في UFW
- [ ] البورتات مفتوحة في VPS Provider

