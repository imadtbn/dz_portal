// adsData.js

document.addEventListener("DOMContentLoaded", function () {
    // حساب عدد إعلانات AdSense المتوفرة في الصفحة
    var adBlocks = document.querySelectorAll('ins.adsbygoogle');
    adBlocks.forEach(function (adBlock) {
        // التحقق من أن الإعلان لم يتم دفعه أو تحميله مسبقاً
        if (!adBlock.hasAttribute('data-adsbygoogle-status')) {
            try {
                (adsbygoogle = window.adsbygoogle || []).push({});
            } catch (e) {
                console.error("AdSense push error: ", e);
            }
        }
    });
});

// الانتظار حتى يتم تحميل الصفحة بالكامل
window.addEventListener('load', function () {
    // تأخير بسيط لضمان استقرار وسم الـ DOM وتجنب تضارب الـ Service Worker
    setTimeout(function () {
        var adBlocks = document.querySelectorAll('ins.adsbygoogle');
        adBlocks.forEach(function (adBlock) {
            // التحقق بدقة: إذا لم يكن الإعلان قد تم معالجته من قبل جوجل ولم يتم عمل push له
            if (!adBlock.hasAttribute('data-adsbygoogle-status') && adBlock.children.length === 0) {
                try {
                    (window.adsbygoogle = window.adsbygoogle || []).push({});
                    console.log('تم تحميل وحدة إعلانية بنجاح.');
                } catch (e) {
                    console.error('خطأ أثناء تحميل الإعلان:', e);
                }
            }
        });
    }, 600); // تأخير نصف ثانية
});