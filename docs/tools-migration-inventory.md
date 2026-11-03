# جرد دمج الأدوات في DZ Portal

- تاريخ الجرد: 2026-11-03
- المستودع الهدف: `imadtbn/dz_portal`
- المصادر: `imadtbn/student-dz` و`imadtbn/tools-dz`
- التنفيذ الحالي: فرع `feat/unified-tools-library`
- مبدأ الدمج: نقل الأدوات انتقائيًا مع الاحتفاظ بوظائفها، وإعادة تكييف الهيكل والروابط والستايل والإعلانات والتتبع لتتبع قالب البوابة.

## ملخص الجرد

| المصدر | صفحات أدوات HTML المرصودة | ملاحظات |
|---|---:|---|
| student-dz | 26 | يضم أدوات تعليمية وإنتاجية، إضافة إلى أدوات التقويم والقبلة والتحويلات |
| tools-dz | 41 | يضم أدوات حسابية ومالية وصحية وإدارية وإنتاجية |
| DZ Portal قبل الدمج | 0 صفحات أدوات ضمن `pages/tools/` | مجلد `tools/` الحالي مخصص لسكربتات التطوير والاختبار، لذلك لا تُنقل صفحات الأدوات إلى داخله |

## قائمة الملفات التفصيلية

### Student DZ — 26 ملفًا

| الملف الأصلي | التصنيف المقترح | ملاحظة أولية |
|---|---|---|
| `tools/apa-generator.html` | الدراسة والإنتاجية | لا |
| `tools/arabic-dictionary.html` | المستندات واللغة | فريد |
| `tools/average-calculator.html` | الحاسبات والدراسة | مقارب لحاسبات النقاط |
| `tools/budget-calculator.html` | الحياة اليومية والمال | تداخل وظيفي مع إدارة الميزانية |
| `tools/calculator.html` | الحاسبات | لا |
| `tools/countdown.html` | الدراسة والإنتاجية | تداخل محتمل مع مؤقتات الدراسة |
| `tools/cv-builder.html` | المستندات والإنتاجية | تداخل مباشر مع Tools DZ |
| `tools/date-difference.html` | الحاسبات والتقويم | لا |
| `tools/exam-planner.html` | الدراسة والطلاب | تداخل مع مخطط الامتحانات |
| `tools/flashcards.html` | الدراسة والطلاب | فريد |
| `tools/hijri-calendar.html` | إسلامية وتقويم | تداخل مباشر |
| `tools/image-compressor.html` | المستندات والإنتاجية | تداخل مباشر |
| `tools/maps.html` | الخرائط والتنقل | لا |
| `tools/notes-calendar.html` | الدراسة والتنظيم | تداخل جزئي مع التقويم والمهام |
| `tools/nutrition-calculator.html` | الصحة والتغذية | تداخل جزئي مع أدوات السعرات |
| `tools/pdf-tools.html` | المستندات والإنتاجية | تداخل مباشر |
| `tools/percentage-calculator.html` | الحاسبات | لا |
| `tools/points-ranking.html` | الدراسة والطلاب | تداخل مع حاسبة المعدل |
| `tools/pomodoro.html` | الدراسة والإنتاجية | لا |
| `tools/qibla-compass.html` | إسلامية وتقويم | تداخل مباشر |
| `tools/qr-generator.html` | المستندات والإنتاجية | تداخل مباشر |
| `tools/research-plan.html` | الدراسة والطلاب | فريد |
| `tools/semester-calculator.html` | الدراسة والطلاب | تداخل محتمل مع حاسبات المعدل |
| `tools/study-schedule.html` | الدراسة والطلاب | تداخل مع مخطط الامتحانات |
| `tools/text-tools.html` | المستندات واللغة | لا |
| `tools/unit-converter.html` | الحاسبات والتحويلات | تداخل مباشر |


### Tools DZ — 41 ملفًا

