# 🔍 تشخيص مشكلة الاتصال بالباك اند

## المشكلة الحالية:
```
POST http://93.127.160.182:5000/api/v1/auth/login 
net::ERR_CONNECTION_TIMED_OUT
```

هذا يعني أن الفرونت اند يحاول الاتصال بالباك اند لكن الاتصال ينتهي بالوقت.

---

## ✅ الخطوات التشخيصية:

### 1. التحقق من أن الباك اند يعمل

```bash
# على الخادم
ssh root@93.127.160.182

# التحقق من العمليات الجارية
ps aux | grep node
pm2 list

# التحقق من المنفذ 5000
netstat -tulpn | grep 5000
# أو
ss -tulpn | grep 5000
```

### 2. التحقق من Firewall

```bash
# التحقق من حالة Firewall
sudo ufw status
# أو
sudo iptables -L -n

# إذا كان Firewall مفعل، افتح المنفذ 5000
sudo ufw allow 5000/tcp
sudo ufw reload
```

### 3. التحقق من أن الباك اند يستمع على 0.0.0.0 وليس localhost فقط

```bash
# على الخادم، افتح ملف main.ts
cd /var/www/Test-sy/backend
cat src/main.ts | grep listen

# يجب أن يكون:
# await app.listen(port, '0.0.0.0');
# وليس:
# await app.listen(port); // هذا يستمع على localhost فقط
```

### 4. اختبار الاتصال من الخادم نفسه

```bash
# من داخل الخادم
curl http://localhost:5000/api/v1
curl http://127.0.0.1:5000/api/v1

# اختبار من IP الخارجي
curl http://93.127.160.182:5000/api/v1
```

### 5. التحقق من إعدادات الباك اند

```bash
cd /var/www/Test-sy/backend

# عرض ملف .env
cat .env | grep PORT

# التحقق من أن PORT=5000
```

---

## 🔧 الحلول المحتملة:

### الحل 1: تعديل main.ts لاستخدام 0.0.0.0

```bash
cd /var/www/Test-sy/backend
nano src/main.ts
```

ابحث عن السطر:
```typescript
await app.listen(port);
```

غيّره إلى:
```typescript
await app.listen(port, '0.0.0.0');
```

ثم أعد البناء والتشغيل:
```bash
npm run build
pm2 restart backend
```

### الحل 2: فتح Firewall

```bash
# Ubuntu/Debian
sudo ufw allow 5000/tcp
sudo ufw reload

# CentOS/RHEL
sudo firewall-cmd --permanent --add-port=5000/tcp
sudo firewall-cmd --reload
```

### الحل 3: استخدام Nginx كـ Reverse Proxy (موصى به للإنتاج)

إذا كان الباك اند يعمل على localhost:5000، استخدم Nginx:

```bash
# إنشاء ملف إعدادات Nginx
sudo nano /etc/nginx/sites-available/backend-api
```

أضف:
```nginx
server {
    listen 80;
    server_name 93.127.160.182;

    location /api/v1 {
        proxy_pass http://localhost:5000;
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

تفعيل الموقع:
```bash
sudo ln -s /etc/nginx/sites-available/backend-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

ثم غيّر ملف env في الفرونت اند إلى:
```
NEXT_PUBLIC_API_URL=http://93.127.160.182/api/v1
```

---

## 🧪 اختبار سريع:

### من جهازك المحلي:

```bash
# اختبار الاتصال
curl http://93.127.160.182:5000/api/v1

# أو من المتصفح
# افتح: http://93.127.160.182:5000/api/v1
```

إذا لم يعمل، المشكلة في Firewall أو الباك اند لا يستمع على 0.0.0.0.

---

## 📋 قائمة فحص سريعة:

- [ ] الباك اند يعمل (pm2 list أو ps aux | grep node)
- [ ] المنفذ 5000 مفتوح (netstat -tulpn | grep 5000)
- [ ] Firewall يسمح بالمنفذ 5000 (ufw status)
- [ ] الباك اند يستمع على 0.0.0.0 وليس localhost فقط
- [ ] يمكن الوصول من داخل الخادم (curl localhost:5000)
- [ ] يمكن الوصول من خارج الخادم (curl 93.127.160.182:5000)

