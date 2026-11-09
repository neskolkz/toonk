// Стальная спираль на первом экране — та самая насадка, которую делает компания.
// Модуль самостоятельный: если что-то сломается, страница останется с обычным фоном.
(function() {
  var canvas = document.getElementById('coil');
  if (!canvas || !canvas.getContext) return;

  var ctx = canvas.getContext('2d');
  if (!ctx) return;

  var still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var LEVELS = 22; // столько оттенков стали, чтобы рисовать пачками, а не по сегменту
  var W = 0, H = 0, dpr = 1, turns = 70, perTurn = 56, wire = 6, detail = 1;
  var slow = 0, frames = 0;
  var phase = 0, wound = still ? 1 : 0, last = 0, raf = 0, visible = true;
  var pointer = 0.5, pointerNow = 0.5, scrollKick = 0, lastScroll = window.scrollY;

  var buckets = [];
  for (var i = 0; i < LEVELS; i++) buckets.push({ back: [], front: [] });

  // тёмно-синяя сталь -> светлая сталь -> блик
  function shade(k) {
    var r, g, b;
    if (k < 0.6) {
      var a = k / 0.6;
      r = 10 + a * 112; g = 34 + a * 112; b = 92 + a * 96;
    } else {
      var c = (k - 0.6) / 0.4;
      r = 122 + c * 133; g = 146 + c * 109; b = 188 + c * 67;
    }
    return 'rgb(' + (r | 0) + ',' + (g | 0) + ',' + (b | 0) + ')';
  }

  var colors = [];
  for (var n = 0; n < LEVELS; n++) colors.push(shade(n / (LEVELS - 1)));

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 1.75);
    W = canvas.clientWidth;
    H = canvas.clientHeight;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);

    var small = W < 720;
    turns = small ? 46 : 70;
    perTurn = Math.round((small ? 34 : 56) * detail);
    wire = small ? 3.8 : Math.max(5, W / 205);
    if (still || !raf) draw();
  }

  function draw() {
    var span = Math.sqrt(W * W + H * H) * 1.24;
    var ax = 0.82, ay = W > H ? 0.57 : 0.86; // ось спирали идёт по диагонали
    var len = Math.sqrt(ax * ax + ay * ay);
    ax /= len; ay /= len;
    var nx = -ay, ny = ax;
    var cx = W * 0.5, cy = H * 0.48;
    var radius = Math.max(W, H) * (W < 720 ? 0.17 : 0.15);
    var total = Math.floor(turns * perTurn * wound);
    var glint = 0.5 + (pointerNow - 0.5) * 0.7 + Math.sin(phase * 0.21) * 0.24;
    var j, q;

    for (j = 0; j < LEVELS; j++) { buckets[j].back.length = 0; buckets[j].front.length = 0; }

    var px = 0, py = 0, has = false;
    for (q = 0; q <= total; q++) {
      var t = q / (turns * perTurn);
      var th = t * turns * Math.PI * 2 + phase;
      var sin = Math.sin(th), cos = Math.cos(th);
      var persp = 1 + sin * 0.17;
      // лёгкое дыхание радиуса, чтобы витки не были мёртво одинаковыми
      var rad = radius * (1 + Math.sin(t * 9 + phase * 0.3) * 0.035) * persp;
      var along = (t - 0.5) * span + sin * radius * 0.42;
      var x = cx + ax * along + nx * cos * rad;
      var y = cy + ay * along + ny * cos * rad;

      if (has) {
        var light = Math.pow(Math.max(0, cos * 0.62 + sin * 0.78), 3);
        var g = (t - glint) / 0.13;
        var streak = Math.exp(-g * g);
        var level = 0.08 + (sin > 0 ? 0.3 : 0.02) + light * 0.5 + streak * (sin > 0 ? 0.5 : 0.14);
        var idx = Math.min(LEVELS - 1, Math.floor(level * LEVELS));
        (sin > 0 ? buckets[idx].front : buckets[idx].back).push(px, py, x, y);
      }
      px = x; py = y; has = true;
    }

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'source-over';
    ctx.lineCap = 'round';

    ctx.globalAlpha = 0.5;
    ctx.lineWidth = wire * 0.8;
    stroke('back', 0);

    // тёмная обводка отделяет передние витки от задних, блик даёт проволоке объём
    ctx.globalAlpha = 1;
    ctx.lineWidth = wire * 1.5;
    outline();
    ctx.lineWidth = wire;
    stroke('front', 0);

    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 0.5;
    ctx.lineWidth = wire * 0.26;
    stroke('front', Math.floor(LEVELS * 0.42), -wire * 0.22);
    ctx.globalAlpha = 1;

    // концы растворяются в темноте
    ctx.globalCompositeOperation = 'destination-in';
    var fade = ctx.createLinearGradient(cx - ax * span * 0.5, cy - ay * span * 0.5, cx + ax * span * 0.5, cy + ay * span * 0.5);
    fade.addColorStop(0.06, 'rgba(0,0,0,0)');
    fade.addColorStop(0.3, 'rgba(0,0,0,1)');
    fade.addColorStop(0.72, 'rgba(0,0,0,1)');
    fade.addColorStop(0.95, 'rgba(0,0,0,0)');
    ctx.fillStyle = fade;
    ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'source-over';
  }

  function trace(list, off) {
    for (var k = 0; k < list.length; k += 4) {
      ctx.moveTo(list[k] + off, list[k + 1] + off);
      ctx.lineTo(list[k + 2] + off, list[k + 3] + off);
    }
  }

  function stroke(side, from, off) {
    for (var j = from; j < LEVELS; j++) {
      var list = buckets[j][side];
      if (!list.length) continue;
      ctx.strokeStyle = colors[j];
      ctx.beginPath();
      trace(list, off || 0);
      ctx.stroke();
    }
  }

  function outline() {
    ctx.strokeStyle = '#050917';
    ctx.beginPath();
    for (var j = 0; j < LEVELS; j++) trace(buckets[j].front, 0);
    ctx.stroke();
  }

  function frame(now) {
    raf = 0;
    if (!visible || document.hidden) return;

    var dt = Math.min((now - last) / 1000 || 0, 0.05);
    last = now;

    wound = Math.min(1, wound + dt / 2.4);
    scrollKick *= 0.9;
    phase += dt * 0.42 + scrollKick;
    pointerNow += (pointer - pointerNow) * 0.05;

    draw();

    // на слабом железе один раз упрощаем спираль, а не тормозим страницу
    if (detail === 1 && dt > 0) {
      frames++;
      if (dt > 0.03) slow++;
      if (frames >= 60) {
        if (slow > 30) { detail = 0.55; resize(); }
        frames = 0; slow = 0;
      }
    }

    raf = requestAnimationFrame(frame);
  }

  function start() {
    if (still || raf || !visible || document.hidden) return;
    last = performance.now();
    raf = requestAnimationFrame(frame);
  }

  resize();
  window.addEventListener('resize', resize, { passive: true });

  if (still) return;

  window.addEventListener('pointermove', function(e) {
    pointer = e.clientX / Math.max(window.innerWidth, 1);
  }, { passive: true });

  window.addEventListener('scroll', function() {
    var y = window.scrollY;
    scrollKick = Math.max(-0.05, Math.min(0.05, (y - lastScroll) * 0.0012));
    lastScroll = y;
  }, { passive: true });

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function(entries) {
      visible = entries[0].isIntersecting;
      start();
    }).observe(canvas);
  }

  document.addEventListener('visibilitychange', start);
  start();
})();
