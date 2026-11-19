/* ==========================================================================
   Request a free estimate — one flow (mockup, nothing is sent)
   Services → Project → Date & time → Details → Confirm
   No prices are shown: the written price comes after the on-site visit.
   ========================================================================== */
(function () {
  'use strict';

  const MIL = (window.MIL = window.MIL || {});
  const root = document.querySelector('[data-booking]');
  if (!root) return;


  const ICONS = {
    irrigation: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3c4 4.6 6 8 6 11a6 6 0 0 1-12 0c0-3 2-6.4 6-11z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>',
    landscape: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="9" r="3" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 3v1M12 14v1M6 9H5M19 9h-1M12 15v6M12 18c-2 0-3.5-1-4-2.5M12 19c2 0 3.5-1 4-2.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/></svg>',
    drainage: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 10h18M3 15h18" stroke="currentColor" stroke-width="2"/><circle cx="7.5" cy="12.5" r="1.2" fill="currentColor"/><circle cx="12" cy="12.5" r="1.2" fill="currentColor"/><circle cx="16.5" cy="12.5" r="1.2" fill="currentColor"/><path d="M8 4l1.5 3M15 4l-1 3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    lawn: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 20h18M5 20c0-4 .6-7 1.5-9M9 20c0-5 1-8 2.5-10.5M14 20c0-4 .7-7 2-9M18.5 20c0-3 .3-5 1-6.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/></svg>',
    water: '<svg viewBox="0 0 24 24" aria-hidden="true"><ellipse cx="12" cy="18" rx="8" ry="3" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 17V9M12 9c-2.5 0-4 2-4.5 4M12 9c2.5 0 4 2 4.5 4M12 4.5v.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/></svg>',
    general: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20c1-6 5-10 16-16-2 9-6 14-12 15" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M4 20l8-8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    check: '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M2.5 6.2l2.3 2.3L9.5 3.8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>'
  };

  const SERVICES = [
    { id: 'landscape', name: 'Landscape Design & Install', short: 'Landscaping', sub: 'Beds, plants, patios, lighting', color: 'var(--earth)' },
    { id: 'lawn', name: 'Lawn Care & Maintenance', short: 'Lawn care', sub: 'Weekly or bi-weekly', color: 'var(--sage-deep)' },
    { id: 'drainage', name: 'Drainage Solutions', short: 'Drainage', sub: 'French drains & catch basins', color: 'var(--forest-2)' },
    { id: 'irrigation', name: 'Irrigation & Sprinklers', short: 'Sprinklers', sub: 'Install, repair or tune-up', color: 'var(--water-deep)' },
    { id: 'water', name: 'Water Features & Ponds', short: 'Water feature', sub: 'Fountains, waterfalls, ponds', color: 'var(--water-deep)' },
    { id: 'general', name: 'Not sure yet', short: 'General consultation', sub: "Let's walk the yard and talk it through", color: 'var(--sage-deep)' }
  ];
  MIL.ICONS = ICONS;
  MIL.SERVICES = SERVICES;

  const form = root.querySelector('[data-booking-form]');
  const steps = [...root.querySelectorAll('.booking-step')];
  const progress = [...root.querySelectorAll('[data-progress]')];
  const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasGsap = () => typeof window.gsap !== 'undefined';

  const SLOTS = [
    { id: '08', label: '8 – 10 AM', part: 'Morning', start: 8 },
    { id: '10', label: '10 AM – 12 PM', part: 'Morning', start: 10 },
    { id: '13', label: '1 – 3 PM', part: 'Afternoon', start: 13 },
    { id: '15', label: '3 – 5 PM', part: 'Afternoon', start: 15 }
  ];

  const BOOKING_WINDOW_DAYS = 28;

  /* ---------- Project questions (no prices) ---------- */
  const YARDS = [
    { v: 'small', l: 'Small', h: 'under 5,000 sq ft' },
    { v: 'medium', l: 'Medium', h: '5–10k sq ft' },
    { v: 'large', l: 'Large', h: '10–20k sq ft' },
    { v: 'xl', l: 'Estate', h: '20k+ sq ft' }
  ];

  const QUESTIONS = {
    landscape: [
      { key: 'areas', type: 'checks', label: 'What are you thinking about?', options: [
        { v: 'beds', l: 'Planting beds & mulch' },
        { v: 'patio', l: 'Flagstone patio / hardscape' },
        { v: 'lighting', l: 'Landscape lighting' },
        { v: 'redesign', l: 'A full yard redesign' }
      ] },
      { key: 'style', type: 'seg', label: 'Plant style', options: [
        { v: 'classic', l: 'Classic', h: 'hardy natives' },
        { v: 'signature', l: 'Signature', h: 'mature & specimen' },
        { v: 'unsure', l: 'Not sure', h: 'help me choose' }
      ] }
    ],
    lawn: [
      { key: 'yard', type: 'seg', wrap: true, label: 'Lawn size', options: YARDS },
      { key: 'freq', type: 'seg', label: 'How often?', options: [
        { v: 'weekly', l: 'Weekly', h: 'growing season' },
        { v: 'biweekly', l: 'Bi‑weekly', h: 'every 2 weeks' }
      ] }
    ],
    drainage: [
      { key: 'issues', type: 'checks', label: 'What are you seeing?', options: [
        { v: 'standing', l: 'Standing water after rain' },
        { v: 'foundation', l: 'Water near the foundation' },
        { v: 'soggy', l: 'Soggy lawn or beds' },
        { v: 'runoff', l: 'Gutter / downspout runoff' }
      ] }
    ],
    irrigation: [
      { key: 'mode', type: 'seg', label: 'What do you need?', options: [
        { v: 'install', l: 'New system' },
        { v: 'repair', l: 'Repair' },
        { v: 'tuneup', l: 'Tune-up' }
      ] },
      { key: 'yard', type: 'seg', wrap: true, label: 'Yard size', options: YARDS, show: ['mode', 'install'] }
    ],
    water: [
      { key: 'type', type: 'seg', label: 'Type of feature', options: [
        { v: 'fountain', l: 'Fountain', h: 'bubbling / tiered' },
        { v: 'waterfall', l: 'Waterfall', h: 'pondless, rock' },
        { v: 'pond', l: 'Pond', h: 'garden / koi' }
      ] }
    ]
  };

  const PROJECT_DEFAULTS = {
    landscape: { areas: ['beds'], style: 'classic' },
    lawn: { yard: 'medium', freq: 'weekly' },
    drainage: { issues: ['standing'] },
    irrigation: { mode: 'install', yard: 'medium' },
    water: { type: 'fountain' }
  };
  const freshProject = () => JSON.parse(JSON.stringify(PROJECT_DEFAULTS));

  const state = {
    step: 1,
    services: [],
    project: freshProject(),
    date: null, // Date
    slot: null,
    viewMonth: null // Date (1st of month)
  };

  /* ---------- Helpers ---------- */
  const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
  const sameDay = (a, b) => a && b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const fmtLong = (d) => d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const fmtMonth = (d) => d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const svc = (id) => SERVICES.find((s) => s.id === id) || {};
  const ordered = (ids) => SERVICES.map((s) => s.id).filter((id) => ids.includes(id));

  // Deterministic pseudo-random "booked" slots so the calendar looks real and stays stable
  function hash(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return (h >>> 0) / 4294967295;
  }
  const isSlotBooked = (date, slotId) => hash(iso(date) + ':' + slotId) < 0.38;

  const today = startOfDay(new Date());
  const firstBookable = addDays(today, 1);
  const lastBookable = addDays(today, BOOKING_WINDOW_DAYS);

  function dayStatus(d) {
    if (d < firstBookable || d > lastBookable) return 'out';
    if (d.getDay() === 0) return 'closed';
    const free = SLOTS.filter((s) => !isSlotBooked(d, s.id)).length;
    return free === 0 ? 'full' : 'open';
  }

  /* ---------- Step 1: services (multi-select) ---------- */
  const servicesWrap = root.querySelector('[data-booking-services]');
  servicesWrap.innerHTML = SERVICES.map((s) => `
    <div class="option${s.id === 'general' ? ' option-full' : ''}">
      <input type="checkbox" name="b-service" id="b-${s.id}" value="${s.id}">
      <label for="b-${s.id}">
        <span class="chip-icon" style="--chip:${s.color}">${ICONS[s.id] || ''}</span>
        <span>${s.id === 'general' ? s.short : s.name}<small>${s.sub}</small></span>
      </label>
      <span class="option-check" aria-hidden="true">${ICONS.check}</span>
    </div>`).join('');

  function syncServiceInputs() {
    servicesWrap.querySelectorAll('input[name="b-service"]').forEach((cb) => { cb.checked = state.services.includes(cb.value); });
  }

  // "Not sure yet" is exclusive with the specific services
  function toggleService(id, on) {
    if (on) {
      state.services = id === 'general' ? ['general'] : ordered([...state.services.filter((x) => x !== 'general'), id]);
    } else {
      state.services = state.services.filter((x) => x !== id);
    }
    syncServiceInputs();
  }

  servicesWrap.addEventListener('change', (e) => {
    if (e.target.name !== 'b-service') return;
    toggleService(e.target.value, e.target.checked);
    clearStepError(1);
  });

  /* ---------- Step 2: project details ---------- */
  const panelsWrap = root.querySelector('[data-project-panels]');

  const seg = (name, value, options, wrap) => `
    <div class="segmented${wrap ? ' segmented-wrap' : ''}" role="radiogroup">
      ${options.map((o) => `
        <input type="radio" id="${name}-${o.v}" name="${name}" value="${o.v}" ${o.v === value ? 'checked' : ''}>
        <label for="${name}-${o.v}">${o.l}${o.h ? `<small>${o.h}</small>` : ''}</label>`).join('')}
    </div>`;

  const checks = (name, values, options) => `
    <div class="checks checks-2">
      ${options.map((o) => `
        <label class="check"><input type="checkbox" name="${name}" value="${o.v}" ${values.includes(o.v) ? 'checked' : ''}>${o.l}</label>`).join('')}
    </div>`;

  function questionHTML(id, q) {
    const name = `p-${id}-${q.key}`;
    const value = state.project[id][q.key];
    const show = q.show ? ` data-show="p-${id}-${q.show[0]}:${q.show[1]}"` : '';
    const control = q.type === 'checks' ? checks(name, value, q.options) : seg(name, value, q.options, q.wrap);
    return `<div class="opt-group"${show}><span class="opt-label">${q.label}</span>${control}</div>`;
  }

  function syncConditional(panel) {
    panel.querySelectorAll('[data-show]').forEach((el) => {
      const [name, val] = el.dataset.show.split(':');
      const checked = panel.querySelector(`input[name="${name}"]:checked`);
      el.hidden = !checked || checked.value !== val;
    });
  }

  function renderProject() {
    const ids = state.services.filter((id) => QUESTIONS[id]);
    panelsWrap.innerHTML = ids.length
      ? ids.map((id) => {
        const s = svc(id);
        return `
          <section class="project-panel" data-panel="${id}" aria-label="${s.name}">
            <h4 class="project-panel-title"><span class="chip-icon" style="--chip:${s.color}">${ICONS[id]}</span>${s.name}</h4>
            ${QUESTIONS[id].map((q) => questionHTML(id, q)).join('')}
          </section>`;
      }).join('')
      : '<p class="opt-hint">No problem — tell us a little about your yard and what you’d like to change, and Michael will take it from there.</p>';
    panelsWrap.querySelectorAll('[data-panel]').forEach(syncConditional);
  }

  panelsWrap.addEventListener('change', (e) => {
    const el = e.target;
    if (!el.name || !el.name.startsWith('p-')) return;
    const [, id, key] = el.name.split('-');
    if (!state.project[id]) return;
    if (el.type === 'checkbox') {
      const set = new Set(state.project[id][key]);
      el.checked ? set.add(el.value) : set.delete(el.value);
      const order = QUESTIONS[id].find((q) => q.key === key).options.map((o) => o.v);
      state.project[id][key] = order.filter((v) => set.has(v));
    } else {
      state.project[id][key] = el.value;
      syncConditional(el.closest('[data-panel]'));
    }
  });

  // Short human summary of the step 2 answers, one line per service
  const optLabel = (id, key, v) => {
    const q = QUESTIONS[id].find((x) => x.key === key);
    const o = q && q.options.find((x) => x.v === v);
    return o ? o.l : v;
  };

  function projectLines() {
    return state.services.filter((id) => QUESTIONS[id]).map((id) => {
      const p = state.project[id];
      let bits = [];
      if (id === 'landscape') {
        bits = p.areas.map((v) => optLabel(id, 'areas', v).toLowerCase());
        bits.push(p.style === 'unsure' ? 'plant style to discuss' : `${optLabel(id, 'style', p.style)} plants`);
      }
      if (id === 'lawn') bits = [`${optLabel(id, 'yard', p.yard).toLowerCase()} lawn`, optLabel(id, 'freq', p.freq).toLowerCase()];
      if (id === 'drainage') bits = p.issues.map((v) => optLabel(id, 'issues', v).toLowerCase());
      if (id === 'irrigation') {
        bits = [optLabel(id, 'mode', p.mode).toLowerCase()];
        if (p.mode === 'install') bits.push(`${optLabel(id, 'yard', p.yard).toLowerCase()} yard`);
      }
      if (id === 'water') bits = [optLabel(id, 'type', p.type).toLowerCase()];
      return `${svc(id).short}: ${bits.join(', ') || 'to discuss on site'}`;
    });
  }

  /* ---------- Step 3: calendar ---------- */
  const calGrid = root.querySelector('[data-cal-grid]');
  const calTitle = root.querySelector('[data-cal-title]');
  const calPrev = root.querySelector('[data-cal-prev]');
  const calNext = root.querySelector('[data-cal-next]');
  const slotGrid = root.querySelector('[data-slot-grid]');
  const slotsHint = root.querySelector('[data-slots-hint]');

  state.viewMonth = new Date(firstBookable.getFullYear(), firstBookable.getMonth(), 1);

  function renderCalendar() {
    const m = state.viewMonth;
    calTitle.textContent = fmtMonth(m);
    const firstDow = m.getDay();
    const daysInMonth = new Date(m.getFullYear(), m.getMonth() + 1, 0).getDate();
    let html = '';
    for (let i = 0; i < firstDow; i++) html += '<span class="cal-day is-empty" aria-hidden="true"></span>';
    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(m.getFullYear(), m.getMonth(), day);
      const st = dayStatus(d);
      const cls = ['cal-day'];
      if (st === 'open') cls.push('is-available');
      if (sameDay(d, today)) cls.push('is-today');
      if (sameDay(d, state.date)) cls.push('is-selected');
      const label = fmtLong(d) +
        (st === 'closed' ? ', closed' : st === 'full' ? ', fully booked' : st === 'out' ? ', unavailable' : ', available');
      html += `<button type="button" class="${cls.join(' ')}" data-date="${iso(d)}" ${st !== 'open' ? 'disabled' : ''} aria-label="${label}" aria-pressed="${sameDay(d, state.date)}">${day}</button>`;
    }
    calGrid.innerHTML = html;

    const prevMonthEnd = new Date(m.getFullYear(), m.getMonth(), 0);
    const nextMonthStart = new Date(m.getFullYear(), m.getMonth() + 1, 1);
    calPrev.disabled = prevMonthEnd < firstBookable;
    calNext.disabled = nextMonthStart > lastBookable;
  }

  function renderSlots() {
    if (!state.date) { slotGrid.innerHTML = ''; slotsHint.textContent = 'Select a day to see open arrival windows.'; return; }
    slotsHint.innerHTML = `Arrival windows for <strong>${fmtLong(state.date)}</strong>`;
    slotGrid.innerHTML = SLOTS.map((s) => {
      const booked = isSlotBooked(state.date, s.id);
      return `
        <div class="slot">
          <input type="radio" name="b-slot" id="slot-${s.id}" value="${s.id}" ${booked ? 'disabled' : ''} ${state.slot === s.id ? 'checked' : ''}>
          <label for="slot-${s.id}"><strong>${s.label}</strong><span>${booked ? 'Booked' : s.part}</span></label>
        </div>`;
    }).join('');
    if (hasGsap() && !reduceMotion()) {
      gsap.fromTo(slotGrid.children, { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: 0.25, stagger: 0.04, ease: 'power3.out', clearProps: 'transform' });
    }
  }

  calGrid.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-date]');
    if (!btn || btn.disabled) return;
    const [y, mo, d] = btn.dataset.date.split('-').map(Number);
    state.date = new Date(y, mo - 1, d);
    state.slot = null;
    renderCalendar();
    renderSlots();
    clearStepError(3);
    const sel = calGrid.querySelector('.is-selected');
    if (sel) sel.focus({ preventScroll: true });
  });

  slotGrid.addEventListener('change', (e) => {
    if (e.target.name === 'b-slot') { state.slot = e.target.value; clearStepError(3); }
  });

  calPrev.addEventListener('click', () => { state.viewMonth = new Date(state.viewMonth.getFullYear(), state.viewMonth.getMonth() - 1, 1); renderCalendar(); });
  calNext.addEventListener('click', () => { state.viewMonth = new Date(state.viewMonth.getFullYear(), state.viewMonth.getMonth() + 1, 1); renderCalendar(); });

  /* ---------- Step 4: details / validation ---------- */
  const fields = {
    name: form.elements.name,
    phone: form.elements.phone,
    email: form.elements.email,
    address: form.elements.address,
    notes: form.elements.notes
  };
  const validators = {
    name: (v) => v.trim().length >= 2,
    phone: (v) => v.replace(/\D/g, '').length >= 10,
    email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()),
    address: (v) => v.trim().length >= 6
  };

  function validateField(key) {
    const ok = validators[key](fields[key].value);
    fields[key].closest('.field').classList.toggle('is-invalid', !ok);
    fields[key].setAttribute('aria-invalid', String(!ok));
    return ok;
  }
  Object.keys(validators).forEach((k) => {
    fields[k].addEventListener('input', () => {
      if (fields[k].closest('.field').classList.contains('is-invalid')) validateField(k);
    });
    fields[k].addEventListener('blur', () => { if (fields[k].value) validateField(k); });
  });

  // light phone formatting
  fields.phone.addEventListener('input', () => {
    const d = fields.phone.value.replace(/\D/g, '').slice(0, 10);
    if (d.length >= 7) fields.phone.value = `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
    else if (d.length >= 4) fields.phone.value = `(${d.slice(0, 3)}) ${d.slice(3)}`;
  });

  /* ---------- Step errors ---------- */
  function stepError(n, msg) {
    const step = steps.find((s) => s.dataset.step === String(n));
    let el = step.querySelector('.step-error');
    if (!el) {
      el = document.createElement('p');
      el.className = 'step-error';
      el.setAttribute('role', 'alert');
      step.querySelector('.step-actions').before(el);
    }
    el.textContent = msg;
    if (hasGsap() && !reduceMotion()) gsap.fromTo(el, { x: -6 }, { x: 0, duration: 0.4, ease: 'elastic.out(1, 0.4)' });
  }
  function clearStepError(n) {
    const step = steps.find((s) => s.dataset.step === String(n));
    const el = step && step.querySelector('.step-error');
    if (el) el.remove();
  }

  function validateStep(n) {
    if (n === 1 && !state.services.length) { stepError(1, 'Please choose at least one service — or “Not sure yet”.'); return false; }
    if (n === 3) {
      if (!state.date) { stepError(3, 'Please pick a day.'); return false; }
      if (!state.slot) { stepError(3, 'Please pick an arrival window.'); return false; }
    }
    if (n === 4) {
      const results = Object.keys(validators).map(validateField);
      if (results.includes(false)) {
        const firstBad = Object.keys(validators).find((k) => !validators[k](fields[k].value));
        fields[firstBad].focus();
        return false;
      }
    }
    return true;
  }

  /* ---------- Step 5: review ---------- */
  const serviceNames = () => state.services.map((id) => (id === 'general' ? svc(id).short : svc(id).name));
  const slotLabel = (id) => (SLOTS.find((s) => s.id === id) || {}).label || '';

  function reviewRows(editable) {
    const rows = [['Services', serviceNames().join('<br>'), 1]];
    const lines = projectLines();
    if (lines.length) rows.push(['Project', lines.map(esc).join('<br>'), 2]);
    if (fields.notes.value.trim()) rows.push(['Your ideas', esc(fields.notes.value.trim()), 2]);
    rows.push(
      ['When', `${fmtLong(state.date)}<br>${slotLabel(state.slot)}`, 3],
      ['Name', esc(fields.name.value), 4],
      ['Phone', esc(fields.phone.value), 4],
      ['Email', esc(fields.email.value), 4],
      ['Address', esc(fields.address.value), 4]
    );
    return rows.map(([k, v, s]) => `<div><dt>${k}</dt><dd>${v}${editable ? ` <button type="button" data-goto="${s}" aria-label="Edit ${k.toLowerCase()}">Edit</button>` : ''}</dd></div>`).join('');
  }

  root.querySelector('[data-review]').addEventListener('click', (e) => {
    const b = e.target.closest('[data-goto]');
    if (b) goTo(+b.dataset.goto);
  });

  /* ---------- Navigation ---------- */
  function updateProgress(n) {
    progress.forEach((p) => {
      const i = +p.dataset.progress;
      p.classList.toggle('is-active', i === n);
      p.classList.toggle('is-done', n === 'done' || i < n);
      if (i === n) p.setAttribute('aria-current', 'step'); else p.removeAttribute('aria-current');
    });
  }

  function goTo(n) {
    const from = steps.find((s) => !s.hidden);
    const to = steps.find((s) => s.dataset.step === String(n));
    if (!to || from === to) return;
    const forward = n === 'done' || (+n > +state.step);
    state.step = n;

    if (n === 2) renderProject();
    if (n === 3) { renderCalendar(); renderSlots(); }
    if (n === 5) root.querySelector('[data-review]').innerHTML = reviewRows(true);

    updateProgress(n);

    const show = () => {
      from.hidden = true; from.classList.remove('is-active');
      to.hidden = false; to.classList.add('is-active');
      const title = to.querySelector('.step-title');
      if (title) { title.setAttribute('tabindex', '-1'); title.focus({ preventScroll: true }); }
      keepInView();
    };

    if (hasGsap() && !reduceMotion()) {
      // exit fast, enter a touch slower (asymmetric timing)
      gsap.to(from, {
        opacity: 0, x: forward ? -16 : 16, duration: 0.14, ease: 'power2.out',
        onComplete: () => {
          show();
          gsap.set(from, { clearProps: 'all' });
          gsap.fromTo(to, { opacity: 0, x: forward ? 16 : -16 }, { opacity: 1, x: 0, duration: 0.26, ease: 'power3.out', clearProps: 'transform,opacity' });
        }
      });
    } else {
      show();
    }
  }

  function keepInView() {
    const r = root.getBoundingClientRect();
    const headerH = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--header-h'), 10) || 70;
    if (r.top < headerH || r.top > window.innerHeight * 0.5) {
      const y = window.scrollY + r.top - headerH - 16;
      if (MIL.scrollToY) MIL.scrollToY(y); else window.scrollTo({ top: y, behavior: reduceMotion() ? 'auto' : 'smooth' });
    }
  }

  root.addEventListener('click', (e) => {
    if (e.target.closest('[data-next]')) {
      if (!validateStep(state.step)) return;
      goTo(state.step + 1);
    }
    if (e.target.closest('[data-back]')) goTo(state.step - 1);
  });

  /* ---------- Confirm ---------- */
  let booking = null;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (state.step !== 5) return;
    const btn = root.querySelector('[data-confirm]');
    btn.classList.add('is-loading');
    btn.setAttribute('aria-busy', 'true');

    setTimeout(() => {
      btn.classList.remove('is-loading');
      btn.removeAttribute('aria-busy');
      const ref = 'MIL-' + Math.random().toString(36).slice(2, 7).toUpperCase();
      booking = {
        ref,
        services: serviceNames(),
        project: projectLines(),
        date: new Date(state.date),
        slot: SLOTS.find((s) => s.id === state.slot),
        name: fields.name.value.trim(),
        email: fields.email.value.trim(),
        address: fields.address.value.trim(),
        notes: fields.notes.value.trim()
      };
      const first = esc(booking.name.split(' ')[0]);
      root.querySelector('[data-done-lead]').innerHTML =
        `Thanks, ${first}! Michael will see you on <strong>${fmtLong(booking.date)}</strong>, arriving between <strong>${booking.slot.label}</strong>, and you’ll get a written price after the visit. A confirmation is on its way to ${esc(booking.email)}.`;
      root.querySelector('[data-done-summary]').innerHTML =
        `<div><dt>Request #</dt><dd>${ref}</dd></div>` +
        `<div><dt>Services</dt><dd>${booking.services.join('<br>')}</dd></div>` +
        `<div><dt>Address</dt><dd>${esc(booking.address)}</dd></div>`;
      goTo('done');
      animateCheck(root.querySelector('.booking-done .done-icon'));
    }, 1400);
  });

  function animateCheck(icon) {
    if (!icon) return;
    const circle = icon.querySelector('.done-circle');
    const check = icon.querySelector('.done-check');
    if (!hasGsap() || reduceMotion()) {
      circle.style.strokeDashoffset = 0; check.style.strokeDashoffset = 0; return;
    }
    gsap.timeline({ delay: 0.15 })
      .fromTo(icon, { scale: 0.9, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.35, ease: 'power3.out' })
      .fromTo(circle, { strokeDashoffset: 151 }, { strokeDashoffset: 0, duration: 0.5, ease: 'power2.inOut' }, '<')
      .fromTo(check, { strokeDashoffset: 40 }, { strokeDashoffset: 0, duration: 0.3, ease: 'power3.out' }, '-=0.15');
  }
  MIL.animateCheck = animateCheck;

  /* ---------- .ics download ---------- */
  root.querySelector('[data-ics]').addEventListener('click', () => {
    if (!booking) return;
    const pad = (n) => String(n).padStart(2, '0');
    const d = booking.date;
    const ymd = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
    const start = `${ymd}T${pad(booking.slot.start)}0000`;
    const end = `${ymd}T${pad(booking.slot.start + 2)}0000`;
    const now = new Date();
    const stamp = `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}T${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}00Z`;
    const icsEsc = (s) => s.replace(/\\/g, '\\\\').replace(/[,;]/g, (m) => '\\' + m).replace(/\n/g, '\\n');
    const details = [...(booking.project.length ? booking.project : booking.services), `Request ${booking.ref}`, `Arrival window: ${booking.slot.label}`, 'Questions? Call 281-948-4343'];
    const ics = [
      'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Michaels Irrigation & Landscaping//Free estimate//EN', 'CALSCALE:GREGORIAN',
      'BEGIN:VEVENT',
      `UID:${booking.ref}@michaelsirrigation`,
      `DTSTAMP:${stamp}`,
      `DTSTART;TZID=America/Chicago:${start}`,
      `DTEND;TZID=America/Chicago:${end}`,
      `SUMMARY:${icsEsc("Free estimate — Michael's Irrigation & Landscaping")}`,
      `DESCRIPTION:${icsEsc(details.join('\n'))}`,
      `LOCATION:${icsEsc(booking.address)}`,
      'END:VEVENT', 'END:VCALENDAR'
    ].join('\r\n');
    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `estimate-${booking.ref}.ics`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });

  /* ---------- Restart ---------- */
  function resetFlow() {
    form.reset();
    Object.assign(state, { services: [], project: freshProject(), date: null, slot: null });
    syncServiceInputs();
    root.querySelectorAll('.field.is-invalid').forEach((f) => f.classList.remove('is-invalid'));
  }
  root.querySelector('[data-restart]').addEventListener('click', () => { resetFlow(); goTo(1); });

  /* ---------- Preselect from service cards ---------- */
  MIL.prefillEstimate = (id) => {
    if (state.step === 'done') resetFlow();
    toggleService(id, true);
    clearStepError(1);
    if (state.step !== 1) goTo(1);
    // gentle highlight of the chosen service
    const lbl = servicesWrap.querySelector(`#b-${id} + label`);
    if (lbl && hasGsap() && !reduceMotion()) {
      gsap.fromTo(lbl, { boxShadow: '0 0 0 0 rgba(160,120,80,.55)' }, { boxShadow: '0 0 0 10px rgba(160,120,80,0)', duration: 1, delay: 0.6, ease: 'power2.out', clearProps: 'boxShadow' });
    }
  };

  document.querySelectorAll('[data-estimate-service]').forEach((a) => {
    a.addEventListener('click', () => MIL.prefillEstimate(a.dataset.estimateService));
  });

  renderCalendar();
})();
