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
      render = buildHelmet(THREE, canvas);
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
  // Модель
  // ======================================================================
  function smoothstep(a, b, x) {
    const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
    return t * t * (3 - 2 * t);
  }
  function smoothBox(x, half, soft) {
    return smoothstep(-half - soft, -half, x) * (1 - smoothstep(half, half + soft, x));
  }
  function angleDiff(a, b) {
    let d = (a - b) % TAU;
    if (d > Math.PI) d -= TAU;
    if (d < -Math.PI) d += TAU;
    return d;
  }
  function bezier(p0, p1, p2, p3, t) {
    const m = 1 - t;
    const a = m * m * m, b = 3 * m * m * t, c = 3 * m * t * t, d = t * t * t;
    return [a * p0[0] + b * p1[0] + c * p2[0] + d * p3[0], a * p0[1] + b * p1[1] + c * p2[1] + d * p3[1]];
  }

  // Оси: y — вверх, +z — перёд (козырёк), x — вбок.
  const ELONG = 1.18;   // вытянута вперёд-назад
  const H = 1.27;       // высота купола над краем (≈ 0.62 ширины)
  const FIL = 0.07;     // высота скругления между куполом и козырьком
  const R0 = 1.04;      // радиус купола у края
  const THICK = 0.035;  // толщина пластика
  const EDGE_R = 0.02;  // радиус завальцовки края

  // край поднимается от козырька к бокам и чуть опускается сзади
  function rimY(u) {
    const s = Math.sin(u);
    return 0.06 * (1 - Math.max(0, s)) - 0.02 * Math.pow(Math.max(0, -s), 2);
  }
  function lipLength(u) {
    return 0.075 + 0.2 * Math.pow(Math.max(0, Math.sin(u)), 3);
  }
  function lipDrop(u) {
    const f = Math.max(0, Math.sin(u));
    return 0.02 + 0.07 * f * f;
  }

  const SLOTS = [0.5, -0.5, Math.PI + 0.5, Math.PI - 0.5];

  // рельеф купола: центральная полоса, боковые рёбра, бобышки слотов
  function relief(u, t, x) {
    const ax = Math.abs(x);
    let r = (0.024 * (1 - smoothstep(0.11, 0.2, ax)) +
      0.014 * Math.exp(-Math.pow((ax - 0.44) / 0.07, 2))) * (1 - Math.pow(t, 4));
    for (let i = 0; i < SLOTS.length; i++) {
      r += 0.03 * smoothBox(angleDiff(u, SLOTS[i]), 0.075, 0.03) * smoothBox(t - 0.855, 0.05, 0.025);
    }
    return r;
  }

  function domeOuter(u, th) {
    const t = th / HALF;
    // подъём края затухает к макушке, иначе сечения сходились бы в ней на разной высоте
    const cy = FIL + rimY(u) * Math.pow(t, 3);
    const r = Math.pow(Math.sin(th), 0.76) * (1 + 0.04 * Math.pow(t, 8));
    const y = cy + (H - FIL) * Math.cos(th);
    const k = 1 + relief(u, t, r * Math.cos(u));
    return [r * k * Math.cos(u), cy + (y - cy) * k, r * k * Math.sin(u) * ELONG];
  }

  const ND = 48;  // купол
  const NB = 22;  // козырёк сверху и снизу
  const NE = 10;  // завальцовка

  // Профиль одного сечения: снаружи купол → скругление → козырёк →
  // завальцовка → низ козырька → внутренняя сторона купола.
  function section(u) {
    const pts = [];
    const cu = Math.cos(u), su = Math.sin(u);
    const to3 = function (p) { return [p[0] * cu, p[1], p[0] * su * ELONG]; };
    const yb = rimY(u);
    const L = lipLength(u), D = lipDrop(u);

    for (let j = 0; j <= ND; j++) pts.push(domeOuter(u, HALF * j / ND));

    const P0 = [R0, yb + FIL], P1 = [R0, yb + 0.012];
    const P2 = [R0 + 0.45 * L, yb - 0.25 * D], P3 = [R0 + L, yb - D];
    for (let k = 1; k <= NB; k++) pts.push(to3(bezier(P0, P1, P2, P3, k / NB)));

    const tl = Math.hypot(P3[0] - P2[0], P3[1] - P2[1]);
    const T = [(P3[0] - P2[0]) / tl, (P3[1] - P2[1]) / tl];
    const up = [-T[1], T[0]];
    const C = [P3[0] - up[0] * EDGE_R, P3[1] - up[1] * EDGE_R];
    for (let k = 1; k <= NE; k++) {
      const phi = HALF - Math.PI * k / NE;
      pts.push(to3([
        C[0] + up[0] * EDGE_R * Math.sin(phi) + T[0] * EDGE_R * Math.cos(phi),
        C[1] + up[1] * EDGE_R * Math.sin(phi) + T[1] * EDGE_R * Math.cos(phi)
      ]));
    }

    const Q3 = [P3[0] - up[0] * 2 * EDGE_R, P3[1] - up[1] * 2 * EDGE_R];
    const Q2 = [P2[0], P2[1] - 2 * EDGE_R];
    const Q1 = [R0 - THICK, yb - 0.01];
    const Q0 = [R0 - THICK, yb + FIL];
    for (let k = 1; k <= NB; k++) pts.push(to3(bezier(Q3, Q2, Q1, Q0, k / NB)));

    const inner = (R0 - THICK) / R0;
    for (let j = ND - 1; j >= 0; j--) {
      const th = HALF * j / ND;
      const t = th / HALF;
      const r = inner * Math.pow(Math.sin(th), 0.76) * (1 + 0.04 * Math.pow(t, 8));
      pts.push(to3([r, FIL + yb * Math.pow(t, 3) + (H - THICK - FIL) * Math.cos(th)]));
    }
    return pts;
  }

  function shellGeometry(THREE) {
    const NU = 220;
    const rows = [];
    for (let i = 0; i < NU; i++) rows.push(section(TAU * i / NU));
    const NP = rows[0].length;

    const pos = new Float32Array((NU + 1) * NP * 3);
    const nor = new Float32Array((NU + 1) * NP * 3);
    const sub = function (a, b) { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; };

    for (let i = 0; i <= NU; i++) {
      const ic = i % NU;
      const prev = rows[(ic - 1 + NU) % NU], next = rows[(ic + 1) % NU], cur = rows[ic];
      for (let j = 0; j < NP; j++) {
        const p = cur[j];
        let n;
        if (j === 0) n = [0, 1, 0];
        else if (j === NP - 1) n = [0, -1, 0];
        else {
          const du = sub(next[j], prev[j]);
          const ds = sub(cur[j + 1], cur[j - 1]);
          n = [du[1] * ds[2] - du[2] * ds[1], du[2] * ds[0] - du[0] * ds[2], du[0] * ds[1] - du[1] * ds[0]];
          const l = Math.hypot(n[0], n[1], n[2]) || 1;
          n = [n[0] / l, n[1] / l, n[2] / l];
        }
        const o = (i * NP + j) * 3;
        pos[o] = p[0]; pos[o + 1] = p[1]; pos[o + 2] = p[2];
        nor[o] = n[0]; nor[o + 1] = n[1]; nor[o + 2] = n[2];
      }
    }

    const idx = new Uint32Array(NU * (NP - 1) * 6);
    let q = 0;
    for (let i = 0; i < NU; i++) {
      for (let j = 0; j < NP - 1; j++) {
        const a = i * NP + j, b = (i + 1) * NP + j, c = a + 1, d = b + 1;
        idx[q++] = a; idx[q++] = b; idx[q++] = c;
        idx[q++] = b; idx[q++] = d; idx[q++] = c;
      }
    }

    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
    g.setIndex(new THREE.BufferAttribute(idx, 1));
    return g;
  }

  // Наклейка, повторяющая поверхность купола: логотип и вентиляция.
  function surfacePatch(THREE, uc, du, thc, dth, flipU) {
    const nx = 24, ny = 8;
    const pos = [], uv = [], idx = [];
    const e = 1e-3;
    for (let iy = 0; iy <= ny; iy++) {
      for (let ix = 0; ix <= nx; ix++) {
        const s = ix / nx;
        const u = uc + du * (flipU ? 1 - 2 * s : 2 * s - 1);
        const th = thc - dth + 2 * dth * iy / ny;
        const p = domeOuter(u, th);
        const a = domeOuter(u + e, th), b = domeOuter(u - e, th);
        const c = domeOuter(u, th + e), d = domeOuter(u, th - e);
        const tu = [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
        const tt = [c[0] - d[0], c[1] - d[1], c[2] - d[2]];
        let n = [tu[1] * tt[2] - tu[2] * tt[1], tu[2] * tt[0] - tu[0] * tt[2], tu[0] * tt[1] - tu[1] * tt[0]];
        const l = Math.hypot(n[0], n[1], n[2]) || 1;
        n = [n[0] / l, n[1] / l, n[2] / l];
        if (n[0] * p[0] + n[2] * p[2] < 0) n = [-n[0], -n[1], -n[2]];
        pos.push(p[0] + n[0] * 0.003, p[1] + n[1] * 0.003, p[2] + n[2] * 0.003);
        uv.push(s, 1 - iy / ny);
      }
    }
    for (let iy = 0; iy < ny; iy++) {
      for (let ix = 0; ix < nx; ix++) {
        const a = iy * (nx + 1) + ix, b = a + 1, c = a + nx + 1, d = c + 1;
        idx.push(a, c, b, b, c, d);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    g.setIndex(idx);
    g.computeVertexNormals();
    return g;
  }

  function canvasTexture(THREE, w, h, paint) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    paint(c.getContext('2d'), w, h);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    return tex;
  }

  // Студия для отражений: тёмная комната с софтбоксами и красной полосой.
  function studioEnvironment(THREE, renderer) {
    const env = new THREE.Scene();
    env.add(new THREE.Mesh(
      new THREE.BoxGeometry(24, 14, 24),
      new THREE.MeshBasicMaterial({ color: 0x0d0c0e, side: THREE.BackSide })
    ));
    const panel = function (w, h, color, power, x, y, z) {
      const m = new THREE.Mesh(
        new THREE.PlaneGeometry(w, h),
        new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(power), side: THREE.DoubleSide })
      );
      m.position.set(x, y, z);
      m.lookAt(0, 0.4, 0);
      env.add(m);
    };
    panel(9, 3.5, 0xffffff, 3.2, 0, 6.5, 1.5);      // верхний софтбокс
    panel(3.5, 7, 0xffffff, 2.6, -8, 2, 5);         // ключевой слева-спереди
    panel(2.2, 7, 0xfff4ec, 1.2, 8, 1.5, 4);        // заполняющий справа
    panel(1.4, 8, 0xff3b2e, 3.0, 6, 1.5, -8);       // красная полоса сзади-справа
    panel(12, 3, 0xffffff, 0.35, 0, -6.5, 0);       // слабый отражённый снизу
    const pmrem = new THREE.PMREMGenerator(renderer);
    const tex = pmrem.fromScene(env, 0.03).texture;
    pmrem.dispose();
    return tex;
  }

  function buildHelmet(THREE, canvas) {
    const size = canvas.clientWidth || 170;
    const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(size, size, false);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    const scene = new THREE.Scene();
    scene.environment = studioEnvironment(THREE, renderer);

    const camera = new THREE.PerspectiveCamera(27, 1, 0.1, 50);
    camera.position.set(0, 1.5, 6.9);
    camera.lookAt(0, 0.5, 0);

    const rimLight = new THREE.DirectionalLight(0xff3b2e, 2.4);
    rimLight.position.set(3.5, 1.5, -3);
    scene.add(rimLight);
    const keyLight = new THREE.DirectionalLight(0xffffff, 0.7);
    keyLight.position.set(-2.5, 3.5, 3);
    scene.add(keyLight);

    const helmet = new THREE.Group();
    scene.add(helmet);

    // корпус: глянцевый белый ABS
    const plastic = new THREE.MeshPhysicalMaterial({
      color: 0xf2f0ec, roughness: 0.34, metalness: 0,
      clearcoat: 1, clearcoatRoughness: 0.07
    });
    helmet.add(new THREE.Mesh(shellGeometry(THREE), plastic));

    const decal = function (map) {
      return new THREE.MeshPhysicalMaterial({
        map: map, transparent: true, depthWrite: false, roughness: 0.4, side: THREE.DoubleSide,
        clearcoat: 1, clearcoatRoughness: 0.08,
        polygonOffset: true, polygonOffsetFactor: -4
      });
    };

    // логотип ONYX на лбу
    const logo = canvasTexture(THREE, 512, 160, function (ctx, w, h) {
      ctx.fillStyle = '#e2372c';
      ctx.font = '700 132px Oswald, "Arial Narrow", Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('ONYX', w / 2, h / 2 + 6);
    });
    helmet.add(new THREE.Mesh(surfacePatch(THREE, HALF, 0.13, 0.95, 0.039, true), decal(logo)));

    // вентиляционные прорези по бокам
    const vents = canvasTexture(THREE, 512, 64, function (ctx, w, h) {
      ctx.fillStyle = '#141214';
      for (let i = 0; i < 5; i++) {
        const x = 20 + i * 98, y = 12, rw = 70, rh = h - 24, r = rh / 2;
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + rw, y, x + rw, y + rh, r);
        ctx.arcTo(x + rw, y + rh, x, y + rh, r);
        ctx.arcTo(x, y + rh, x, y, r);
        ctx.arcTo(x, y, x + rw, y, r);
        ctx.fill();
      }
    });
    helmet.add(new THREE.Mesh(surfacePatch(THREE, 0.12, 0.2, 0.66, 0.017, false), decal(vents)));
    helmet.add(new THREE.Mesh(surfacePatch(THREE, Math.PI - 0.12, 0.2, 0.66, 0.017, false), decal(vents)));

    // оголовье: чёрная лента, сзади свисает ниже, и рифлёный регулятор
    const rubber = new THREE.MeshStandardMaterial({ color: 0x151414, roughness: 0.55, side: THREE.DoubleSide });
    const bandPos = [], bandIdx = [];
    const BU = 96;
    for (let i = 0; i <= BU; i++) {
      const u = TAU * i / BU;
      const back = Math.max(0, -Math.sin(u));
      const yTop = rimY(u) + 0.06;
      const yBot = rimY(u) * 0.3 - (0.06 + 0.2 * back);
      const x = 0.93 * Math.cos(u), z = 0.93 * Math.sin(u) * ELONG * 0.96;
      bandPos.push(x, yTop, z, x, yBot, z);
      if (i < BU) {
        const a = i * 2;
        bandIdx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
      }
    }
    const band = new THREE.BufferGeometry();
    band.setAttribute('position', new THREE.Float32BufferAttribute(bandPos, 3));
    band.setIndex(bandIdx);
    band.computeVertexNormals();
    helmet.add(new THREE.Mesh(band, rubber));

    const knobGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.08, 96, 1);
    const kp = knobGeo.attributes.position;
    for (let i = 0; i < kp.count; i++) {
      const x = kp.getX(i), z = kp.getZ(i);
      if (Math.hypot(x, z) > 0.1) {
        const k = 1 + 0.07 * Math.pow(Math.max(0, Math.cos(20 * Math.atan2(z, x))), 0.6);
        kp.setX(i, x * k);
        kp.setZ(i, z * k);
      }
    }
    knobGeo.computeVertexNormals();
    knobGeo.rotateX(HALF);
    const knob = new THREE.Mesh(knobGeo, new THREE.MeshStandardMaterial({ color: 0x151414, roughness: 0.5 }));
    knob.position.set(0, -0.17, -(0.93 * ELONG * 0.96 + 0.05));
    helmet.add(knob);

    return function (yaw, tilt) {
      helmet.rotation.y = yaw;
      helmet.rotation.x = tilt;
      renderer.render(scene, camera);
    };
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
