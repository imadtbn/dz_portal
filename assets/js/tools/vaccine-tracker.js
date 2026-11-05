/* Algerian vaccination tracker — 2023 health booklet + 2026 legal amendment.
   A checked dose is a parent-entered record, never proof of administration.
   Only calculation and storage occur here; catch-up decisions belong to clinicians. */
(function () {
    'use strict';
    const STORAGE_KEY = 'tools-dz-vaccination-v1';
    const DAY = 86400000;
    const NATIONAL_START = Date.UTC(2023, 9, 15);
    const HPV_AMENDMENT = Date.UTC(2026, 4, 17);
    const $ = id => document.getElementById(id);
    const pad = n => String(n).padStart(2, '0');
    const el = (tag, cls, text) => {
        const node = document.createElement(tag);
        if (cls) node.className = cls;
        if (text != null) node.textContent = String(text);
        return node;
    };
    const dateString = d => [d.getUTCFullYear(), pad(d.getUTCMonth() + 1), pad(d.getUTCDate())].join('-');
    const todayUTC = () => {
        const date = new Date();
        return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    };
    const parseDate = value => {
        const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value || '');
        if (!m || Number(m[1]) < 1900) return null;
        const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
        return d.getUTCFullYear() === +m[1] && d.getUTCMonth() + 1 === +m[2] && d.getUTCDate() === +m[3] ? d : null;
    };
    // Add calendar months and clamp at the month end (e.g. 31 January + 1 month).
    const addMonths = (date, months) => {
        const y = date.getUTCFullYear(), m = date.getUTCMonth() + months;
        const last = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
        return new Date(Date.UTC(y, m, Math.min(date.getUTCDate(), last)));
    };
    const shortDate = date => new Intl.DateTimeFormat('ar-DZ-u-nu-latn', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(date);
    const validSaved = value => {
        if (!value || value.version !== 1 || !parseDate(value.birth) || !value.completed ||
            typeof value.completed !== 'object' || Array.isArray(value.completed)) return false;
        return Object.entries(value.completed).length <= 50 &&
            Object.entries(value.completed).every(([key, val]) =>
                /^[a-z0-9]+:[A-Z]+$/.test(key) && (val === '' || typeof val === 'string' && !!parseDate(val)));
    };

    document.addEventListener('DOMContentLoaded', () => {
        document.querySelectorAll('.faq-question').forEach((question, i) => {
            const answer = question.nextElementSibling;
            if (!answer) return;
            answer.id = answer.id || 'vaccine-faq-answer-' + i;
            question.setAttribute('type', 'button');
            question.setAttribute('aria-controls', answer.id);
            question.setAttribute('aria-expanded', 'false');
            question.addEventListener('click', () => {
                const open = question.getAttribute('aria-expanded') === 'true';
                document.querySelectorAll('.faq-question[aria-expanded="true"]').forEach(other => {
                    if (other !== question) {
                        other.setAttribute('aria-expanded', 'false');
                        other.classList.remove('active');
                        other.nextElementSibling?.classList.remove('open');
                    }
                });
                question.setAttribute('aria-expanded', String(!open));
                question.classList.toggle('active', !open);
                answer.classList.toggle('open', !open);
            });
        });

        const form = $('vax-birth-form'), day = $('birth-day'), month = $('birth-month');
        const year = $('birth-year'), message = $('vax-form-message');
        const dashboard = $('vaccine-result'), staticTable = $('vax-static');
        if (!form || !day || !month || !year || !dashboard) return;
        const btn = $('calculate-vaccines');
        for (let n = 1; n <= 31; n++) day.add(new Option(String(n), String(n)));
        for (let n = 1; n <= 12; n++) month.add(new Option(String(n).padStart(2, '0'), String(n)));
        for (let n = new Date().getFullYear(); n >= 1900; n--) year.add(new Option(String(n), String(n)));

        let program = null, birth = null, filter = 'all';
        let completed = Object.create(null), storageBlocked = false;
        const notify = text => {
            const item = $('vax-save-message');
            if (item) item.textContent = text;
        };
        const showError = text => { message.textContent = text; message.hidden = !text; };
        const fillDate = val => {
            const parts = (val || '').split('-');
            year.value = parts[0] || '';
            month.value = parts[1] ? String(+parts[1]) : '';
            day.value = parts[2] ? String(+parts[2]) : '';
        };
        const selectedDate = () => year.value && month.value && day.value ?
            [year.value, pad(month.value), pad(day.value)].join('-') : '';
        function persist() {
            if (storageBlocked || !birth) return;
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify({
                    version: 1, birth: dateString(birth), completed
                }));
                notify('تم حفظ التحديث على هذا المتصفح.');
            } catch (_) {
                notify('تعذر حفظ السجل في هذا المتصفح. يمكنك تصدير نسخة للاحتفاظ بها.');
            }
        }
        const markStatus = (stage, key, code, due, end, now) => {
            if (Object.prototype.hasOwnProperty.call(completed, key)) return 'done';
            // Historical doses must not be diagnosed as missed under a later national schedule.
            if (end.getTime() < NATIONAL_START || (code === 'HPV' && end.getTime() < HPV_AMENDMENT)) return 'review';
            if (now.getTime() < due.getTime()) return 'upcoming';
            if (now.getTime() > end.getTime()) return 'overdue';
            return 'due';
        };
        function render(focusId) {
            if (!program || !birth) return;
            const today = todayUTC();
            const parts = [];
            let done = 0, dueCount = 0, future = 0;
            let nearest = null, late = false;
            for (const stage of program.stages) {
                const due = addMonths(birth, stage.months);
                const end = stage.endMonths ? new Date(addMonths(birth, stage.endMonths).getTime() - DAY) : due;
                for (const code of stage.vaccines) {
                    const key = stage.id + ':' + code;
                    const status = markStatus(stage, key, code, due, end, today);
                    parts.push({ stage, code, key, status, due, end });
                    if (status === 'done') done++;
                    else if (status === 'review') { /* Show as unverified; not an overdue dose. */ }
                    else if (status === 'upcoming') {
                        future++;
                        if (!nearest || due < nearest.due) nearest = { due, label: stage.label };
                    } else {
                        dueCount++;
                        if (status === 'overdue') late = true;
                    }
                }
            }
            const months = (today.getUTCFullYear() - birth.getUTCFullYear()) * 12 +
                today.getUTCMonth() - birth.getUTCMonth() -
                (today.getUTCDate() < birth.getUTCDate() ? 1 : 0);
            const years = Math.floor(Math.max(0, months) / 12);
            const remainingMonths = Math.max(0, months) % 12;
            $('vax-age').textContent = 'العمر الحالي: ' + (years ? years + ' سنة و' : '') + remainingMonths + ' شهر';
            $('vax-next').textContent = late ? 'توجد مواعيد تجاوزت تاريخها المرجعي دون تأشير؛ راجعي المركز الصحي.' :
                dueCount ? 'توجد جرعات حان موعدها أو تقع ضمن فترة إعطائها؛ تحققي من الدفتر.' :
                nearest ? 'الموعد القادم: ' + nearest.label + '، يوم ' + shortDate(nearest.due) :
                'لا توجد مواعيد حالية غير منجزة؛ راجعي الجرعات التاريخية مع دفتر الصحة عند وجودها.';
            $('vax-done-count').textContent = done;
            $('vax-due-count').textContent = dueCount;
            $('vax-next-count').textContent = future;
            const percent = parts.length ? Math.round(done * 100 / parts.length) : 0;
            $('vax-progress-bar').style.width = percent + '%';
            $('vax-progress-label').textContent = done + ' من ' + parts.length + ' بند تلقيح مؤشّر كمنجز (' + percent + '%)';
            const timeline = $('vax-timeline');
            timeline.replaceChildren();
            let shown = 0;
            for (const stage of program.stages) {
                const entries = parts.filter(p => p.stage.id === stage.id &&
                    (filter === 'all' || filter === 'done' && p.status === 'done' ||
                    filter === 'pending' && p.status !== 'done'));
                if (!entries.length) continue;
                shown += entries.length;
                const card = el('section', 'vax-stage');
                const header = el('div', 'vax-stage-head');
                const identity = el('div');
                identity.append(el('h4', null, stage.label));
                const period = stage.endMonths
                    ? shortDate(addMonths(birth, stage.months)) + ' — ' + shortDate(new Date(addMonths(birth, stage.endMonths).getTime() - DAY))
                    : shortDate(addMonths(birth, stage.months));
                identity.append(el('p', null, period));
                header.append(identity);
                if (stage.source === '2023+2026') header.append(el('span', 'vax-2026', 'يتضمن تعديل 2026'));
                card.append(header);
                const list = el('div', 'vax-dose-list');
                for (const item of entries) {
                    const info = program.vaccines[item.code];
                    const row = el('div', 'vax-dose vax-is-' + item.status);
                    const id = 'vax-check-' + item.key.replace(':', '-');
                    const label = el('label', 'vax-dose-main');
                    const checkbox = el('input');
                    checkbox.type = 'checkbox';
                    checkbox.id = id;
                    checkbox.checked = item.status === 'done';
                    checkbox.addEventListener('change', () => {
                        if (checkbox.checked) completed[item.key] = '';
                        else delete completed[item.key];
                        persist();
                        render(id);
                    });
                    const textHolder = el('span', 'vax-dose-text');
                    const vaccineTitle = el('strong', null, info.description);
                    vaccineTitle.append(el('bdi', 'vax-code', ' ' + info.label));
                    textHolder.append(vaccineTitle);
                    if (info.route) textHolder.append(el('small', null, info.route));
                    if (item.code === 'HPV') textHolder.append(el('small', 'vax-updated', 'أُضيف سنة 2026؛ عدد جرعاته وملاءمته يحددهما المركز. لا تؤشري على الإنجاز إلا بعد تأكيد اكتمال التلقيح.'));
                    label.append(checkbox, textHolder);
                    row.append(label);
                    const statusText = el('div', 'vax-status-area');
                    const statusLabel = { done: 'منجز وفق اختيارك', due: 'حان الموعد / ضمن الفترة',
                        overdue: 'متأخر عن الموعد المرجعي', upcoming: 'قيد الانتظار',
                        review: 'تاريخي — تحققي من دفتر الصحة' };
                    statusText.append(el('span', 'vax-pill vax-pill-' + item.status, statusLabel[item.status]));
                    if (item.status === 'upcoming') {
                        const left = Math.round((item.due - today) / DAY);
                        statusText.append(el('small', 'vax-countdown', 'متبقٍّ ' + left + ' يومًا'));
                    } else if (item.status === 'overdue') {
                        const elapsed = Math.round((today - item.end) / DAY);
                        statusText.append(el('small', 'vax-countdown', 'تجاوز الموعد المرجعي بـ' + elapsed + ' يومًا'));
                    }
                    row.append(statusText);
                    if (item.status === 'done') {
                        const optional = el('div', 'vax-completion-date');
                        const dateLabel = el('label', null, (item.code === 'HPV' ? 'تاريخ تأكيد اكتمال التلقيح (اختياري):' : 'تاريخ إعطاء اللقاح (اختياري من دفتر الصحة):'));
                        const dateInput = el('input');
                        dateInput.type = 'date';
                        dateInput.value = completed[item.key] || '';
                        dateInput.min = dateString(birth);
                        dateInput.max = dateString(today);
                        dateInput.id = 'vax-date-' + item.key.replace(':', '-');
                        dateLabel.htmlFor = dateInput.id;
                        dateInput.addEventListener('change', () => {
                            if (dateInput.value && (!parseDate(dateInput.value) || dateInput.value < dateString(birth) ||
                                dateInput.value > dateString(today))) {
                                dateInput.value = completed[item.key] || '';
                                notify('تاريخ الجرعة يجب أن يكون تاريخًا صحيحًا بين الميلاد واليوم.');
                                return;
                            }
                            completed[item.key] = dateInput.value;
                            persist();
                        });
                        optional.append(dateLabel, dateInput);
                        row.append(optional);
                    }
                    list.append(row);
                }
                card.append(list);
                timeline.append(card);
            }
            $('vax-no-results').hidden = shown > 0;
            dashboard.hidden = false;
            staticTable.hidden = true;
            if (focusId) $(focusId)?.focus({ preventScroll: true });
        }
        function loadSaved() {
            try {
                const raw = localStorage.getItem(STORAGE_KEY);
                if (!raw) return;
                const stored = JSON.parse(raw);
                if (!validSaved(stored)) {
                    storageBlocked = true;
                    showError('هناك سجل سابق غير قابل للقراءة. لن تُستبدل بياناته تلقائيًا؛ يمكنك حذفه بعد التأكد من عدم حاجتك إليه.');
                    return;
                }
                const birthday = parseDate(stored.birth);
                if (birthday > todayUTC()) return;
                birth = birthday;
                completed = Object.assign(Object.create(null), stored.completed);
                fillDate(stored.birth);
            } catch (_) {
                storageBlocked = true;
                showError('تعذر قراءة سجل التلقيح المحفوظ. لا يُجرى أي حذف تلقائي.');
            }
        }
        form.addEventListener('submit', event => {
            event.preventDefault();
            if (!program) { showError('تعذر تحميل بيانات الرزنامة. حاولي تحديث الصفحة عند توفر الاتصال.'); return; }
            const value = selectedDate(), candidate = parseDate(value);
            if (!candidate || candidate > todayUTC()) {
                showError('اختاري يومًا وشهرًا وسنة صحيحة لتاريخ ميلاد الطفل (اليوم أو قبله).');
                return;
            }
            if (birth && dateString(birth) !== value && Object.keys(completed).length) {
                if (!confirm('تغيير تاريخ الميلاد سيبدأ سجلًا جديدًا للطفل، وستُحذف علامات الجرعات القديمة من هذا المتصفح. هل تريد المتابعة؟')) return;
                completed = Object.create(null);
            }
            birth = candidate;
            $('birth-date').value = value;
            showError('');
            filter = 'all';
            document.querySelectorAll('.vax-filter').forEach(button => {
                button.classList.toggle('is-active', button.dataset.vaxFilter === filter);
                button.setAttribute('aria-pressed', String(button.dataset.vaxFilter === filter));
            });
            persist();
            render();
            dashboard.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
        document.querySelectorAll('.vax-filter').forEach(button => {
            button.addEventListener('click', () => {
                filter = button.dataset.vaxFilter;
                document.querySelectorAll('.vax-filter').forEach(tab => {
                    tab.classList.toggle('is-active', tab === button);
                    tab.setAttribute('aria-pressed', String(tab === button));
                });
                render();
            });
        });
        $('vax-change-date').addEventListener('click', () => {
            $('vax-date-card').scrollIntoView({ behavior: 'smooth', block: 'center' });
            day.focus({ preventScroll: true });
        });
        $('vax-export').addEventListener('click', () => {
            if (!birth) return;
            const data = JSON.stringify({ version: 1, source: 'Algeria 2023 schedule + 2026 HPV amendment',
                exportedAt: new Date().toISOString(), birth: dateString(birth), completed }, null, 2);
            const url = URL.createObjectURL(new Blob([data], { type: 'application/json;charset=utf-8' }));
            const link = el('a');
            link.href = url;
            link.download = 'tools-dz-vaccination-' + dateString(birth) + '.json';
            document.body.append(link);
            link.click();
            link.remove();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
            notify('تم إعداد ملف السجل للتصدير. يحتوي على تاريخ الميلاد، فاحتفظي به في مكان خاص.');
        });
        $('vax-delete').addEventListener('click', () => {
            if (!confirm('هل تريد حذف تاريخ الميلاد وعلامات الجرعات من هذا المتصفح؟ لا يمكن التراجع.')) return;
            try {
                localStorage.removeItem(STORAGE_KEY);
                storageBlocked = false;
                birth = null;
                completed = Object.create(null);
                fillDate('');
                dashboard.hidden = true;
                staticTable.hidden = false;
                showError('');
                notify('تم حذف سجل التلقيح من هذا المتصفح.');
            } catch (_) { notify('تعذر حذف السجل بسبب إعدادات تخزين المتصفح.'); }
        });

        btn.disabled = true;
        loadSaved();
        fetch('../data/medical/vaccines/algeria.json')
            .then(response => { if (!response.ok) throw new Error('fetch'); return response.json(); })
            .then(data => {
                if (!Array.isArray(data.stages) || data.stages.length !== 9 || !data.vaccines)
                    throw new Error('invalid reference');
                program = data;
                btn.disabled = false;
                if (birth) render();
            })
            .catch(() => {
                btn.disabled = false;
                showError('تعذر تحميل البيانات المرجعية الآن. يمكنك قراءة الجدول الثابت أدناه؛ لا تُحسَب مواعيد شخصية إلى أن تعود البيانات.');
            });
    });
})();
