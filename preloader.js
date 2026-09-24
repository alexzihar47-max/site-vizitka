// Экран загрузки: реалистичная 3D-каска (three.js) + прогресс загрузки.
//
// Корпус — одна непрерывная поверхность, как в 3D-редакторе: купол плавно
// переходит в козырёк, край завальцован, у пластика есть толщина и
// внутренняя сторона. Рельеф и бобышки слотов под наушники — часть формы.
// Материал — глянцевый ABS с лаковым слоем, свет — студийные софтбоксы
// в отражениях и красный контровой свет.
//
// Вращение неравномерное: лицом к зрителю каска почти замирает,
// остальную часть оборота проходит быстро.
(function () {
  const root = document.documentElement;
  if (!root.classList.contains('is-loading')) return;

  const MIN_MS = 3000;  // минимум, если 3D недоступно
  const MAX_MS = 12000; // и снимается не позже, даже если что-то зависло
  const TURNS = 2;      // сколько полных оборотов каска делает до конца загрузки
  const FADE_MS = 500;
  const TURN_MS = 2300; // один оборот каски
  const EASE = 0.8;     // 0 — равномерно, ближе к 1 — дольше смотрит на зрителя

  const canvas = document.getElementById('helmetCanvas');
  const bar = document.getElementById('preloaderBar');
  const pctEl = document.getElementById('preloaderPct');
  const reduceMotion = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const TAU = Math.PI * 2;
  const HALF = Math.PI / 2;

  let render = null;               // появится, когда сцена готова
  let sceneSettled = !canvas || !canvas.dataset.three;

  if (!sceneSettled) {
    // путь без «./» браузер счёл бы именем пакета, поэтому делаем полный адрес
    const src = new URL(canvas.dataset.three, document.baseURI).href;
    import(src).then(function (THREE) {
      render = window.OnyxHelmet.build(THREE, canvas).render;
      canvas.classList.add('is-ready');
    }).catch(function () {
      canvas.style.display = 'none'; // без 3D показываем только прогресс
    }).then(function () {
      sceneSettled = true;
    });
  } else if (canvas) {
    canvas.style.display = 'none';
  }

  // ======================================================================
  // Вращение и прогресс
  // ======================================================================

  // Внутри оборота скорость 1 − EASE·cos(2πf): у «лица» (f = 0) почти стоит,
  // на обратной стороне разгоняется. Отсчёт идёт с момента появления каски:
  // она появляется лицом к зрителю и после TURNS оборотов снова смотрит на него.
  let spinStart = null;

  function yawAt(now) {
    const x = (now - spinStart) / TURN_MS;
    const turn = Math.floor(x);
    const f = x - turn;
    return TAU * (turn + f - EASE * Math.sin(TAU * f) / TAU);
  }

  let windowLoaded = document.readyState === 'complete';
  let shown = 0;
  let finished = false;
  let hideStarted = false;
  let drewStatic = false;
  let lastNow = 0;

  window.addEventListener('load', function () { windowLoaded = true; });

  function setProgress(value) {
    if (bar) bar.style.transform = 'scaleX(' + value.toFixed(4) + ')';
    if (pctEl) pctEl.textContent = Math.round(value * 100) + '%';
  }

  function hide() {
    if (hideStarted) return;
    hideStarted = true;
    setProgress(1);
    setTimeout(function () {
      root.classList.add('preloader-hide');
      // сигнал сайту: экран загрузки гаснет, можно запускать анимацию первого экрана
      document.dispatchEvent(new CustomEvent('preloader:hide'));
      setTimeout(function () {
        finished = true;
        root.classList.remove('is-loading', 'preloader-hide');
      }, FADE_MS);
    }, 300);
  }

  function frame(now) {
    if (finished) return;

    if (render && spinStart === null) spinStart = now;

    // Конец загрузки: когда каска закончит TURNS оборотов. Пока 3D ещё
    // грузится, считаем, что обороты начнутся прямо сейчас. Без 3D или при
    // «уменьшении движения» хватает MIN_MS.
    let end = MIN_MS;
    if (!reduceMotion) {
      if (spinStart !== null) end = spinStart + TURNS * TURN_MS;
      else if (!sceneSettled) end = now + TURNS * TURN_MS;
    }
    end = Math.max(end, MIN_MS);

    // Прогресс идёт по времени, но не дальше 90%, пока страница и каска
    // реально не загрузились.
    const ready = windowLoaded && sceneSettled;
    const byTime = Math.min(1, now / end);
    const target = Math.min(byTime, ready ? 1 : 0.9);
    // сглаживание по реальному времени, а не по кадрам: на слабом
    // устройстве с низким FPS прогресс идёт с той же скоростью
    const dt = Math.min(100, Math.max(0, now - lastNow));
    lastNow = now;
    shown += (target - shown) * (1 - Math.exp(-dt / 130));
    if (target === 1 && shown > 0.97) shown = 1; // не тянем хвост: каска уже смотрит на зрителя
    if (!hideStarted) setProgress(shown);
    if (shown === 1) hide();

    if (render) {
      if (!reduceMotion) {
        render(yawAt(now), 0.025 * Math.sin(now / 900));
      } else if (!drewStatic) {
        render(0.45, 0);
        drewStatic = true;
      }
    }

    requestAnimationFrame(frame);
  }

  // страховка на случай, если вкладка в фоне и кадры не рисуются
  setTimeout(function () { windowLoaded = true; sceneSettled = true; hide(); }, MAX_MS);

  requestAnimationFrame(frame);
})();
