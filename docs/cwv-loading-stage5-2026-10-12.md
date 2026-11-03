# مؤشرات أداء الويب — المرحلة الخامسة: CSS والخطوط وJavaScript
**التاريخ:** 12 أكتوبر 2026  
**المستودع:** https://github.com/imadtbn/dz_portal

## الهدف
تقليل تغيّر التخطيط بعد الرسم الأول والتحميل الزائد مع الإبقاء على نفس خدمات الموقع وألوانه وخطوطه وأيقوناته وإعلاناته ومواضعها.

## 1. الصفحة الرئيسية: CSS مرة واحدة قبل أول رسم
في `index.html` تحولت الملفات:
- `assets/css/style-section-header.css`
- `assets/css/Alert-Modal.css`
- `assets/css/rating-panel.css`
- `assets/css/performance-home.css`

من `rel="preload" as="style" onload="...rel='stylesheet'"` إلى `rel="stylesheet"` مباشرة. أزيلت روابط `noscript` المقابلة بعد أن أصبحت الملفات تحمل تلقائيًا بغض النظر عن JavaScript.

**توضيح:** كانت روابط `noscript` مسارًا بديلًا عند تعطيل JavaScript، وليست نسخًا تُحمّل بالتزامن أثناء التصفح العادي؛ التغيير يعالج أساسًا تأخر تطبيق CSS لا ازدواجية الطلبات للملفات الأربعة. أزيل أيضًا `fontawesome.min.css` من الصفحة الرئيسية، لأن `all.min.css` يوفّر الأنماط المطلوبة أصلًا.

## 2. تحميل الخطوط في 16 صفحة ضمن مجموعة CLS
الصفحات:
- `index.html`
- `sectors/education.html`
- `sectors/awlyaa-education.html`
- `sectors/progres.mesrs.html`
- `pages/process/awlyaa-process.html`
- `sectors/poste.html`
- `sectors/dzexams.html`
- `sectors/sntf.html`
- `sectors/interieur.html`
- `sectors/tabioucom.html`
- `sectors/emergency.html`
- `sectors/facteur.html`
- `sectors/ade.html`
- `sectors/naftal.html`
- `sectors/hcn.html`
- `sectors/sonalgaz.html`

تم تغيير طلبي CSS الخاصين بـ Tajawal وFont Awesome إلى روابط `stylesheet` مباشرة، مع الحفاظ على عناوين المصادر والأوزان والنسخ الحالية، وإضافة `preconnect` لـ Google Fonts و`cdnjs.cloudflare.com` عند الحاجة.

**موازنة مهمة:** CSS الحاجب للرسم يوفّر التنسيقات من البداية لكنه قد يزيد وقت بدء الرسم على الشبكات البطيئة مقارنة بالتحميل غير المتزامن. كما أن `display=swap` في Tajawal يسمح باحتمال تبدّل الخط بعد وصول ملف الخط نفسه. لذلك يستلزم القرار اختبار CLS وFCP وLCP، ولا يمثل ضمانًا بانعدام الانزياح.

لم يشمل التعديل كل ملفات HTML الموجودة في البوابة؛ عولجت مجموعة عناوين CLS التي وردت في طلب مالك الموقع، وتظل بقية الصفحات بحاجة لتعميم مدروس بعد مقارنة النتائج.

## 3. تحسين المحمّل المؤجل
في `assets/js/deferred-homepage.js`:
- حماية من تكرار تحميل سكريبت يطابق URL موجودًا في `document.scripts`، بما يشمل السكريبتات المعلنة مباشرة بـ `defer`.
- تحميل `homepageStats.js` فقط عند وجود عناصر `data-homepage-stat="sectors"` و`services` وبطاقات القطاعات في الصفحة.
- تحميل `siteRating.js` فقط عند وجود `data-rating-widget`. في `pages/statistics.html` يوجد أصلًا مرجع مباشر واحد، ويُحترم بدل إنشاء مرجع ثانٍ.
- الإبقاء على التحميل عند التركيز/الإدخال لمحرك البحث و`ads-stability.js` وآليات التتبع والإعلانات دون تغيير.

لم تتغير قيم الإحصائيات أو بيانات البحث ولا روابط الخدمات.

## 4. التحقق
أضيف:
- `tests/cwv-loading-stage5.test.js` — يحمي تحميل الخطوط والأنماط، الحراسة الشرطية للمكوّنات، وعدم حذف تعريفات AdSense.
- تحديث `tools/cls-audit.mjs` — تسجيل قائمة روابط CSS وJavaScript وأوقات تحميل الموارد وحالة الخطوط في تقرير اختبارات الهاتف.

تم إجراء فحص ثابت لملفات الصفحات الست عشرة بعد النشر في GitHub، والتحقق من وجود رابط واحد لكل مورد خط أساسي، ومن بقاء شيفرة الإعلانات وعناصرها. جرت مراجعة سلامة صياغة JS في المحمّل الجديد، لكن **لم ينفذ هنا اختبار `node --test` على نسخة محلية كاملة من المستودع، أو اختبارات Chrome الفعلية**.

### أوامر التشغيل عند توفر بيئة Node ومتصفح متصل
```bash
node --test tests/cwv-loading-stage5.test.js
cd tools
npm install
npx playwright install chromium
npm run audit -- --all-widths --compare-ads
```

## 5. شروط قبول المرحلة السادسة
1. عرض الصفحات الرئيسية والفرعية على 360/390/412 بكسل مع الاتصال السريع والبطيء، ومقارنة لقطات قبل/بعد.
2. قياس CLS وLCP وINP وFCP، ورصد أوقات تبدّل Tajawal وظهور Font Awesome.
3. التحقق عمليًا من البحث والعدادات والتقييمات وتثبيت PWA والروابط والقوائم والإعلانات.
4. اختبار ملء وحدات AdSense بشكل طبيعي بلا تهيئة مكررة.
5. مراقبة بيانات Search Console خلال 28 يومًا؛ لا يمكن استنتاج تحسّن CLS الميداني من التعديلات الشيفرية فقط.

**الحالة:** التعديلات البرمجية في مجموعة الصفحات المستهدفة رُفعت إلى الفرع الافتراضي؛ قياسات المتصفح وبيانات المستخدمين الفعلية ما تزال مطلوبة.
