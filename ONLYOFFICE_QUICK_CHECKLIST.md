# ✅ قائمة فحص سريعة - OnlyOffice على السيرفر

## 🚀 الخطوات السريعة

### 0️⃣ تثبيت Docker (إذا لم يكن مثبتاً)

```bash
# إذا ظهرت رسالة "Command 'docker' not found"
sudo apt update
sudo apt install -y docker.io
sudo systemctl start docker
sudo systemctl enable docker

# أو استخدم السكريبت التلقائي:
sudo bash INSTALL_DOCKER_AND_ONLYOFFICE.sh
```

### 1️⃣ تثبيت OnlyOffice Document Server

```bash
docker run -i -t -d -p 8080:80 --restart=always \
  --name onlyoffice-documentserver \
  -v /app/onlyoffice/DocumentServer/logs:/var/log/onlyoffice \
  -v /app/onlyoffice/DocumentServer/data:/var/www/onlyoffice/Data \
  -v /app/onlyoffice/DocumentServer/lib:/var/lib/onlyoffice \
  -v /app/onlyoffice/DocumentServer/db:/var/lib/postgresql \
  onlyoffice/documentserver
```

### 2️⃣ تحديث متغيرات البيئة

#### Backend (.env)
```env
ONLYOFFICE_DOCUMENT_SERVER_URL=http://93.127.160.182:8080
ONLYOFFICE_SECRET=your-secret-key-change-in-production-min-32-chars
BACKEND_URL=http://93.127.160.182:5000
```

#### Frontend (.env.local)
```env
NEXT_PUBLIC_ONLYOFFICE_DOCUMENT_SERVER_URL=http://93.127.160.182:8080
```

### 3️⃣ فتح المنافذ

```bash
sudo ufw allow 8080/tcp
```

### 4️⃣ اختبار

```bash
# اختبار OnlyOffice
curl http://93.127.160.182:8080/healthcheck
# يجب أن يعيد: true
```

---

## ⚠️ ملاحظات مهمة

1. **استبدل `93.127.160.182`** بعنوان IP السيرفر الفعلي
2. **JWT Secret** يجب أن يكون نفس المفتاح في Backend و OnlyOffice
3. **Callback URL** يجب أن يكون: `{BACKEND_URL}/api/v1/onlyoffice/callback`

---

## 📚 للمزيد من التفاصيل

راجع ملف `ONLYOFFICE_SERVER_SETUP.md` للدليل الشامل

