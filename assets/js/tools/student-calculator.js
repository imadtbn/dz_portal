/* Student DZ — Smart Calculator */
(() => {
  'use strict';

  const STORAGE_KEY = 'studentDzSmartCalculatorHistory';
  const MAX_HISTORY = 100;
  const state = { expression: '', result: null, editingId: null };

  const $ = (id) => document.getElementById(id);
  const expressionEl = $('calculatorExpression');
  const resultEl = $('calculatorResult');
  const titleInput = $('calculationTitle');
  const saveBtn = $('saveCalculationBtn');
  const cancelEditBtn = $('cancelEditBtn');
  const editModeEl = $('editMode');
  const historyList = $('historyList');
  const historyCount = $('historyCount');

  const arabicDigits = '٠١٢٣٤٥٦٧٨٩';
  const westernDigits = '0123456789';

  function normalize(value) {
    return String(value)
      .replace(/[٠-٩]/g, (d) => westernDigits[arabicDigits.indexOf(d)])
      .replace(/٫/g, '.')
      .replace(/٬/g, '')
      .replace(/×/g, '*')
      .replace(/÷/g, '/')
      .replace(/−/g, '-')
      .replace(/٪/g, '%')
      .replace(/,/g, '.');
  }

  function prettyExpression(value) {
    return value.replace(/\*/g, ' × ').replace(/\//g, ' ÷ ').replace(/\+/g, ' + ').replace(/-/g, ' − ').replace(/\s+/g, ' ').trim();
  }

  function formatResult(value) {
    if (!Number.isFinite(value)) return 'خطأ في العملية';
    const rounded = Math.abs(value) < 1e-12 ? 0 : Number(value.toFixed(12));
    return new Intl.NumberFormat('ar-DZ', { maximumFractionDigits: 12 }).format(rounded);
  }

  function tokenize(input) {
    const s = normalize(input).replace(/\s+/g, '');
    if (!s) return [];
    const tokens = [];
    let i = 0;
    let expectUnary = true;

    while (i < s.length) {
      const ch = s[i];
      if (/[0-9.]/.test(ch)) {
        let num = '';
        let dots = 0;
        while (i < s.length && /[0-9.]/.test(s[i])) {
          if (s[i] === '.') dots++;
          if (dots > 1) throw new Error('رقم غير صالح');
          num += s[i++];
        }
        if (num === '.') throw new Error('رقم غير صالح');
        tokens.push({ type: 'number', value: Number(num) });
        expectUnary = false;
        continue;
      }
      if (ch === '(') { tokens.push({ type: 'left' }); i++; expectUnary = true; continue; }
      if (ch === ')') { tokens.push({ type: 'right' }); i++; expectUnary = false; continue; }
      if ('+-*/%'.includes(ch)) {
        if (ch === '-' && expectUnary) tokens.push({ type: 'operator', value: 'u-' });
        else if (ch === '+' && expectUnary) tokens.push({ type: 'operator', value: 'u+' });
        else tokens.push({ type: 'operator', value: ch });
        i++;
        expectUnary = true;
        continue;
      }
      throw new Error('رمز غير مدعوم');
    }
    return tokens;
  }

  function evaluate(input) {
    const tokens = tokenize(input);
    if (!tokens.length) throw new Error('أدخل معادلة أولاً');

    const output = [];
    const operators = [];
    const precedence = { '+': 1, '-': 1, '*': 2, '/': 2, '%': 3, 'u+': 4, 'u-': 4 };
    const rightAssoc = new Set(['u+', 'u-']);

    for (const token of tokens) {
      if (token.type === 'number') output.push(token);
      else if (token.type === 'left') operators.push(token);
      else if (token.type === 'right') {
        let found = false;
        while (operators.length) {
          const top = operators.pop();
          if (top.type === 'left') { found = true; break; }
          output.push(top);
        }
        if (!found) throw new Error('أقواس غير متطابقة');
      } else {
        while (operators.length && operators[operators.length - 1].type === 'operator') {
          const top = operators[operators.length - 1].value;
          const current = token.value;
          const shouldPop = rightAssoc.has(current) ? precedence[current] < precedence[top] : precedence[current] <= precedence[top];
          if (!shouldPop) break;
          output.push(operators.pop());
        }
        operators.push(token);
      }
    }
    while (operators.length) {
      const op = operators.pop();
      if (op.type === 'left') throw new Error('أقواس غير متطابقة');
      output.push(op);
    }

    const stack = [];
    for (const token of output) {
      if (token.type === 'number') stack.push(token.value);
      else {
        if (token.value === 'u+' || token.value === 'u-') {
          if (stack.length < 1) throw new Error('معادلة غير مكتملة');
          const a = stack.pop();
          stack.push(token.value === 'u-' ? -a : a);
          continue;
        }
        if (stack.length < 2) throw new Error('معادلة غير مكتملة');
        const b = stack.pop();
        const a = stack.pop();
        let value;
        if (token.value === '+') value = a + b;
        if (token.value === '-') value = a - b;
        if (token.value === '*') value = a * b;
        if (token.value === '/') { if (b === 0) throw new Error('لا يمكن القسمة على صفر'); value = a / b; }
        if (token.value === '%') value = a * (b / 100);
        if (!Number.isFinite(value)) throw new Error('النتيجة خارج النطاق');
        stack.push(value);
      }
    }
    if (stack.length !== 1 || !Number.isFinite(stack[0])) throw new Error('معادلة غير صالحة');
    return stack[0];
  }

  function setError(message) {
    resultEl.textContent = message;
    resultEl.classList.add('error');
    state.result = null;
  }

  function updateDisplay() {
    expressionEl.textContent = state.expression ? prettyExpression(state.expression) : '0';
    resultEl.classList.remove('error');
    if (state.result !== null) resultEl.textContent = formatResult(state.result);
    else if (!state.expression) resultEl.textContent = '0';
    else resultEl.textContent = '—';
    saveBtn.disabled = state.result === null;
  }

  function calculate() {
    try {
      const value = evaluate(state.expression);
      state.result = value;
      resultEl.classList.remove('error');
      resultEl.textContent = formatResult(value);
      saveBtn.disabled = false;
      return true;
    } catch (error) {
      setError(error.message || 'تعذر حساب المعادلة');
      saveBtn.disabled = true;
      return false;
    }
  }

  function append(value) {
    state.expression += value;
    state.result = null;
    updateDisplay();
  }

  function clearAll() {
    state.expression = '';
    state.result = null;
    updateDisplay();
  }

  function backspace() {
    state.expression = state.expression.slice(0, -1);
    state.result = null;
    updateDisplay();
  }

  function loadHistory() {
    try {
      const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      return Array.isArray(data) ? data : [];
    } catch { return []; }
  }

  function saveHistory(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data.slice(0, MAX_HISTORY)));
  }

  function renderHistory() {
    const data = loadHistory();
    historyCount.textContent = `${data.length} عملية`;
    historyList.innerHTML = '';
    if (!data.length) {
      historyList.innerHTML = '<div class="history-empty">لا توجد عمليات محفوظة بعد.<br>احسب عملية ثم اضغط «حفظ العملية».</div>';
      return;
    }
    data.forEach((item) => {
      const article = document.createElement('article');
      article.className = 'history-item';
      article.innerHTML = `
        <div class="history-title"></div>
        <div class="history-expression"></div>
        <div class="history-result"></div>
        <div class="history-meta"></div>
        <div class="history-actions">
          <button type="button" class="history-btn reuse" data-id="${item.id}">إعادة الاستخدام</button>
          <button type="button" class="history-btn edit" data-id="${item.id}">تعديل</button>
          <button type="button" class="history-btn delete" data-id="${item.id}">حذف</button>
        </div>`;
      article.querySelector('.history-title').textContent = item.title || 'عملية بدون اسم';
      article.querySelector('.history-expression').textContent = prettyExpression(item.expression);
      article.querySelector('.history-result').textContent = `= ${formatResult(item.result)}`;
      article.querySelector('.history-meta').textContent = new Date(item.createdAt).toLocaleString('ar-DZ');
      historyList.appendChild(article);
    });
  }

  function saveCurrent() {
    if (state.result === null && !calculate()) return;
    const title = titleInput.value.trim() || 'عملية حسابية';
    const data = loadHistory();
    if (state.editingId) {
      const index = data.findIndex((x) => x.id === state.editingId);
      if (index >= 0) {
        data[index] = { ...data[index], title, expression: state.expression, result: state.result, updatedAt: new Date().toISOString() };
      }
      exitEditMode();
    } else {
      data.unshift({ id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`, title, expression: state.expression, result: state.result, createdAt: new Date().toISOString() });
    }
    saveHistory(data);
    titleInput.value = '';
    renderHistory();
  }

  function startEdit(id) {
    const item = loadHistory().find((x) => x.id === id);
    if (!item) return;
    state.expression = item.expression;
    state.result = item.result;
    state.editingId = id;
    titleInput.value = item.title || '';
    editModeEl.hidden = false;
    cancelEditBtn.hidden = false;
    saveBtn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> تحديث العملية';
    updateDisplay();
    titleInput.focus();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function exitEditMode() {
    state.editingId = null;
    editModeEl.hidden = true;
    cancelEditBtn.hidden = true;
    saveBtn.innerHTML = '<i class="fa-solid fa-bookmark"></i> حفظ العملية';
  }

  function deleteItem(id) {
    const item = loadHistory().find((x) => x.id === id);
    if (!item) return;
    if (!confirm(`حذف «${item.title || 'العملية'}»؟`)) return;
    saveHistory(loadHistory().filter((x) => x.id !== id));
    if (state.editingId === id) { exitEditMode(); titleInput.value = ''; }
    renderHistory();
  }

  function reuseItem(id) {
    const item = loadHistory().find((x) => x.id === id);
    if (!item) return;
    state.expression = item.expression;
    state.result = item.result;
    updateDisplay();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  document.querySelectorAll('.calc-key').forEach((button) => {
    button.addEventListener('click', () => {
      const action = button.dataset.action;
      const value = button.dataset.value;
      if (action === 'clear') clearAll();
      else if (action === 'backspace') backspace();
      else if (action === 'calculate') calculate();
      else if (value) append(value);
    });
  });

  saveBtn.addEventListener('click', saveCurrent);
  cancelEditBtn.addEventListener('click', () => { exitEditMode(); titleInput.value = ''; });
  $('clearHistoryBtn').addEventListener('click', () => {
    if (!loadHistory().length) return;
    if (confirm('هل تريد حذف جميع العمليات المحفوظة؟')) { localStorage.removeItem(STORAGE_KEY); renderHistory(); }
  });

  historyList.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-id]');
    if (!button) return;
    const id = button.dataset.id;
    if (button.classList.contains('reuse')) reuseItem(id);
    if (button.classList.contains('edit')) startEdit(id);
    if (button.classList.contains('delete')) deleteItem(id);
  });

  document.addEventListener('keydown', (event) => {
    const target = event.target;
    if (target === titleInput) return;
    if (/^[0-9.]$/.test(event.key)) append(event.key);
    else if ('+-*/%()'.includes(event.key)) append(event.key);
    else if (event.key === 'Enter' || event.key === '=') { event.preventDefault(); calculate(); }
    else if (event.key === 'Backspace') backspace();
    else if (event.key === 'Escape') clearAll();
  });

  updateDisplay();
  renderHistory();
})();