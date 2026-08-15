# تطبيق DZ Portal لنظام Android

هذا المشروع عبارة عن غلاف Android خفيف يعرض النسخة المنشورة من البوابة الجزائرية للخدمات الرقمية داخل WebView آمن. لا ينسخ ملفات الموقع داخل التطبيق؛ بل يفتح النسخة المنشورة من GitHub Pages حتى تصل تحديثات الموقع والتقييمات وStructured Data تلقائيًا إلى مستخدمي التطبيق.

## الخصائص

يحتوي التطبيق على شاشة تحميل بسيطة، ودعم زر الرجوع داخل سجل WebView، وفتح الروابط الخارجية والتطبيقات المناسبة مثل الهاتف والبريد والمتجر، ودعم JavaScript وDOM Storage الضروريين لمحرك البحث والتقييمات، مع منع الاتصالات غير المشفرة.

## البناء

من مجلد `android-app`:

```bash
export ANDROID_SDK_ROOT=/home/ubuntu/android-sdk
export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
./gradlew assembleDebug
./gradlew assembleRelease
```

توجد نسخة debug في `app/build/outputs/apk/debug/app-debug.apk`. أما نسخة release الحالية فهي غير موقعة في `app/build/outputs/apk/release/app-release-unsigned.apk`، وتحتاج إلى توقيع بمفتاح خاص قبل نشرها عبر Google Play.

## الهوية والإعدادات

اسم الحزمة هو `dz.portal.app`، والاسم الظاهر هو «البوابة الجزائرية»، والنسخة الأولى `1.0.0`. الحد الأدنى للإصدار هو Android 6.0، والهدف Android 15، والرابط الأساسي هو:

`https://imadtbn.github.io/dz_portal/`

عند تغيير رابط الموقع أو رقم النسخة، حدّث `MainActivity.java` و`app/build.gradle` ثم أعد البناء.
