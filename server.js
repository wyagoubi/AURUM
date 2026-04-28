// server.js - خادم بسيط لتشغيل ملفات AURUM الثابتة
const express = require('express');
const path = require('path');
const app = express();

// تحديد المنفذ (تلقائياً من Render أو 3000 محلياً)
const PORT = process.env.PORT || 3000;

// تقديم جميع الملفات الثابتة من المجلد الحالي
app.use(express.static(__dirname));

// التعامل مع أي مسار غير موجود - إرجاع index.html (للمسارات الافتراضية)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// بدء الخادم
app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ AURUM server running on port ${PORT}`);
    console.log(`🌐 Visit: http://localhost:${PORT}`);
});
