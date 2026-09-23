// Экран загрузки: 3D-каска (WebGL, без библиотек) + прогресс загрузки.
// Каска — процедурная модель: высокий купол с центральным гребнем и боковыми
// рёбрами, козырёк спереди, узкий бортик по кругу, красная наклейка сбоку.
// Освещение: белый ключевой свет, красный контровой и блик.
(function () {
  const root = document.documentElement;
  if (!root.classList.contains('is-loading')) return;

  const MIN_MS = 3000;  // экран держится минимум столько
  const MAX_MS = 9000;  // и снимается не позже, даже если что-то зависло
  const FADE_MS = 500;
  const SPIN_MS = 3600; // один оборот каски

  const canvas = document.getElementById('helmetCanvas');
  const bar = document.getElementById('preloaderBar');
  const pctEl = document.getElementById('preloaderPct');
  const reduceMotion = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- модель ----------
  const TAU = Math.PI * 2;
  const HALF = Math.PI / 2;
  const ELONG = 1.12; // каска чуть вытянута вперёд-назад

  function norm(a) {
    const l = Math.hypot(a[0], a[1], a[2]) || 1;
    return [a[0] / l, a[1] / l, a[2] / l];
  }
  function dot(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
  function sub(a, b) { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; }
  function cross(a, b) {
    return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  }

  function domePoint(u, v) {
    const t = v / HALF;
    const s = Math.sin(v) * (1 + 0.05 * Math.pow(t, 6)); // у края слегка расширяется
    const x = s * Math.cos(u);
    const y = Math.cos(v) * 1.02;
    const z = s * Math.sin(u) * ELONG;
    // гребень по центру и два боковых ребра, к краю купола сходят на нет
    const fade = 1 - Math.pow(t, 4);
    const ridge = 0.05 * Math.exp(-Math.pow(x / 0.12, 2)) +
      0.028 * Math.exp(-Math.pow((Math.abs(x) - 0.48) / 0.07, 2));
    const k = 1 + ridge * fade;
    return [x * k, y * k, z * k];
  }

  function brimPoint(u, t, bottom) {
    const front = Math.max(0, Math.sin(u));
    const outer = 1.07 + 0.46 * Math.pow(front, 2.5); // спереди козырёк, по бокам бортик
    const r = 1 + (outer - 1) * t;
    let y = 0.01 - 0.05 * Math.pow(t, 1.5) - 0.12 * t * front * front;
    if (bottom) y -= 0.045;
    return [r * Math.cos(u), y, r * Math.sin(u) * ELONG];
  }

  const positions = [];
  const normals = [];
  const indices = [];

  // Сетка по параметрам (a, b) из [0,1]; нормали по конечным разностям,
  // направление задаёт hint (наружу от поверхности).
  function addSurface(fn, nu, nv, hint) {
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
        if (dot(n, hint(p)) < 0) n = [-n[0], -n[1], -n[2]];
        positions.push(p[0], p[1], p[2]);
        normals.push(n[0], n[1], n[2]);
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

  const SEGMENTS = 96;
  addSurface(function (a, b) { return domePoint(a * TAU, b * HALF); }, SEGMENTS, 32,
    function (p) { return p; });
  addSurface(function (a, b) { return brimPoint(a * TAU, b, false); }, SEGMENTS, 4,
    function () { return [0, 1, 0]; });
  addSurface(function (a, b) { return brimPoint(a * TAU, b, true); }, SEGMENTS, 4,
    function () { return [0, -1, 0]; });
  addSurface(function (a, b) {
    const top = brimPoint(a * TAU, 1, false);
    const bottom = brimPoint(a * TAU, 1, true);
    return [top[0], top[1] + (bottom[1] - top[1]) * b, top[2]];
  }, SEGMENTS, 1, function (p) { return [p[0], 0, p[2]]; });

  // ---------- WebGL ----------
  let draw = null;

  const gl = canvas && canvas.getContext &&
    (canvas.getContext('webgl', { antialias: true, alpha: true, premultipliedAlpha: true }) ||
     canvas.getContext('experimental-webgl'));

  if (gl) {
    const vs = [
      'attribute vec3 aPos;',
      'attribute vec3 aNor;',
      'uniform mat3 uRot;',
      'uniform float uF;',
      'uniform mediump float uCam;', // точность должна совпадать с фрагментным шейдером
      'varying vec3 vN;',
      'varying vec3 vP;',
      'varying vec3 vObj;',
      'void main() {',
      '  vObj = aPos;',
      '  vec3 p = uRot * (aPos - vec3(0.0, 0.36, 0.0));',
      '  vN = uRot * aNor;',
      '  vP = p;',
      '  float w = uCam - p.z;',
      '  gl_Position = vec4(p.x * uF, p.y * uF - 0.04 * w, -p.z / 3.0 * w, w);',
      '}'
    ].join('\n');

    const fs = [
      'precision mediump float;',
      'varying vec3 vN;',
      'varying vec3 vP;',
      'varying vec3 vObj;',
      'uniform vec3 uKey;',
      'uniform vec3 uRim;',
      'uniform float uCam;',
      'void main() {',
      '  vec3 n = normalize(vN);',
      '  vec3 V = normalize(vec3(0.0, 0.0, uCam) - vP);',
      '  vec3 red = vec3(0.886, 0.216, 0.173);',
      '  vec3 base = vec3(0.93, 0.91, 0.895);',
      '  float decal = smoothstep(0.585, 0.6, vObj.x) * (1.0 - smoothstep(0.19, 0.205, abs(vObj.z)))',
      '              * smoothstep(0.2, 0.215, vObj.y) * (1.0 - smoothstep(0.42, 0.435, vObj.y));',
      '  base = mix(base, red, decal);',
      '  float diff = max(dot(n, uKey), 0.0);',
      '  float rim = pow(max(dot(n, uRim), 0.0), 1.4);',
      '  float fres = pow(1.0 - max(dot(n, V), 0.0), 3.0);',
      '  vec3 H = normalize(uKey + V);',
      '  float spec = pow(max(dot(n, H), 0.0), 40.0) * 0.4;',
      '  vec3 c = base * (0.34 + 0.66 * diff) + red * (0.9 * rim + 0.25 * fres) + vec3(spec);',
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
      upload(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices));

      const uRot = gl.getUniformLocation(prog, 'uRot');
      gl.uniform1f(gl.getUniformLocation(prog, 'uF'), 3.1);
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
        draw((now / SPIN_MS) * TAU, 0.36 + 0.04 * Math.sin(now / 900));
      } else if (!drewStatic) {
        draw(0.7, 0.36);
        drewStatic = true;
      }
    }

    requestAnimationFrame(frame);
  }

  // страховка на случай, если вкладка в фоне и кадры не рисуются
  setTimeout(function () { loaded = true; hide(); }, MAX_MS);

  requestAnimationFrame(frame);
})();
