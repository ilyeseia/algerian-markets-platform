# منصة الأسواق الجزائرية

منصة متكاملة لمراقبة وتحليل أسواق الجزائر مع تحديثات يومية مدعومة بالذكاء الاصطناعي.

## 🚀 المميزات

- **لوحة تحكم باللغة العربية** - واجهة مستخدم سهلة الاستخدام باللغة العربية
- **تحديثات فورية** - بيانات الأسواق في الوقت الفعلي
- **تحليلات متقدمة** - رسوم بيانية وتقارير مفصلة
- **تنبيهات الأسعار** - إشعارات فورية عند تغير الأسعار
- **تصميم متجاوب** - يعمل على جميع الأجهزة (موبايل، تابلت، كمبيوتر)
- **نشر تلقائي** - نشر تلقائي على GitHub Pages

## 🛠️ التقنيات المستخدمة

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui
- **Charts**: Recharts
- **Database**: Prisma ORM with SQLite
- **Real-time**: Socket.io
- **AI**: z-ai-web-dev-sdk
- **Deployment**: GitHub Pages, GitHub Actions

## 📱 روابط المشروع

- **المستودع**: https://github.com/ilyeseia/algerian-markets-platform
- **الموقع**: https://ilyeseia.github.io/algerian-markets-platform

## 🚀 التثبيت والتشغيل

### المتطلبات
- Node.js 18 أو أحدث
- npm أو yarn

### التثبيت المحلي
```bash
# استنساخ المستودع
git clone https://github.com/ilyeseia/algerian-markets-platform.git

# الدخول إلى المجلد
cd algerian-markets-platform

# تثبيت الاعتماديات
npm install

# تشغيل بيئة التطوير
npm run dev
```

### بناء المشروع
```bash
# بناء المشروع للإنتاج
npm run build

# تصدير المشروع للنشر الثابت
npm run export
```

## 📊 هيكل المشروع

```
src/
├── app/                    # صفحات التطبيق
│   ├── page.tsx           # الصفحة الرئيسية
│   ├── layout.tsx         # التخطيط الرئيسي
│   └── globals.css        # الأنماط العامة
├── components/            # المكونات
│   ├── ui/               # مكونات واجهة المستخدم
│   └── analytics/        # مكونات التحليلات
└── lib/                  # المكتبات المساعدة
    ├── db.ts             # إعدادات قاعدة البيانات
    ├── socket.ts         # إعدادات WebSocket
    └── utils.ts          # وظائف مساعدة
```

## 🔧 الإعدادات

### متغيرات البيئة
```env
# قاعدة البيانات
DATABASE_URL="file:./dev.db"

# GitHub Pages
GITHUB_PAGES=true

# رابط التطبيق
NEXT_PUBLIC_APP_URL="https://ilyeseia.github.io/algerian-markets-platform"
```

## 🚀 النشر

### النشر على GitHub Pages
1. قم بإنشاء fork للمستودع
2. قم بتمكين GitHub Pages في إعدادات المستودع
3. اختر فرع `gh-pages` كمصدر
4. سيتم النشر تلقائياً عبر GitHub Actions

### النشر على خادم
```bash
# بناء المشروع
npm run build

# نشر الملفات الثابتة
npm run export
```

## 📈 البيانات الوهمية

المشروع يستخدم بيانات وهمية للأغراض التوضيحية:
- **الأسواق**: سوق الجزائر المركزي، سوق وهران، سوق قسنطينة
- **المنتجات**: طماطم، بطاطس، برتقال
- **الأسعار**: أسعار دينار جزائري (دج)

## 🤝 المساهمة

نرحب بجميع المساهمات! يرجى اتباع الخطوات التالية:

1. Fork المشروع
2. إنشاء فرع جديد (`git checkout -b feature/AmazingFeature`)
3. Commit التغييرات (`git commit -m 'Add some AmazingFeature'`)
4. Push إلى الفرع (`git push origin feature/AmazingFeature`)
5. إنشاء Pull Request

## 📄 الرخصة

هذا المشروع مرخص تحت رخصة MIT - راجع ملف [LICENSE](LICENSE) للتفاصيل.

## 🙏 الشكر والتقدير

- شكراً لـ Next.js على إطار العمل الممتاز
- شكراً لـ Tailwind CSS على نظام التصميم
- شكراً لـ shadcn/ui على المكونات الجميلة

## 📞 التواصل

- **المؤلف**: ilyeseia
- **البريد الإلكتروني**: [GitHub Profile](https://github.com/ilyeseia)
- **المشروع**: https://github.com/ilyeseia/algerian-markets-platform

---

⭐ إذا كان هذا المشروع مفيداً، يرجى إعطائه نجمة!