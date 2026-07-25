
const motivationCards = [

    {
        title: "ابدأ اليوم... وتميّز غدًا",
        icon: "fas fa-graduation-cap",
        badge: "رسالة تحفيزية",
        text: "النجاح لا يأتي صدفة، بل هو ثمرة الاجتهاد والمثابرة. اجعل كل درس تتعلمه اليوم خطوة نحو مستقبلك.",
        footer: "بالتوفيق والنجاح في مسيرتكم الدراسية."
    },

    {
        title: "كل يوم فرصة جديدة",
        icon: "fas fa-book-open",
        badge: "طريق النجاح",
        text: "خصص وقتًا للمراجعة كل يوم، فالإنجازات الكبيرة تبدأ بخطوات صغيرة ومتواصلة.",
        footer: "المثابرة هي مفتاح التفوق."
    },

    {
        title: "لا تستسلم",
        icon: "fas fa-rocket",
        badge: "حفّز نفسك",
        text: "قد يكون الطريق صعبًا، لكن كل تحدٍ تتجاوزه يجعلك أقرب إلى النجاح الذي تستحقه.",
        footer: "استمر... فالنجاح ينتظرك."
    },

    {
        title: "تعلم... ثم تألق",
        icon: "fas fa-lightbulb",
        badge: "نحو التميز",
        text: "القراءة، حل التمارين، ومراجعة الدروس باستمرار هي أسرار المتفوقين.",
        footer: "العلم نور... والتميز ثمرة الاجتهاد."
    },

    {
        title: "ثق بنفسك",
        icon: "fas fa-star",
        badge: "رسالة اليوم",
        text: "آمن بقدراتك، فكل طالب قادر على النجاح إذا امتلك الإرادة والعزيمة.",
        footer: "أنت قادر على تحقيق أهدافك."
    },

    {
        title: "اختبر نفسك",
        icon: "fas fa-pencil-alt",
        badge: "استعد للاختبارات",
        text: "حل الاختبارات السابقة يساعدك على اكتشاف نقاط القوة وتحسين مستواك.",
        footer: "التدريب المستمر يصنع الفارق."
    },

    {
        title: "الوقت سر النجاح",
        icon: "fas fa-clock",
        badge: "إدارة الوقت",
        text: "نظم وقتك بين الدراسة والراحة، فالتوازن يزيد من التركيز والإنتاجية.",
        footer: "كل دقيقة تستثمرها اليوم تصنع مستقبلك."
    },

    {
        title: "التفوق يبدأ من هنا",
        icon: "fas fa-medal",
        badge: "تميز",
        text: "لا تقارن نفسك بغيرك، بل قارن نفسك بما كنت عليه بالأمس، واجعل كل يوم أفضل.",
        footer: "النجاح رحلة مستمرة."
    }

];

const card =
    motivationCards[Math.floor(Math.random() * motivationCards.length)];

document.querySelector(".alert-icon i").className = card.icon;

document.querySelector(".alert-badge").innerHTML =
    `<i class="fas fa-star"></i> ${card.badge}`;

document.querySelector(".alert-content h2").textContent =
    card.title;

document.querySelector(".alert-intro").textContent =
    card.text;

document.querySelector(".alert-footer").textContent =
    card.footer;
