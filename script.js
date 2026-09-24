(function () {
  const root = document.documentElement;
  const reduceMotion = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Анимации включаем только если человек не просил «уменьшить движение».
  // Без JavaScript класса .motion нет — и всё видно сразу.
  if (!reduceMotion) root.classList.add('motion');

  // ---------- Места под фото ----------
  // Есть файл в img/ — показываем его и прячем заглушку; нет — убираем картинку.
  document.querySelectorAll('.photo__img').forEach(function (img) {
    const slot = img.closest('.photo');
    const ok = function () { if (slot) slot.classList.add('has-img'); };
    const fail = function () { img.remove(); };
    if (img.complete) {
      if (img.naturalWidth > 0) ok(); else fail();
    } else {
      img.addEventListener('load', ok);
      img.addEventListener('error', fail);
    }
  });

  // ---------- Появление первого экрана ----------
  // Ждём, пока погаснет экран загрузки, чтобы анимация была видна.
  let introDone = false;
  function intro() {
    if (introDone) return;
    introDone = true;
    root.classList.add('intro-done');
  }
  if (root.classList.contains('is-loading')) {
    document.addEventListener('preloader:hide', intro);
    setTimeout(intro, 13000);
  } else {
    requestAnimationFrame(function () { requestAnimationFrame(intro); });
  }

  // ---------- Манифест: слова проявляются по мере прокрутки ----------
  const manifesto = document.querySelector('[data-words]');
  let words = [];
  if (manifesto) {
    const split = function (node) {
      Array.from(node.childNodes).forEach(function (child) {
        if (child.nodeType === 3) {
          const frag = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) {
              frag.appendChild(document.createTextNode(part));
            } else {
              const span = document.createElement('span');
              span.className = 'w';
              span.textContent = part;
              frag.appendChild(span);
            }
          });
          child.replaceWith(frag);
        } else if (child.nodeType === 1) {
          split(child);
        }
      });
    };
    split(manifesto);
    words = Array.from(manifesto.querySelectorAll('.w'));
  }

  function updateManifesto() {
    if (!words.length) return;
    const rect = manifesto.getBoundingClientRect();
    const vh = window.innerHeight;
    const progress = Math.min(1, Math.max(0, (vh * 0.85 - rect.top) / (rect.height + vh * 0.3)));
    const lit = Math.round(progress * words.length);
    words.forEach(function (w, i) { w.classList.toggle('is-lit', i < lit); });
  }

  // ---------- Параллакс фото на первом экране ----------
  const parallax = Array.from(document.querySelectorAll('[data-parallax]'));
  function updateParallax() {
    const vh = window.innerHeight;
    parallax.forEach(function (img) {
      if (!img.isConnected) return;
      const rect = img.parentElement.getBoundingClientRect();
      const shift = (rect.top + rect.height / 2 - vh / 2) * -0.08;
      img.style.transform = 'translateY(' + shift.toFixed(1) + 'px) scale(1.12)';
    });
  }

  // ---------- Шапка при прокрутке ----------
  const header = document.getElementById('header');
  function updateHeader() {
    if (header) header.classList.toggle('is-scrolled', window.scrollY > 30);
  }

  let ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      ticking = false;
      updateHeader();
      if (!reduceMotion) {
        updateManifesto();
        updateParallax();
      }
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();

  // ---------- Счётчики ----------
  function countUp(el) {
    const target = el.querySelector('.ph') || el;
    const text = target.textContent;
    const m = text.match(/^(\D*)([\d\s ]+)(.*)$/);
    if (!m) return;
    const end = parseInt(m[2].replace(/\D/g, ''), 10);
    const grouped = /[\s ]/.test(m[2].trim());
    const fmt = function (n) {
      const s = String(n);
      return grouped ? s.replace(/\B(?=(\d{3})+(?!\d))/g, ' ') : s;
    };
    const start = performance.now();
    const dur = 1600;
    const step = function (now) {
      const t = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - t, 3);
      target.textContent = m[1] + fmt(Math.round(end * eased)) + m[3];
      if (t < 1) requestAnimationFrame(step);
      else target.textContent = text;
    };
    requestAnimationFrame(step);
  }

  // ---------- Появление блоков при прокрутке ----------
  const revealables = Array.from(document.querySelectorAll('[data-reveal]'));
  // соседние элементы появляются лесенкой
  revealables.forEach(function (el) {
    const siblings = Array.from(el.parentElement.children).filter(function (s) {
      return s.hasAttribute('data-reveal');
    });
    const i = siblings.indexOf(el);
    if (i > 0) el.style.transitionDelay = Math.min(i, 5) * 90 + 'ms';
  });

  function reveal(el) {
    el.classList.add('is-in');
    const counter = el.querySelector('[data-count]');
    if (counter && !reduceMotion) countUp(counter);
  }

  if ('IntersectionObserver' in window && !reduceMotion) {
    const io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        // в ленте показываем сразу все карточки: те, что за краем экрана,
        // иначе остались бы пустыми, пока их не пролистают
        const parent = entry.target.parentElement;
        const group = parent.hasAttribute('data-rail') ? Array.from(parent.children) : [entry.target];
        group.forEach(function (el) {
          reveal(el);
          io.unobserve(el);
        });
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    revealables.forEach(function (el) { io.observe(el); });
  } else {
    revealables.forEach(function (el) { el.classList.add('is-in'); });
  }

  // ---------- Ленты карточек ----------
  // До 1080px услуги, проекты, направления и этапы листаются вбок (.rail в
  // style.css). Под лентой — счётчик, полоска прогресса и стрелки; когда
  // карточки помещаются в ряд, всё это скрыто.
  document.querySelectorAll('[data-rail]').forEach(function (rail) {
    const items = Array.from(rail.children);
    const total = items.length;
    const pad = function (n) { return (n < 10 ? '0' : '') + n; };

    const nav = document.createElement('div');
    nav.className = 'rail-nav';
    nav.innerHTML =
      '<span class="rail-nav__count"><b>01</b> / ' + pad(total) + '</span>' +
      '<span class="rail-nav__track"><span class="rail-nav__thumb"></span></span>' +
      '<button class="rail-nav__btn" type="button" aria-label="Назад">←</button>' +
      '<button class="rail-nav__btn" type="button" aria-label="Вперёд">→</button>';
    rail.after(nav);
    const countEl = nav.querySelector('b');
    const thumb = nav.querySelector('.rail-nav__thumb');
    const buttons = nav.querySelectorAll('button');

    // шаг ленты — расстояние между соседними карточками
    const stepPx = function () {
      return total > 1 ? items[1].offsetLeft - items[0].offsetLeft : rail.clientWidth;
    };

    function update() {
      const max = rail.scrollWidth - rail.clientWidth;
      const scrollable = max > 1;
      let current = -1;
      nav.hidden = !scrollable;
      if (scrollable) {
        const x = rail.scrollLeft;
        current = x >= max - 2 ? total - 1 : Math.round(x / stepPx());
        const size = rail.clientWidth / rail.scrollWidth;
        thumb.style.width = (size * 100).toFixed(2) + '%';
        thumb.style.transform = 'translateX(' + ((x / max) * (1 / size - 1) * 100).toFixed(2) + '%)';
        countEl.textContent = pad(current + 1);
        buttons[0].disabled = x <= 2;
        buttons[1].disabled = x >= max - 2;
      }
      items.forEach(function (el, i) { el.classList.toggle('is-current', i === current); });
    }

    buttons.forEach(function (btn, i) {
      btn.addEventListener('click', function () {
        rail.scrollBy({ left: (i ? 1 : -1) * stepPx(), behavior: reduceMotion ? 'auto' : 'smooth' });
      });
    });

    let queued = false;
    const schedule = function () {
      if (queued) return;
      queued = true;
      requestAnimationFrame(function () { queued = false; update(); });
    };
    rail.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    update();
  });

  // ---------- 3D-каска на главном экране ----------
  // Та же модель, что на экране загрузки (helmet.js). three.js уже загружен
  // экраном загрузки, поэтому повторный import берётся из кэша.
  const heroCanvas = document.getElementById('heroHelmet');
  const threeHolder = document.querySelector('[data-three]');
  if (heroCanvas && window.OnyxHelmet && threeHolder) {
    const src = new URL(threeHolder.dataset.three, document.baseURI).href;
    import(src).then(function (THREE) {
      const helmet = window.OnyxHelmet.build(THREE, heroCanvas, { maxDpr: 1.5 });
      const BASE_YAW = -0.55;   // три четверти: видно и логотип, и козырёк
      let targetX = 0, targetY = 0, curX = 0, curY = 0;
      let visible = true;
      let running = false;

      window.addEventListener('pointermove', function (e) {
        targetX = e.clientX / window.innerWidth - 0.5;
        targetY = e.clientY / window.innerHeight - 0.5;
      }, { passive: true });

      const hero = heroCanvas.closest('.hero');
      if ('IntersectionObserver' in window && hero) {
        new IntersectionObserver(function (entries) {
          visible = entries[0].isIntersecting;
          if (visible) start();
        }).observe(hero);
      }

      window.addEventListener('resize', function () { helmet.resize(); });

      function frame(now) {
        if (!visible) { running = false; return; }
        curX += (targetX - curX) * 0.06;
        curY += (targetY - curY) * 0.06;
        const idle = reduceMotion ? 0 : Math.sin(now / 2600) * 0.12;
        const scrolled = Math.min(1, window.scrollY / window.innerHeight);
        helmet.render(BASE_YAW + curX * 0.9 + idle + scrolled * 0.9, 0.05 + curY * 0.22);
        requestAnimationFrame(frame);
      }

      function start() {
        if (running) return;
        running = true;
        requestAnimationFrame(frame);
      }

      helmet.render(BASE_YAW, 0.05);
      heroCanvas.classList.add('is-ready');
      if (!reduceMotion) start();
    }).catch(function () { /* остаётся картинка-заглушка */ });
  }

  // ---------- Мобильное меню ----------
  const menuBtn = document.querySelector('.menu-btn');
  const menu = document.getElementById('mobileMenu');
  function setMenu(open) {
    root.classList.toggle('menu-open', open);
    if (menuBtn) {
      menuBtn.setAttribute('aria-expanded', String(open));
      menuBtn.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
    }
    if (menu) menu.setAttribute('aria-hidden', String(!open));
  }
  if (menuBtn && menu) {
    menuBtn.addEventListener('click', function () {
      setMenu(!root.classList.contains('menu-open'));
    });
    menu.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () { setMenu(false); });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') setMenu(false);
    });
  }

  // ---------- Год в подвале ----------
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // ---------- Форма заявки ----------
  const form = document.getElementById('requestForm');
  const submitBtn = document.getElementById('submitBtn');
  const resultEl = document.getElementById('formResult');

  const ENDPOINT_URL = 'https://script.google.com/macros/s/AKfycbx95IK1qzW2LIgArSapuitUUtnW2rdqaqtQQdEniaLhxntVgdwAGLoy6t6kMV_8BU2w/exec';

  if (!form) return;

  form.addEventListener('submit', async function (event) {
    event.preventDefault();

    const name = form.name.value.trim();
    const phone = form.phone.value.trim();
    const message = form.message.value.trim();

    if (!name || !phone) {
      showResult('Пожалуйста, заполните имя и телефон.', 'error');
      return;
    }

    setLoading(true);
    clearResult();

    try {
      await fetch(ENDPOINT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, phone, message }),
      });

      // В режиме no-cors ответ сервера непрозрачен для JS,
      // поэтому считаем отправку успешной, если запрос не выбросил ошибку.
      showResult('Заявка отправлена, мы свяжемся с вами', 'success');
      form.reset();
    } catch (error) {
      showResult('Не удалось отправить заявку. Попробуйте ещё раз.', 'error');
    } finally {
      setLoading(false);
    }
  });

  function setLoading(isLoading) {
    submitBtn.disabled = isLoading;
    submitBtn.querySelector('.btn__text').textContent = isLoading
      ? 'Отправка...'
      : 'Отправить заявку';
  }

  function showResult(text, type) {
    resultEl.textContent = text;
    resultEl.classList.remove('is-success', 'is-error');
    resultEl.classList.add(type === 'success' ? 'is-success' : 'is-error');
  }

  function clearResult() {
    resultEl.textContent = '';
    resultEl.classList.remove('is-success', 'is-error');
  }
})();
