(() => {
  'use strict';
  const form = document.getElementById('age-form');
  const birthInput = document.getElementById('birthdate');
  const error = document.getElementById('age-error');
  const result = document.getElementById('result');
  const $ = (id) => document.getElementById(id);
  const today = new Date();
  const localDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  birthInput.max = [today.getFullYear(), String(today.getMonth()+1).padStart(2,'0'), String(today.getDate()).padStart(2,'0')].join('-');

  function dateFromInput(value) {
    const parts = value.split('-').map(Number);
    if (parts.length !== 3 || parts.some((n) => !Number.isInteger(n))) return null;
    const date = new Date(parts[0], parts[1]-1, parts[2]);
    return date.getFullYear() === parts[0] && date.getMonth() === parts[1]-1 && date.getDate() === parts[2] ? date : null;
  }
  function utcDayNumber(date) {
    return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86400000;
  }
  function calculateAge(birth, current) {
    let years = current.getFullYear() - birth.getFullYear();
    let months = current.getMonth() - birth.getMonth();
    let days = current.getDate() - birth.getDate();
    if (days < 0) {
      months -= 1;
      days += new Date(current.getFullYear(), current.getMonth(), 0).getDate();
    }
    if (months < 0) {
      years -= 1;
      months += 12;
    }
    let nextYear = current.getFullYear();
    let nextBirthday = new Date(nextYear, birth.getMonth(), birth.getDate());
    if (nextBirthday < current || nextBirthday.getTime() === current.getTime() && birth.getTime() !== current.getTime()) {
      nextYear += 1;
      nextBirthday = new Date(nextYear, birth.getMonth(), birth.getDate());
    }
    return {
      years, months, days,
      totalDays: utcDayNumber(current) - utcDayNumber(birth),
      daysToBirthday: Math.max(0, utcDayNumber(nextBirthday) - utcDayNumber(current)),
    };
  }
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    error.hidden = true;
    error.textContent = '';
    const birth = dateFromInput(birthInput.value);
    if (!birth) {
      error.textContent = 'أدخل تاريخ ميلاد صحيحًا.';
      error.hidden = false;
      result.hidden = true;
      return;
    }
    if (birth > localDate) {
      error.textContent = 'يجب أن يكون تاريخ الميلاد اليوم أو في الماضي.';
      error.hidden = false;
      result.hidden = true;
      return;
    }
    const age = calculateAge(birth, localDate);
    $('years-res').textContent = age.years.toLocaleString('ar-DZ');
    $('months-res').textContent = age.months.toLocaleString('ar-DZ');
    $('days-res').textContent = age.days.toLocaleString('ar-DZ');
    $('total-days').textContent = age.totalDays.toLocaleString('ar-DZ');
    $('next-bday').textContent = age.daysToBirthday === 0 ? 'عيد ميلاد سعيد! اليوم هو عيد ميلادك.' : age.daysToBirthday.toLocaleString('ar-DZ') + ' يوم';
    result.hidden = false;
  });
  form.addEventListener('reset', () => {
    error.hidden = true;
    error.textContent = '';
    result.hidden = true;
  });
})();