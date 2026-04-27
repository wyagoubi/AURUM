# AURUM Frontend — GitHub Pages

## خطوات الرفع

1. أنشئ repository جديد على GitHub (اسمه مثلاً `aurum`)
2. ارفع جميع الملفات من هذا المجلد
3. اذهب إلى Settings > Pages > Source: main branch / root
4. **قبل الرفع**: عدّل السطر الأول في كل ملف JS:
   ```
   const API_BASE = 'https://YOUR-APP.onrender.com/api';
   ```
   استبدل `YOUR-APP` بالاسم الفعلي من Render.

## الملفات
- `index.html` — الصفحة الرئيسية
- `auth.html` — تسجيل الدخول والتسجيل
- `owner.html` — بوابة المالك (إضافة فندق)
- `owner-dashboard.html` — لوحة تحكم المالك
- `reservations.html` — حجوزات الضيف
