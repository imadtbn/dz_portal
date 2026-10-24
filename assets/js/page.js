/**
 * يُنفَّذ بعد تحميل بيانات الجدول لتحديث JSON-LD ديناميكياً.
 * @param {Object} schedule - بيانات الجدول: {slug, title, category, image, imageWidth, imageHeight, from, to}
 */
function injectScheduleSchema(schedule) {
    const baseUrl = "https://imadtbn.github.io/dz_portal/sectors/sntf-schedule.html";
    const scheduleUrl = `${baseUrl}?schedule=${schedule.slug}`;
    const imageUrl = `https://imadtbn.github.io/dz_portal/assets/train-schedules/${schedule.category}/${schedule.image}`;

    const schema = {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "WebPage",
                "@id": `${scheduleUrl}#webpage`,
                "url": scheduleUrl,
                "name": `جدول مواقيت ${schedule.title} | SNTF`,
                "headline": `مواقيت قطار ${schedule.title} - جدول رسمي SNTF`,
                "description": `جدول مواقيت ${schedule.title} الصادر عن الشركة الوطنية للنقل بالسكك الحديدية SNTF. اعرض الجدول المصوّر بالتكبير وملء الشاشة.`,
                "inLanguage": "ar-DZ",
                "isPartOf": { "@id": "https://imadtbn.github.io/dz_portal/#website" },
                "publisher": { "@id": "https://imadtbn.github.io/dz_portal/#organization" },
                "breadcrumb": { "@id": `${scheduleUrl}#breadcrumb` },
                "datePublished": "2026-10-04T07:56:50+00:00",
                "dateModified": new Date().toISOString(),
                "primaryImageOfPage": { "@id": `${scheduleUrl}#primaryimage` },
                "mainEntity": { "@id": `${scheduleUrl}#trip` },
                "speakable": {
                    "@type": "SpeakableSpecification",
                    "cssSelector": ["#schedule-title", "#info-title", ".schedule-notice"]
                }
            },
            {
                "@type": "BreadcrumbList",
                "@id": `${scheduleUrl}#breadcrumb`,
                "itemListElement": [
                    { "@type": "ListItem", "position": 1, "name": "الرئيسية", "item": "https://imadtbn.github.io/dz_portal/" },
                    { "@type": "ListItem", "position": 2, "name": "السكك الحديدية SNTF", "item": "https://imadtbn.github.io/dz_portal/sectors/sntf.html" },
                    { "@type": "ListItem", "position": 3, "name": "الجداول", "item": baseUrl },
                    { "@type": "ListItem", "position": 4, "name": schedule.title, "item": scheduleUrl }
                ]
            },
            {
                "@type": "ImageObject",
                "@id": `${scheduleUrl}#primaryimage`,
                "url": imageUrl,
                "contentUrl": imageUrl,
                "width": schedule.imageWidth || 2490,
                "height": schedule.imageHeight || 1050,
                "caption": `جدول مواقيت ${schedule.title} - SNTF`,
                "inLanguage": "ar-DZ",
                "representativeOfPage": true
            },
            {
                "@type": "TrainTrip",
                "@id": `${scheduleUrl}#trip`,
                "name": schedule.title,
                "trainName": "SNTF",
                "trainNumber": schedule.slug,
                "provider": {
                    "@type": "Organization",
                    "name": "الشركة الوطنية للنقل بالسكك الحديدية",
                    "alternateName": "SNTF",
                    "url": "https://www.sntf.dz/"
                },
                "departureStation": schedule.from ? { "@type": "TrainStation", "name": schedule.from } : undefined,
                "arrivalStation": schedule.to ? { "@type": "TrainStation", "name": schedule.to } : undefined,
                "providerUrl": scheduleUrl
            },
            {
                "@type": "Service",
                "@id": `${scheduleUrl}#service`,
                "name": `خدمة الاطلاع على جدول ${schedule.title}`,
                "serviceType": "عرض جدول مواقيت القطارات",
                "provider": { "@type": "Organization", "name": "SNTF", "url": "https://www.sntf.dz/" },
                "areaServed": { "@type": "Country", "name": "الجزائر" },
                "availableChannel": {
                    "@type": "ServiceChannel",
                    "serviceUrl": scheduleUrl,
                    "servicePhone": "+21321711510"
                }
            }
        ]
    };

    // إزالة المفاتيح undefined بشكل تعاودي
    const clean = (obj) => JSON.parse(JSON.stringify(obj, (k, v) => v === undefined ? undefined : v));

    document.getElementById("schedule-schema").textContent = JSON.stringify(clean(schema));

    // تحديث canonical ديناميكياً (مهم جداً)
    const canonical = document.getElementById("canonical-link");
    if (canonical) canonical.setAttribute("href", scheduleUrl);

    // تحديث OG و Twitter ديناميكياً
    document.querySelector('meta[property="og:url"]')?.setAttribute("content", scheduleUrl);
    document.querySelector('meta[property="og:title"]')?.setAttribute("content", `جدول مواقيت ${schedule.title} | SNTF`);
    document.querySelector('meta[property="og:description"]')?.setAttribute("content", `جدول مواقيت ${schedule.title} الرسمي الصادر عن SNTF.`);
    document.querySelector('meta[property="og:image"]')?.setAttribute("content", imageUrl);
    document.querySelector('meta[name="twitter:title"]')?.setAttribute("content", `جدول مواقيت ${schedule.title} | SNTF`);
    document.querySelector('meta[name="twitter:image"]')?.setAttribute("content", imageUrl);
    document.querySelector('meta[name="description"]')?.setAttribute("content", `جدول مواقيت ${schedule.title} الرسمي الصادر عن SNTF. اعرض الجدول المصوّر بالتكبير وملء الشاشة.`);

    // تحديث العنوان
    document.title = `جدول مواقيت ${schedule.title} | SNTF - البوابة الجزائرية`;
}