| الملف الأصلي | التصنيف المقترح | ملاحظة أولية |
|---|---|---|
| `tools/admin-procedures-assistant.html` | الإجراءات والخدمات | فريد |
| `tools/age-calculator.html` | الحاسبات | لا |
| `tools/anxiety-screening.html` | الصحة والتوعية | فريد |
| `tools/asthma-control.html` | الصحة والتوعية | فريد |
| `tools/budget-manager.html` | الحياة اليومية والمال | تداخل وظيفي مع حاسبة الميزانية |
| `tools/calorie-calculator.html` | الصحة والتغذية | تداخل جزئي مع حاسبة التغذية |
| `tools/car-cost-calculator.html` | الحاسبات والمال | فريد |
| `tools/child-bmi-calculator.html` | الصحة والتغذية | فريد |
| `tools/currency-converter.html` | الحاسبات والتحويلات | فريد |
| `tools/cv-builder.html` | المستندات والإنتاجية | تداخل مباشر |
| `tools/depression-screening.html` | الصحة والتوعية | فريد |
| `tools/diabetes-awareness.html` | الصحة والتوعية | فريد |
| `tools/eating-awareness.html` | الصحة والتوعية | فريد |
| `tools/electricity-calculator.html` | الحاسبات والمال | فريد |
| `tools/exam-study-planner.html` | الدراسة والطلاب | تداخل مع مخطط الدراسة والامتحانات |
| `tools/farm-planner.html` | الحياة اليومية والمشاريع | فريد |
| `tools/fertile-window.html` | الصحة والتوعية | فريد |
| `tools/fuel-calculator.html` | الحاسبات والمال | فريد |
| `tools/health-tools.html` | فهرس الصحة | دليل تصنيف وليس أداة منفردة |
| `tools/hijri-calendar.html` | إسلامية وتقويم | تداخل مباشر |
| `tools/ideal-weight-calculator.html` | الصحة والتغذية | تداخل جزئي مع أدوات الوزن |
| `tools/image-compressor.html` | المستندات والإنتاجية | تداخل مباشر |
| `tools/infant-growth-calculator.html` | الصحة والتغذية | فريد |
| `tools/inventory-manager.html` | الإنتاجية والمشاريع | فريد |
| `tools/invoice-generator.html` | المستندات والمال | فريد |
| `tools/loan-calculator.html` | الحاسبات والمال | فريد |
| `tools/meal-planner.html` | الحياة اليومية | فريد |
| `tools/number-to-words.html` | الحاسبات والمال | عينة تجريبية منقولة |
| `tools/pdf-tools.html` | المستندات والإنتاجية | تداخل مباشر |
| `tools/pilgrim-health-checklist.html` | الصحة والتوعية | فريد |
| `tools/prediabetes-risk.html` | الصحة والتوعية | فريد |
| `tools/pregnancy-calorie-calculator.html` | الصحة والتغذية | فريد |
| `tools/pregnancy-due-date.html` | الصحة والتوعية | فريد |
| `tools/qibla-compass.html` | إسلامية وتقويم | تداخل مباشر |
| `tools/qr-generator.html` | المستندات والإنتاجية | تداخل مباشر |
| `tools/salary-calculator.html` | الحاسبات والمال | فريد |
| `tools/sleep-assessment.html` | الصحة والتوعية | فريد |
| `tools/unit-converter.html` | الحاسبات والتحويلات | تداخل مباشر |
| `tools/vaccine-tracker.html` | الصحة والتغذية | فريد |
| `tools/visual-acuity-screening.html` | الصحة والتوعية | فريد |
| `tools/water-calculator.html` | الصحة والتغذية | فريد |


## التصنيفات المقترحة

| التصنيف | الأدوات المرشحة |
|---|---|
| الدراسة والطلاب | حاسبة المعدل، مخطط الامتحانات، البطاقات التعليمية، Pomodoro، الجدول الدراسي، مخطط البحوث، APA، حساب الفصل والنقاط |
| الحاسبات والتحويلات | الحاسبة العامة، النسب المئوية، فرق التواريخ، العمر، الوحدات، العملات، الراتب، القروض، الكهرباء، الوقود، تكلفة السيارة، تحويل الأرقام إلى كلمات |
| الصحة والتغذية | السعرات، التغذية، الوزن المثالي، BMI الأطفال، نمو الرضع، الماء، النوم، تقييمات التوعية الصحية، متابعة اللقاحات، الحمل |
| إسلامية وتقويم | التقويم الهجري، بوصلة القبلة |
| المستندات والإنتاجية | السيرة الذاتية، PDF، ضغط الصور، QR، النصوص، القاموس العربي، إنشاء الفواتير، إدارة المخزون |
| الحياة اليومية | الميزانية، مخطط الوجبات، تخطيط المزرعة، المساعد الإداري والإجراءات، التقويم والملاحظات |

## التكرارات الوظيفية المرصودة

| الوظيفة | Student DZ | Tools DZ | قرار التدقيق |
|---|---|---|---|
| التقويم الهجري | `tools/hijri-calendar.html` | `tools/hijri-calendar.html` | مقارنة الوظائف والواجهة، ثم اعتماد نسخة واحدة |
| بوصلة القبلة | `tools/qibla-compass.html` | `tools/qibla-compass.html` | توحيد نسخة واحدة بعد اختبار إذن الموقع والبوصلة |
| محول الوحدات | `tools/unit-converter.html` | `tools/unit-converter.html` | مقارنة فئات الوحدات والتحويلات |
| ضغط الصور | `tools/image-compressor.html` | `tools/image-compressor.html` | اعتماد نسخة واحدة بعد اختبار الجودة والحجم |
| أدوات PDF | `tools/pdf-tools.html` | `tools/pdf-tools.html` | مقارنة العمليات المدعومة والمكتبات المطلوبة |
| منشئ السيرة الذاتية | `tools/cv-builder.html` | `tools/cv-builder.html` | مقارنة النماذج والطباعة والتصدير |
| مخطط الدراسة/الامتحان | `tools/exam-planner.html`, `tools/study-schedule.html` | `tools/exam-study-planner.html` | تداخل وظيفي؛ لا يُحذف شيء قبل مقارنة التفاصيل |
| السعرات/التغذية | `tools/nutrition-calculator.html` | `tools/calorie-calculator.html` وأدوات صحية متعددة | وظائف متقاربة وليست بالضرورة متطابقة؛ تدقيق كل أداة صحيًا |
| الميزانية | `tools/budget-calculator.html` | `tools/budget-manager.html` | التفريق بين الحاسبة وإدارة المصروفات قبل الدمج |
| QR | `tools/qr-generator.html` | `tools/qr-generator.html` | اعتماد نسخة واحدة مع المحافظة على التنزيل والمشاركة والطباعة |
| القاموس العربي | `tools/arabic-dictionary.html` | لا توجد مطابقة مباشرة مرصودة | نقل القاموس وبياناته التابعة بعد فحص الحجم والمسارات |

