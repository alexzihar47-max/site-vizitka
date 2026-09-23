// Экран загрузки: 3D-каска (WebGL, без библиотек) + прогресс загрузки.
//
// Модель повторяет обычную строительную каску: высокий купол с широкой
// центральной полосой и боковыми рёбрами, козырёк спереди, край поднимается
// к бокам, слоты под наушники, вентиляционные прорези, чёрное оголовье
// с регулятором сзади и красный логотип на лбу.
//
// Вращение неравномерное: лицом к зрителю каска почти замирает,
// а остальную часть оборота проходит быстро.
(function () {
  const root = document.documentElement;
  if (!root.classList.contains('is-loading')) return;

  const MIN_MS = 3000;  // экран держится минимум столько
  const MAX_MS = 9000;  // и снимается не позже, даже если что-то зависло
  const FADE_MS = 500;
  const TURN_MS = 2800; // один оборот каски
  const EASE = 0.8;     // 0 — равномерно, ближе к 1 — дольше смотрит на зрителя

  const canvas = document.getElementById('helmetCanvas');
  const bar = document.getElementById('preloaderBar');
  const pctEl = document.getElementById('preloaderPct');
  const reduceMotion = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- математика ----------
  const TAU = Math.PI * 2;
  const HALF = Math.PI / 2;

  function norm(a) {
    const l = Math.hypot(a[0], a[1], a[2]) || 1;
    return [a[0] / l, a[1] / l, a[2] / l];
  }
  function dot(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
  function add(a, b) { return [a[0] + b[0], a[1] + b[1], a[2] + b[2]]; }
  function sub(a, b) { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; }
  function scale(a, k) { return [a[0] * k, a[1] * k, a[2] * k]; }
  function cross(a, b) {
    return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  }
  function smoothstep(a, b, x) {
    const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
    return t * t * (3 - 2 * t);
  }

  // ---------- форма каски ----------
  // Оси: y — вверх, +z — перёд каски (козырёк), x — вбок.
  const ELONG = 1.16; // вытянута вперёд-назад

  // Край каски поднимается от козырька к бокам и чуть опускается сзади.
  function rimRise(u) {
    const s = Math.sin(u);
    return 0.06 * (1 - Math.max(0, s)) - 0.02 * Math.pow(Math.max(0, -s), 2);
  }

  function domePoint(u, v) {
    const t = v / HALF;
    // бока ближе к вертикали, у края купол слегка расширяется
    const s = Math.pow(Math.sin(v), 0.72) * (1 + 0.04 * Math.pow(t, 8));
    const x = s * Math.cos(u);
    const y = Math.cos(v) * 1.1;
    const z = s * Math.sin(u) * ELONG;
    // широкая центральная полоса и два боковых ребра; к краю сходят на нет
    const ax = Math.abs(x);
    const relief = 0.028 * (1 - smoothstep(0.11, 0.22, ax)) +
      0.016 * Math.exp(-Math.pow((ax - 0.44) / 0.07, 2));
    const k = 1 + relief * (1 - Math.pow(t, 4));
    return [x * k, y * k + rimRise(u) * Math.pow(t, 3), z * k];
  }

  const BRIM_THICK = 0.04;

  function brimPoint(u, t, bottom) {
    const front = Math.max(0, Math.sin(u));
    // короткий козырёк спереди, по бокам и сзади узкий бортик
    const outer = 1.075 + 0.2 * Math.pow(front, 3);
    const r = 1 + (outer - 1) * t;
    let y = 0.005 + rimRise(u) - 0.03 * t * t - 0.09 * t * t * front * front;
    if (bottom) y -= BRIM_THICK;
    return [r * Math.cos(u), y, r * Math.sin(u) * ELONG];
  }

  // ---------- сборка сетки ----------
  const WHITE = [0.93, 0.91, 0.895];
  const BLACK = [0.07, 0.07, 0.075];
  const positions = [];
  const normals = [];
  const colors = [];
  const indices = [];

  function vertex(p, n, c) {
    positions.push(p[0], p[1], p[2]);
    normals.push(n[0], n[1], n[2]);
    colors.push(c[0], c[1], c[2]);
    return positions.length / 3 - 1;
  }

  // Сетка по параметрам (a, b) из [0,1]; гладкие нормали по конечным
  // разностям, направление задаёт hint (наружу от поверхности).
  function addSurface(fn, nu, nv, hint, color) {
    const base = positions.length / 3;
    const e = 1e-3;
    for (let j = 0; j <= nv; j++) {
      for (let i = 0; i <= nu; i++) {
        const a = i / nu;
        const b = j / nv;
        const p = fn(a, b);
        const du = sub(fn(a + e, b), fn(a - e, b));
        const dv = sub(fn(a, Math.min(1, b + e)), fn(a, Math.max(0, b - e)));
        let n = cross(du, dv);
        if (Math.hypot(n[0], n[1], n[2]) < 1e-9) n = [0, 1, 0];
        n = norm(n);
        if (dot(n, hint(p)) < 0) n = scale(n, -1);
        vertex(p, n, color);
      }
    }
    const row = nu + 1;
    for (let j = 0; j < nv; j++) {
      for (let i = 0; i < nu; i++) {
        const k = base + j * row + i;
        indices.push(k, k + 1, k + row, k + 1, k + row + 1, k + row);
      }
    }
  }

  // Прямоугольный выступ на поверхности: центр, три оси, полуразмеры.
  function addBox(center, ax, ay, az, hx, hy, hz, color) {
    const faces = [
      [az, ax, ay, hz, hx, hy], [scale(az, -1), ax, ay, hz, hx, hy],
      [ax, ay, az, hx, hy, hz], [scale(ax, -1), ay, az, hx, hy, hz],
      [ay, az, ax, hy, hz, hx], [scale(ay, -1), az, ax, hy, hz, hx]
    ];
    faces.forEach(function (f) {
      const n = f[0], s1 = f[1], s2 = f[2];
      const c = add(center, scale(n, f[3]));
      const corners = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(function (q) {
        return vertex(add(c, add(scale(s1, q[0] * f[4]), scale(s2, q[1] * f[5]))), n, color);
      });
      indices.push(corners[0], corners[1], corners[2], corners[0], corners[2], corners[3]);
    });
  }

  const SEG = 144;
  const TAU_A = function (a) { return a * TAU; };

  // купол
  addSurface(function (a, b) { return domePoint(TAU_A(a), b * HALF); }, SEG, 32,
    function (p) { return p; }, WHITE);
  // козырёк и бортик: верх, низ, торец
  addSurface(function (a, b) { return brimPoint(TAU_A(a), b, false); }, SEG, 4,
    function () { return [0, 1, 0]; }, WHITE);
  addSurface(function (a, b) { return brimPoint(TAU_A(a), b, true); }, SEG, 4,
    function () { return [0, -1, 0]; }, WHITE);
  // скруглённый торец козырька
  addSurface(function (a, b) {
    const u = TAU_A(a);
    const top = brimPoint(u, 1, false);
    const out = norm([Math.cos(u), 0, Math.sin(u) * ELONG]);
    const phi = HALF - b * Math.PI;
    const half = BRIM_THICK / 2;
    const bulge = half * Math.cos(phi);
    return [top[0] + out[0] * bulge, top[1] - half + half * Math.sin(phi), top[2] + out[2] * bulge];
  }, SEG, 6, function (p) { return [p[0], 0, p[2]]; }, WHITE);

  // чёрное оголовье внутри: лента, видна снизу по бокам и сзади
  function bandPoint(u, b, r) {
    const depth = 0.1 + 0.2 * Math.max(0, -Math.sin(u)); // сзади свисает ниже
    return [r * Math.cos(u), 0.06 - (0.06 + depth) * b, r * Math.sin(u) * ELONG * 0.96];
  }
  addSurface(function (a, b) { return bandPoint(TAU_A(a), b, 0.86); }, 64, 2,
    function (p) { return [p[0], 0, p[2]]; }, BLACK);
  addSurface(function (a, b) { return bandPoint(TAU_A(a), b, 0.84); }, 64, 2,
    function (p) { return [-p[0], 0, -p[2]]; }, BLACK);

  // регулятор-«колёсико» сзади
  const KNOB = [0, -0.16, -0.86 * ELONG * 0.96];
  addSurface(function (a, b) {
    const u = TAU_A(a);
    return [KNOB[0] + 0.12 * Math.cos(u), KNOB[1] + 0.12 * Math.sin(u), KNOB[2] - 0.09 * b];
  }, 32, 1, function (p) { return [p[0] - KNOB[0], p[1] - KNOB[1], 0]; }, BLACK);
  addSurface(function (a, b) {
    const u = TAU_A(a);
    return [KNOB[0] + 0.12 * b * Math.cos(u), KNOB[1] + 0.12 * b * Math.sin(u), KNOB[2] - 0.09];
  }, 32, 1, function () { return [0, 0, -1]; }, BLACK);

  // слоты под наушники: по два на каждом боку, у края купола
  [0.55, -0.55, Math.PI + 0.55, Math.PI - 0.55].forEach(function (u) {
    const base = domePoint(u, HALF * 0.9);
    const out = norm([Math.cos(u), 0, Math.sin(u) * ELONG]);
    const along = norm([-Math.sin(u) * ELONG, 0, Math.cos(u)]);
    addBox(add(base, scale(out, 0.01)), along, [0, 1, 0], out, 0.085, 0.055, 0.03, WHITE);
  });

  // ---------- WebGL ----------
  let draw = null;

  const gl = canvas && canvas.getContext &&
    (canvas.getContext('webgl', { antialias: true, alpha: true, premultipliedAlpha: true }) ||
     canvas.getContext('experimental-webgl'));

  if (gl) {
    const vs = [
      'attribute vec3 aPos;',
      'attribute vec3 aNor;',
      'attribute vec3 aCol;',
      'uniform mat3 uRot;',
      'uniform float uF;',
      'uniform mediump float uCam;', // точность должна совпадать с фрагментным шейдером
      'varying vec3 vN;',
      'varying vec3 vP;',
      'varying vec3 vObj;',
      'varying vec3 vCol;',
      'void main() {',
      '  vObj = aPos;',
      '  vCol = aCol;',
      '  vec3 p = uRot * (aPos - vec3(0.0, 0.42, 0.0));',
      '  vN = uRot * aNor;',
      '  vP = p;',
      '  float w = uCam - p.z;',
      '  gl_Position = vec4(p.x * uF, p.y * uF + 0.02 * w, -p.z / 3.0 * w, w);',
      '}'
    ].join('\n');

    const fs = [
      'precision mediump float;',
      'varying vec3 vN;',
      'varying vec3 vP;',
      'varying vec3 vObj;',
      'varying vec3 vCol;',
      'uniform vec3 uKey;',
      'uniform vec3 uRim;',
      'uniform float uCam;',
      'void main() {',
      '  vec3 n = normalize(vN);',
      '  vec3 V = normalize(vec3(0.0, 0.0, uCam) - vP);',
      '  vec3 red = vec3(0.886, 0.216, 0.173);',
      '  vec3 base = vCol;',
      '  float shell = step(0.5, vCol.r);',
      // красный логотип на лбу, на центральной полосе
      '  float logo = shell * step(0.6, vObj.z) * (1.0 - smoothstep(0.1, 0.112, abs(vObj.x)))',
      '             * smoothstep(0.3, 0.312, vObj.y) * (1.0 - smoothstep(0.44, 0.452, vObj.y));',
      // вентиляционные прорези по бокам
      '  float vz = (vObj.z + 0.08) / 0.42;',
      '  float vent = shell * step(0.6, abs(vObj.x)) * step(0.0, vz) * step(vz, 1.0)',
      '             * step(fract(vz * 5.0), 0.62)',
      '             * smoothstep(0.585, 0.595, vObj.y) * (1.0 - smoothstep(0.625, 0.635, vObj.y));',
      '  base = mix(base, red, logo);',
      '  base = mix(base, vec3(0.16, 0.15, 0.16), vent);',
      '  float diff = max(dot(n, uKey), 0.0);',
      '  float rim = pow(max(dot(n, uRim), 0.0), 1.4);',
      '  float fres = pow(1.0 - max(dot(n, V), 0.0), 3.0);',
      '  vec3 H = normalize(uKey + V);',
      '  float spec = pow(max(dot(n, H), 0.0), 40.0) * mix(0.15, 0.4, shell);',
      '  vec3 c = base * (0.34 + 0.66 * diff) + red * (0.9 * rim + 0.25 * fres) * mix(0.35, 1.0, shell) + vec3(spec);',
      '  gl_FragColor = vec4(min(c, vec3(1.0)), 1.0);',
      '}'
    ].join('\n');

    const compile = function (type, src) {
      const sh = gl.createShader(type);
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      return sh;
    };

    const prog = gl.createProgram();
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, vs));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(prog);

    if (gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      gl.useProgram(prog);

      const upload = function (target, data, attr) {
        gl.bindBuffer(target, gl.createBuffer());
        gl.bufferData(target, data, gl.STATIC_DRAW);
        if (attr) {
          const loc = gl.getAttribLocation(prog, attr);
          gl.enableVertexAttribArray(loc);
          gl.vertexAttribPointer(loc, 3, gl.FLOAT, false, 0, 0);
        }
      };
      upload(gl.ARRAY_BUFFER, new Float32Array(positions), 'aPos');
      upload(gl.ARRAY_BUFFER, new Float32Array(normals), 'aNor');
      upload(gl.ARRAY_BUFFER, new Float32Array(colors), 'aCol');
      upload(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices));

      const uRot = gl.getUniformLocation(prog, 'uRot');
      gl.uniform1f(gl.getUniformLocation(prog, 'uF'), 2.9);
      gl.uniform1f(gl.getUniformLocation(prog, 'uCam'), 6.0);
      gl.uniform3fv(gl.getUniformLocation(prog, 'uKey'), norm([-0.55, 0.75, 0.6]));
      gl.uniform3fv(gl.getUniformLocation(prog, 'uRim'), norm([0.8, 0.15, -0.7]));

      gl.enable(gl.DEPTH_TEST);
      gl.clearColor(0, 0, 0, 0);

      const resize = function () {
        const rect = canvas.getBoundingClientRect();
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.round((rect.width || 150) * dpr);
        canvas.height = Math.round((rect.height || 150) * dpr);
        gl.viewport(0, 0, canvas.width, canvas.height);
      };
      resize();
      window.addEventListener('resize', resize);

      draw = function (yaw, pitch) {
        const c = Math.cos(yaw), s = Math.sin(yaw);
        const cp = Math.cos(pitch), sp = Math.sin(pitch);
        // поворот вокруг вертикали, затем наклон к зрителю (матрица по столбцам)
        gl.uniformMatrix3fv(uRot, false, [c, sp * s, -cp * s, 0, cp, sp, s, -sp * c, cp * c]);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);
      };
    }
  }

  // без WebGL показываем только прогресс
  if (!draw && canvas) canvas.style.display = 'none';

  // Угол поворота во времени. Внутри оборота скорость 1 − EASE·cos(2πf):
  // у «лица» (f = 0) почти стоит, на обратной стороне разгоняется.
  // Фаза подобрана так, что к концу загрузки каска снова смотрит на зрителя.
  function yawAt(now) {
    const x = (now - MIN_MS) / TURN_MS;
    const turn = Math.floor(x);
    const f = x - turn;
    return TAU * (turn + f - EASE * Math.sin(TAU * f) / TAU);
  }

  // ---------- прогресс ----------
  let loaded = document.readyState === 'complete';
  let shown = 0;
  let finished = false;
  let hideStarted = false;
  let drewStatic = false;

  window.addEventListener('load', function () { loaded = true; });

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
      setTimeout(function () {
        finished = true;
        root.classList.remove('is-loading', 'preloader-hide');
      }, FADE_MS);
    }, 300);
  }

  function frame(now) {
    if (finished) return;

    // Прогресс идёт по времени, но не дальше 90%, пока страница реально не загрузилась.
    const byTime = Math.min(1, now / MIN_MS);
    const target = Math.min(byTime, loaded ? 1 : 0.9);
    shown += (target - shown) * 0.12;
    if (target === 1 && shown > 0.995) shown = 1;
    if (!hideStarted) setProgress(shown);
    if (shown === 1) hide();

    if (draw) {
      if (!reduceMotion) {
        draw(yawAt(now), 0.2 + 0.03 * Math.sin(now / 900));
      } else if (!drewStatic) {
        draw(0.45, 0.2);
        drewStatic = true;
      }
    }

    requestAnimationFrame(frame);
  }

  // страховка на случай, если вкладка в фоне и кадры не рисуются
  setTimeout(function () { loaded = true; hide(); }, MAX_MS);

  requestAnimationFrame(frame);
})();
