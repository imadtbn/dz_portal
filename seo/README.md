# منظومة الكلمات المفتاحية في البوابة الجزائرية للخدمات الرقمية

تمت إضافة كتالوج قطاعي في `keyword-catalog.json` يغطي صفحات القطاعات الموجودة في المشروع. يعتمد الكتالوج على اسم الصفحة والعناوين الظاهرة فيها، مع مرادفات عربية وفرنسية/لاتينية محافظة للقطاعات الأكثر بحثاً مثل `AADL` و`Progres` و`CNAS` و`CASNOS` و`CNR` و`SNTF` و`Sonelgaz` و`Mobilis` و`Djezzy` و`Ooredoo`.

يُعاد بناء الكتالوج بواسطة:

```bash
python3 scripts/build_keyword_catalog.py
```

بعد ذلك تُحقن الكلمات في وسوم `title` و`description` و`keywords` والبيانات المنظمة من خلال:

```bash
python3 scripts/build_seo_metadata.py
python3 scripts/rebuild_indexing_files.py
```

ولفحص التغطية النصية للكلمات القطاعية:

```bash
python3 scripts/monitor_keyword_coverage.py
```

ينتج الفحص ملفي `keyword-coverage-report.md` و`keyword-coverage-report.json`. التغطية هنا تعني وجود العبارة في العنوان أو الوصف أو العناوين أو النص المرئي، ولا تعني ترتيب الصفحة في Google أو Bing. لقياس الظهور والنقرات والترتيب الفعلي، يجب مراجعة تقارير Google Search Console وBing Webmaster Tools دورياً.

> لا تعتمد المنظومة على حشو الكلمات أو إنشاء صفحات مخفية؛ الأولوية للمحتوى المرئي، العناوين الواضحة، الروابط الرسمية، البيانات المنظمة، وخريطة الموقع المحدثة.