## الدفعة الأولى المنقولة

### الحاسبات والتحويلات

| الأداة | المصدر | المسار داخل البوابة |
|---|---|---|
| محول الأرقام إلى الحروف بالدينار الجزائري | `tools-dz/tools/number-to-words.html` | `pages/tools/calculators/number-to-words.html` |
| حاسبة العمر | `tools-dz/tools/age-calculator.html` | `pages/tools/calculators/age-calculator.html` |
| حاسبة النسبة المئوية | `student-dz/tools/percentage-calculator.html` | `pages/tools/calculators/percentage-calculator.html` |
| حاسبة الفرق بين تاريخين | `student-dz/tools/date-difference.html` | `pages/tools/calculators/date-difference.html` |

### الدراسة والطلاب

| الأداة | المصدر | المسار داخل البوابة |
|---|---|---|
| مؤقت بومودورو | `student-dz/tools/pomodoro.html` | `pages/tools/study/pomodoro.html` |
| البطاقات التعليمية والاختبارات | `student-dz/tools/flashcards.html` | `pages/tools/study/flashcards.html` |
| مخطط الامتحانات والمهام الجامعية | `student-dz/tools/exam-planner.html` | `pages/tools/study/exam-planner.html` |

### الملفات المشتركة

- الفهرس الموحد: `pages/tools/index.html`
- التنسيقات المشتركة للحاسبات: `assets/css/tools/simple-calculator.css`
- منطق البطاقات التعليمية نُقل إلى `assets/js/tools/flashcards.js`، وتنسيقاتها إلى `assets/css/tools/flashcards.css`.
- أُضيفت صفحات الأدوات السبع إلى `sitemap.xml` مع الحفاظ على بيانات الفيديو المنظمة.
- هذه دفعة أولى تضم 4 حاسبات و3 أدوات دراسية؛ بقية الأدوات ما زالت في مرحلة التدقيق ولم تُنقل بعد.

## قواعد الحماية

1. عدم تحميل Analytics أو AdSense من المستودع المصدر.
2. استخدام `assets/js/site-tags.js` المركزي للبوابة، مع GA4/GTM المعتمدين حاليًا في هذا الملف.
3. الحفاظ على ناشر AdSense `ca-pub-5656416032906373` ووحدات البوابة الحالية.
4. عدم تشغيل `generate-sitemap.js` آليًا قبل مراجعة أثره؛ فهو يولّد قائمة عامة من جميع صفحات HTML وقد يمحو بيانات الفيديو المنظمة من Sitemap الحالي.
5. عدم حذف أو إعادة توجيه صفحات المستودعات المصدرية في هذه المرحلة.
6. عدم إعلان اكتمال الدمج أو الفهرسة قبل نشر الصفحات واختبارها.
7. تُراجع الأصول والبيانات الخارجية قبل نقل كل مجموعة، ولا تُنقل ملفات PWA أو Service Worker من المشاريع المصدرية إلى البوابة.

## بوابات القبول قبل توسيع النقل

- [x] اجتياز فحص صياغة JavaScript للسكربتات السبعة المنقولة.
- [x] اجتياز فحص المسارات المحلية للصفحات المنقولة.
- [ ] ظهور نتائج الأداة وعمل النسخ والطباعة.
- [ ] التحقق البصري الفعلي من الأدوات على الهاتف والكمبيوتر قبل النشر.
- [ ] عدم وجود تجاوز أفقي.
- [ ] عدم وجود تحميل مكرر للتتبع أو AdSense.
- [ ] تطابق الروابط وCanonical وبيانات المشاركة مع المسار الجديد.
- [ ] إضافة الصفحة إلى Sitemap الحالي دون إزالة بيانات الفيديو.
- [ ] اختبار الصفحات المنشورة بعد نشر معاينة، قبل اعتماد المجموعة التالية.

> ملاحظة: تشغيل اختبارات الموقع العامة يُظهر 20 إخفاقًا هي نفسها الموجودة في تشغيل الفرع الأساسي قبل هذه التغييرات؛ اختبارات الدفعة الجديدة وفحص المسارات وصياغة JavaScript تمر. يلزم عزل إخفاقات الأساس ومراجعة العرض البصري قبل الدمج.
