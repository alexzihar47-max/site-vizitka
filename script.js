(function () {
  const root = document.documentElement;
  const reduceMotion = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Тексты из скрипта на выбранном языке (словарь — в i18n.js)
  const t = function (key, ru) { return window.onyxT ? window.onyxT(key, ru) : ru; };

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
  function splitManifesto() {
    if (!manifesto) return;
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
  splitManifesto();

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

  // ---------- ONYX с первого экрана уезжает в центр шапки ----------
  // При прокрутке большое слово уменьшается и встаёт ровно на место логотипа
  // в шапке, а там его подменяет сам логотип. Каска остаётся на месте.
  // Пока слово летит, оно закреплено относительно экрана (position: fixed):
  // его положение зависит только от прогресса, а не от того, как браузер
  // прокручивает страницу, — поэтому на телефоне оно не дрожит. Прогресс
  // догоняет прокрутку мягко, поэтому рывки колёсика сглаживаются.
  const header = document.getElementById('header');
  const logo = header && header.querySelector('.logo');
  const heroLetters = document.querySelector('.hero__letters');
  const heroWrap = document.querySelector('.hero__word-wrap');
  // сплошные буквы (за каской) и контур (перед ней) двигаем по отдельности:
  // общий transform на обёртке сломал бы порядок слоёв с каской
  const flyWords = heroWrap ? Array.from(heroWrap.querySelectorAll('.hero__word')) : [];
  const heroSolid = flyWords[0];
  const heroOutline = heroWrap && heroWrap.querySelector('.hero__word--outline');
  const FLY_PATH = 0.8;   // слово долетает до шапки за 0.8 высоты экрана прокрутки
  const FLY_SMOOTH = 140; // мс: насколько мягко слово догоняет прокрутку
  const FADE_FROM = 0.9;  // с этой доли пути слово сменяется логотипом
  let fly = null;         // положение слова на странице без сдвига
  let flying = false;     // слово вынуто из потока и летит
  let flyTarget = 0;      // прогресс по прокрутке
  let flyShown = 0;       // прогресс, который сейчас на экране
  let flyLoop = false;
  let flyLast = 0;

  function setFlying(on) {
    if (on === flying) return;
    flying = on;
    if (on) {
      // обёртка держит место, чтобы остальной первый экран не сдвинулся
      heroWrap.style.width = fly.wrap.width + 'px';
      heroWrap.style.height = fly.wrap.height + 'px';
      flyWords.forEach(function (el, i) {
        const r = fly.rects[i];
        el.style.position = 'fixed';
        el.style.inset = 'auto';
        el.style.left = r.left + 'px';
        el.style.top = r.top + 'px';
        el.style.width = r.width + 'px';
        el.style.height = r.height + 'px';
        el.style.margin = '0';
      });
    } else {
      heroWrap.style.width = '';
      heroWrap.style.height = '';
      flyWords.forEach(function (el) {
        ['position', 'inset', 'left', 'top', 'width', 'height', 'margin', 'transform'].forEach(function (prop) {
          el.style[prop] = '';
        });
      });
    }
  }

  function measureFly() {
    if (reduceMotion || !logo || !heroLetters || !flyWords.length) return;
    setFlying(false);
    const sx = window.scrollX;
    const sy = window.scrollY;
    const r = heroLetters.getBoundingClientRect();
    // всё — в координатах страницы (как при прокрутке в самый верх)
    const cx = r.left + r.width / 2 + sx;
    const cy = r.top + r.height / 2 + sy;
    const rects = flyWords.map(function (el) {
      const b = el.getBoundingClientRect();
      return { left: b.left + sx, top: b.top + sy, width: b.width, height: b.height };
    });
    // масштабируем вокруг центра букв, а не центра блока
    flyWords.forEach(function (el, i) {
      el.style.transformOrigin = (cx - rects[i].left).toFixed(1) + 'px ' + (cy - rects[i].top).toFixed(1) + 'px';
    });
    const w = heroWrap.getBoundingClientRect();
    fly = { cx: cx, cy: cy, w: r.width, rects: rects, wrap: { width: w.width, height: w.height } };
  }

  function renderFly() {
    const p = flyShown;
    if (p <= 0) {
      setFlying(false);
      heroWrap.style.visibility = '';
      if (heroOutline) {
        heroOutline.style.color = '';
        heroOutline.style.webkitTextStrokeColor = '';
      }
      if (heroSolid) heroSolid.style.opacity = '';
    } else if (p >= 1) {
      heroWrap.style.visibility = 'hidden';
    } else {
      setFlying(true);
      heroWrap.style.visibility = '';
      // центр слова идёт от своего места к логотипу, размер — к размеру логотипа
      const l = logo.getBoundingClientRect();
      const scale = Math.pow(l.width / fly.w, p);
      const dx = (l.left + l.width / 2 - fly.cx) * p;
      const dy = (l.top + l.height / 2 - fly.cy) * p;
      const tr = 'translate(' + dx.toFixed(2) + 'px,' + dy.toFixed(2) + 'px) scale(' + scale.toFixed(4) + ')';
      flyWords.forEach(function (el) { el.style.transform = tr; });

      // Слово отстаёт от страницы, и каска наезжает на сплошные буквы.
      // Поэтому контур (он лежит поверх каски) заливается цветом — слово
      // выходит вперёд. В конце пути слово гаснет, а логотип проявляется.
      // Прозрачность меняем цветом, а не opacity: opacity поменяла бы
      // порядок слоёв, и слово ушло бы за каску.
      const fade = p > FADE_FROM ? 1 - (p - FADE_FROM) / (1 - FADE_FROM) : 1;
      const fill = Math.min(1, p / 0.12) * fade;
      if (heroOutline) {
        heroOutline.style.color = 'rgba(243, 239, 235, ' + fill.toFixed(3) + ')';
        heroOutline.style.webkitTextStrokeColor = fade < 1 ? 'rgba(243, 239, 235, ' + (0.55 * fade).toFixed(3) + ')' : '';
      }
      if (heroSolid) heroSolid.style.opacity = fade < 1 ? fade.toFixed(3) : '';
    }
    logo.classList.toggle('is-hidden', p <= FADE_FROM);
    logo.style.opacity = p > FADE_FROM && p < 1 ? String((p - FADE_FROM) / (1 - FADE_FROM)) : '';
  }

  function flyStep(now) {
    const dt = Math.min(80, Math.max(0, now - flyLast));
    flyLast = now;
    flyShown += (flyTarget - flyShown) * (1 - Math.exp(-dt / FLY_SMOOTH));
    if (Math.abs(flyTarget - flyShown) < 0.0005) flyShown = flyTarget;
    renderFly();
    updateHeader();
    if (flyShown !== flyTarget) requestAnimationFrame(flyStep);
    else flyLoop = false;
  }

  // instant — без сглаживания: при загрузке, смене размера окна или языка
  function updateLogo(instant) {
    if (!fly) return;
    const l = logo.getBoundingClientRect();
    const path = Math.max(fly.cy - (l.top + l.height / 2), window.innerHeight * FLY_PATH);
    flyTarget = Math.min(1, Math.max(0, window.scrollY / path));
    if (instant) {
      flyShown = flyTarget;
      renderFly();
      return;
    }
    if (!flyLoop) {
      flyLoop = true;
      flyLast = performance.now();
      requestAnimationFrame(flyStep);
    }
  }

  function remeasureFly() {
    measureFly();
    updateLogo(true);
    updateHeader();
  }

  // ---------- Шапка при прокрутке ----------
  function updateHeader() {
    if (!header) return;
    // пока ONYX летит в шапку, у неё нет фона — иначе она закрыла бы слово
    header.classList.toggle('is-scrolled', fly ? flyShown >= 1 : window.scrollY > 30);
  }

  let ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      ticking = false;
      updateLogo();
      updateHeader();
      if (!reduceMotion) {
        updateManifesto();
        updateParallax();
      }
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', function () { remeasureFly(); onScroll(); });
  remeasureFly();
  onScroll();
  // размер слова зависит от шрифта: пересчитываем, когда он загрузится
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(remeasureFly);
  }
  window.addEventListener('load', remeasureFly);
  // сменился язык (i18n.js): тексты другой длины — всё пересчитываем
  document.addEventListener('onyx:lang', function () {
    splitManifesto();
    remeasureFly();
    onScroll();
  });

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
      '<button class="rail-nav__btn" type="button"></button>' +
      '<button class="rail-nav__btn" type="button"></button>';
    rail.after(nav);
    const countEl = nav.querySelector('b');
    const thumb = nav.querySelector('.rail-nav__thumb');
    const buttons = nav.querySelectorAll('button');
    // справа налево (арабский) лента листается в другую сторону
    const rtl = function () { return getComputedStyle(rail).direction === 'rtl'; };

    function labelButtons() {
      buttons[0].setAttribute('aria-label', t('js.rail.prev', 'Назад'));
      buttons[1].setAttribute('aria-label', t('js.rail.next', 'Вперёд'));
      buttons[0].textContent = rtl() ? '→' : '←';
      buttons[1].textContent = rtl() ? '←' : '→';
    }

    // шаг ленты — расстояние между соседними карточками
    const stepPx = function () {
      return total > 1 ? Math.abs(items[1].offsetLeft - items[0].offsetLeft) : rail.clientWidth;
    };

    function update() {
      const max = rail.scrollWidth - rail.clientWidth;
      const scrollable = max > 1;
      let current = -1;
      nav.hidden = !scrollable;
      if (scrollable) {
        // справа налево scrollLeft идёт от 0 в минус
        const x = Math.abs(rail.scrollLeft);
        current = x >= max - 2 ? total - 1 : Math.round(x / stepPx());
        const size = rail.clientWidth / rail.scrollWidth;
        const shift = (x / max) * (1 / size - 1) * 100 * (rtl() ? -1 : 1);
        thumb.style.width = (size * 100).toFixed(2) + '%';
        thumb.style.transform = 'translateX(' + shift.toFixed(2) + '%)';
        countEl.textContent = pad(current + 1);
        buttons[0].disabled = x <= 2;
        buttons[1].disabled = x >= max - 2;
      }
      items.forEach(function (el, i) { el.classList.toggle('is-current', i === current); });
    }

    buttons.forEach(function (btn, i) {
      btn.addEventListener('click', function () {
        const dir = (i ? 1 : -1) * (rtl() ? -1 : 1);
        rail.scrollBy({ left: dir * stepPx(), behavior: reduceMotion ? 'auto' : 'smooth' });
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
    document.addEventListener('onyx:lang', function () {
      labelButtons();
      rail.scrollLeft = 0; // с новым направлением — снова к первой карточке
      schedule();
    });
    labelButtons();
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
      menuBtn.setAttribute('aria-label', open ? t('js.menu.close', 'Закрыть меню') : t('js.menu.open', 'Открыть меню'));
    }
    if (menu) menu.setAttribute('aria-hidden', String(!open));
  }
  if (menuBtn && menu) {
    setMenu(false);
    document.addEventListener('onyx:lang', function () { setMenu(root.classList.contains('menu-open')); });
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
      showResult(t('js.form.required', 'Пожалуйста, заполните имя и телефон.'), 'error');
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
      showResult(t('js.form.success', 'Заявка отправлена, мы свяжемся с вами'), 'success');
      form.reset();
    } catch (error) {
      showResult(t('js.form.error', 'Не удалось отправить заявку. Попробуйте ещё раз.'), 'error');
    } finally {
      setLoading(false);
    }
  });

  function setLoading(isLoading) {
    submitBtn.disabled = isLoading;
    submitBtn.querySelector('.btn__text').textContent = isLoading
      ? t('js.form.sending', 'Отправка...')
      : t('form.submit', 'Отправить заявку');
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
