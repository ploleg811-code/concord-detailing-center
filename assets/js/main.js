/* =========================================================
   CONCORD DETAILING CENTER — main.js
   ========================================================= */
(function () {
  'use strict';

  /* ---------- настройки ---------- */
  var CONFIG = {
    // Замените на свой endpoint Formspree: https://formspree.io/f/xxxxxxxx
    formEndpoint: 'https://formspree.io/f/xbdkjvqp',
    telegram: 'https://t.me/koncord_detailing',
    phone: '+7 (812) 564-96-70',
    phoneHref: '+78125649670',
    whatsapp: 'https://wa.me/79035055004',
    email: 'customer.service.spb@avtodom.ru',
    mailSubject: 'Заявка с сайта Concord Detailing Center'
  };

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* ---------- helpers ---------- */
  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }
  function clamp(v, a, b) { return Math.min(Math.max(v, a), b); }
  function lerp(a, b, t) { return a + (b - a) * t; }

  /* =========================================================
     1. ТЯЖЁЛЫЙ ПЛАВНЫЙ СКРОЛЛ
     ========================================================= */
  var Scroll = (function () {
    var target = 0, current = 0, raf = null, running = false, locked = false, programmatic = false;
    var EASE = 0.075;            // ниже = тяжелее и медленнее
    var MAX_SPEED = 55;          // максимум «перелёта» за кадр, px

    function maxScroll() {
      return Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    }
    function onWheel(e) {
      if (locked) return;
      var delta = e.deltaY;
      if (e.deltaMode === 1) delta *= 16;
      if (e.deltaMode === 2) delta *= window.innerHeight;
      e.preventDefault();
      target = clamp(target + delta, 0, maxScroll());
      start();
    }
    function tick() {
      var diff = target - current;
      var step = diff * EASE;
      if (Math.abs(step) > MAX_SPEED) step = Math.sign(step) * MAX_SPEED;
      current += step;
      if (Math.abs(target - current) < 0.35) {
        current = target;
        programmatic = true;
        window.scrollTo(0, current);
        programmatic = false;
        running = false;
        raf = null;
        return;
      }
      programmatic = true;
      window.scrollTo(0, current);
      programmatic = false;
      raf = requestAnimationFrame(tick);
    }
    function start() {
      if (!running) { running = true; raf = requestAnimationFrame(tick); }
    }
    function sync() {
      // пользователь прокрутил нативно (скроллбар, space, стрелки, тач)
      if (programmatic) return;
      var y = window.scrollY;
      if (Math.abs(y - current) > 3) { current = y; target = y; running = false; }
    }
    function scrollToY(y, duration) {
      y = clamp(y, 0, maxScroll());
      if (!finePointer || reduced) { window.scrollTo({ top: y, behavior: reduced ? 'auto' : 'smooth' }); return; }
      target = y;
      if (duration) {
        // плавный твип к цели
        var from = current, t0 = performance.now();
        (function step(now) {
          var p = clamp((now - t0) / duration, 0, 1);
          var e = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
          target = from + (y - from) * e;
          start();
          if (p < 1) requestAnimationFrame(step);
        })(t0);
      } else {
        start();
      }
    }
    function scrollToEl(el, offset) {
      if (!el) return;
      var y = el.getBoundingClientRect().top + window.scrollY - (offset || 80);
      scrollToY(y);
    }
    function lock(v) {
      locked = v;
      if (v) { target = current = window.scrollY; }
    }
    function init() {
      target = current = window.scrollY;
      if (finePointer && !reduced) {
        window.addEventListener('wheel', onWheel, { passive: false });
      }
      window.addEventListener('scroll', sync, { passive: true });
      window.addEventListener('resize', function () { target = clamp(target, 0, maxScroll()); });
      // якоря
      document.addEventListener('click', function (e) {
        var a = e.target.closest('a[href^="#"]');
        if (!a) return;
        var id = a.getAttribute('href');
        if (!id || id === '#') return;
        var el = document.querySelector(id);
        if (!el) return;
        e.preventDefault();
        scrollToEl(el, 70);
      });
    }
    return { init: init, scrollToY: scrollToY, scrollToEl: scrollToEl, lock: lock, get current() { return current; } };
  })();

  /* =========================================================
     2. МОБИЛЬНОЕ МЕНЮ
     ========================================================= */
  function initMobileNav() {
    var burger = $('.burger');
    var nav = $('#mobileNav');
    if (!burger || !nav) return;
    function close() { burger.classList.remove('is-open'); nav.classList.remove('is-open'); document.body.classList.remove('is-locked'); }
    burger.addEventListener('click', function () {
      var open = !nav.classList.contains('is-open');
      burger.classList.toggle('is-open', open);
      nav.classList.toggle('is-open', open);
      document.body.classList.toggle('is-locked', open);
      if (open) {
        $$('a', nav).forEach(function (a, i) { a.style.transitionDelay = (0.06 + i * 0.05) + 's'; });
      }
    });
    $$('a', nav).forEach(function (a) { a.addEventListener('click', close); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
  }

  /* =========================================================
     3. ШАПКА
     ========================================================= */
  function initHeader() {
    var header = $('.header');
    if (!header) return;
    function upd() { header.classList.toggle('is-stuck', window.scrollY > 24); }
    window.addEventListener('scroll', upd, { passive: true });
    upd();
  }

  /* =========================================================
     4. REVEAL / АНИМАЦИИ ПОЯВЛЕНИЯ
     ========================================================= */
  function initReveal() {
    var items = $$('[data-reveal]');
    if (!items.length) return;
    if (reduced || !('IntersectionObserver' in window)) {
      items.forEach(function (el) { el.classList.add('is-in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target;
        var delay = parseFloat(el.getAttribute('data-delay') || 0);
        setTimeout(function () { el.classList.add('is-in'); }, delay * 1000);
        io.unobserve(el);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    items.forEach(function (el) { io.observe(el); });
  }

  /* =========================================================
     5. СЧЁТЧИКИ
     ========================================================= */
  function initCounters() {
    var nums = $$('[data-count]');
    if (!nums.length) return;
    if (!('IntersectionObserver' in window)) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target;
        io.unobserve(el);
        var to = parseFloat(el.getAttribute('data-count'));
        var dec = (el.getAttribute('data-dec') || '0') | 0;
        var dur = 1600, t0 = null;
        function step(now) {
          if (!t0) t0 = now;
          var p = clamp((now - t0) / dur, 0, 1);
          var e = 1 - Math.pow(1 - p, 3);
          var v = to * e;
          el.textContent = v.toFixed(dec).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + (el.getAttribute('data-suffix') || '');
          if (p < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
      });
    }, { threshold: 0.4 });
    nums.forEach(function (el) { io.observe(el); });
  }

  /* =========================================================
     6. ПАРАЛЛАКС
     ========================================================= */
  function initParallax() {
    var items = $$('[data-parallax]');
    if (!items.length || reduced) return;
    var ticking = false;
    function upd() {
      var vh = window.innerHeight;
      items.forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.bottom < -200 || r.top > vh + 200) return;
        var p = (r.top + r.height / 2 - vh / 2) / vh;
        var sp = parseFloat(el.getAttribute('data-parallax')) || 0.12;
        el.style.transform = 'translate3d(0,' + (-p * sp * 100).toFixed(2) + 'px,0) scale(' + (1 + sp * 0.25).toFixed(3) + ')';
      });
      ticking = false;
    }
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; requestAnimationFrame(upd); }
    }, { passive: true });
    upd();
  }

  /* =========================================================
     7. БИЛЬБОРД ДО / ПОСЛЕ
     ========================================================= */
  function initBeforeAfter() {
    $$('.ba').forEach(function (ba) {
      var input = $('.ba__input', ba);
      if (!input) return;
      function set() { ba.style.setProperty('--pos', input.value + '%'); }
      input.addEventListener('input', set);
      set();
    });
  }

  /* =========================================================
     8. ЛАЙТБОКС
     ========================================================= */
  function initLightbox() {
    var lb = $('#lightbox');
    if (!lb) return;
    var img = $('.lightbox img', lb);
    var cap = $('.lightbox__cap', lb);
    function open(src, title) { img.src = src; cap.textContent = title || ''; lb.classList.add('is-open'); document.body.classList.add('is-locked'); }
    function close() { lb.classList.remove('is-open'); document.body.classList.remove('is-locked'); }
    $$('[data-lightbox]').forEach(function (el) {
      el.addEventListener('click', function () { open(el.getAttribute('data-lightbox'), el.getAttribute('data-caption')); });
    });
    $('.lightbox__close', lb).addEventListener('click', close);
    lb.addEventListener('click', function (e) { if (e.target === lb) close(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
  }

  /* =========================================================
     9. FAQ / ТАБЫ / ПЕРЕКЛЮЧАТЕЛИ
     ========================================================= */
  function initAccordions() {
    $$('.faq__item').forEach(function (item) {
      var q = $('.faq__q', item);
      var a = $('.faq__a', item);
      if (!q || !a) return;
      q.addEventListener('click', function () {
        var open = item.classList.contains('is-open');
        $$('.faq__item.is-open').forEach(function (o) {
          o.classList.remove('is-open');
          var oa = $('.faq__a', o); if (oa) oa.style.maxHeight = null;
        });
        if (!open) { item.classList.add('is-open'); a.style.maxHeight = a.scrollHeight + 'px'; }
      });
    });
  }

  function initTabs() {
    $$('[data-tabs]').forEach(function (group) {
      var tabs = $$('.tab', group);
      var panels = $$('[data-panel]', group.parentNode);
      tabs.forEach(function (tab) {
        tab.addEventListener('click', function () {
          var target = tab.getAttribute('data-tab');
          tabs.forEach(function (t) { t.classList.toggle('is-active', t === tab); });
          panels.forEach(function (p) { p.style.display = p.getAttribute('data-panel') === target ? '' : 'none'; });
        });
      });
    });
  }

  /* =========================================================
     10. ТОСТ
     ========================================================= */
  function toast(msg, icon) {
    var t = $('#toast');
    if (!t) return;
    $('.toast__text', t).textContent = msg;
    t.classList.add('is-on');
    clearTimeout(t._timer);
    t._timer = setTimeout(function () { t.classList.remove('is-on'); }, 4200);
  }

  /* =========================================================
     11. МОДАЛЬНОЕ ОКНО ЗАЯВКИ
     ========================================================= */
  var lastFocus = null;
  function initModal() {
    var modal = $('#leadModal');
    if (!modal) return;
    var form = $('#leadForm', modal);

    function open(service) {
      lastFocus = document.activeElement;
      modal.classList.add('is-open');
      document.body.classList.add('is-locked');
      Scroll.lock(true);
      if (service) {
        var sel = $('#lead-service', form);
        if (sel) sel.value = service;
      }
      setTimeout(function () { var f = $('input', form); if (f) f.focus(); }, 260);
    }
    function close() {
      modal.classList.remove('is-open');
      document.body.classList.remove('is-locked');
      Scroll.lock(false);
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }
    $$('[data-lead]').forEach(function (el) {
      el.addEventListener('click', function (e) {
        e.preventDefault();
        open(el.getAttribute('data-lead'));
      });
    });
    $$('[data-modal-close]', modal).forEach(function (el) { el.addEventListener('click', close); });
    $('.modal__backdrop', modal).addEventListener('click', close);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && modal.classList.contains('is-open')) close();
    });

    /* ---------- отправка формы ---------- */
    if (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var ok = true;
        $$('.field', form).forEach(function (f) {
          var input = $('input,select,textarea', f);
          if (!input || !input.required) return;
          var v = (input.value || '').trim();
          var bad = !v;
          if (!bad && input.type === 'tel') bad = v.replace(/\D/g, '').length < 10;
          if (!bad && input.type === 'checkbox') bad = !input.checked;
          f.classList.toggle('has-error', bad);
          if (bad && ok) { ok = false; input.focus(); }
        });
        if (!ok) { toast('Проверьте обязательные поля', 'warn'); return; }

        var btn = $('button[type=submit]', form);
        var label = btn ? btn.innerHTML : '';
        if (btn) { btn.disabled = true; btn.innerHTML = 'Отправляем…'; }

        var data = {};
        new FormData(form).forEach(function (v, k) { data[k] = v; });
        data['source'] = 'site concord';
        data['_subject'] = CONFIG.mailSubject;

        var endpoint = CONFIG.formEndpoint;
        var isPlaceholder = !endpoint || endpoint.indexOf('/f/xxxx') !== -1;

        function done(msg) {
          form.style.display = 'none';
          $('.form__ok', modal).classList.add('is-on');
          toast(msg, 'ok');
        }

        if (isPlaceholder) {
          // резервный вариант: собираем письмо и открываем почтовый клиент
          var body = 'Имя: ' + data['name'] + '\nТелефон: ' + data['phone'] + '\nАвтомобиль: ' + (data['car'] || '—') +
            '\nУслуга: ' + (data['service'] || '—') + '\nДата: ' + (data['date'] || '—') + '\nКомментарий: ' + (data['comment'] || '—');
          window.location.href = 'mailto:' + CONFIG.email + '?subject=' + encodeURIComponent(CONFIG.mailSubject) + '&body=' + encodeURIComponent(body);
          done('Открываем вашу почту — отправьте письмо, и мы свяжемся с вами');
          return;
        }

        fetch(endpoint, {
          method: 'POST',
          headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        }).then(function (r) {
          if (!r.ok) throw new Error('bad status ' + r.status);
          return r.json();
        }).then(function () {
          done('Заявка принята! Мы свяжемся с вами в ближайшее время');
          form.reset();
        }).catch(function () {
          if (btn) { btn.disabled = false; btn.innerHTML = label; }
          toast('Не удалось отправить. Позвоните нам: ' + CONFIG.phone, 'warn');
        });
      });

      $$('.field input, .field select, .field textarea', form).forEach(function (input) {
        input.addEventListener('input', function () {
          var f = input.closest('.field');
          if (f) f.classList.remove('has-error');
        });
      });

      var okBtn = $('[data-close-ok]', modal);
      if (okBtn) {
        okBtn.addEventListener('click', function () {
          close();
          $('.form__ok', modal).classList.remove('is-on');
          form.style.display = '';
        });
      }
    }
  }

  /* =========================================================
     12. МАЛЫЕ УТИЛИТЫ
     ========================================================= */
  function initMisc() {
    // бегущая строка — дублируем для бесшовности
    $$('.marquee__track').forEach(function (track) {
      var clone = track.cloneNode(true);
      clone.setAttribute('aria-hidden', 'true');
      track.parentNode.appendChild(clone);
    });

    // год в подвале
    $$('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });

    // активная ссылка в меню
    var path = location.pathname.split('/').pop() || 'index.html';
    $$('.nav a, .mobile-nav a').forEach(function (a) {
      var href = (a.getAttribute('href') || '').split('/').pop();
      if (href === path) a.classList.add('is-active');
    });

    // плавное «появление» картинок
    $$('img').forEach(function (img) {
      img.addEventListener('error', function () { img.style.opacity = '.2'; });
    });
  }

  /* =========================================================
     BOOT
     ========================================================= */
  function boot() {
    Scroll.init();
    initMobileNav();
    initHeader();
    initReveal();
    initCounters();
    initParallax();
    initBeforeAfter();
    initLightbox();
    initAccordions();
    initTabs();
    initModal();
    initMisc();
    document.body.classList.add('is-ready');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
