// Искры от обработки металла в подвале сайта.
// Модуль самостоятельный: при сбое подвал остаётся со стандартным градиентом.
(function() {
  var canvas = document.getElementById('sparks');
  if (!canvas || !canvas.getContext) return;

  var ctx = canvas.getContext('2d');
  if (!ctx) return;

  var still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var W = 0, H = 0, dpr = 1;
  var visible = false, raf = 0, last = 0;
  var sparks = [];

  // Цвета раскалённого металла: оранжевый, жёлтый, изредка красноватый
  var COLORS = [
    { r: 255, g: 166, b: 64 },  // оранжевый #ffa640
    { r: 255, g: 210, b: 122 }, // жёлтый #ffd27a
    { r: 255, g: 106, b: 60 }   // красноватый #ff6a3c
  ];

  function getTargetCount() {
    // Примерно 90 при 1440x800 (площадь 1 152 000 px²), диапазон 30..130
    var count = Math.round(90 * (W * H) / 1152000);
    if (count < 30) count = 30;
    if (count > 130) count = 130;
    return count;
  }

  function resetSpark(s, initial) {
    s.z = 0.25 + Math.random() * 0.75; // глубина: 0.25 (дальний) .. 1.0 (ближний)
    s.size = 0.8 + s.z * 1.5;          // толщина ядра
    s.x = Math.random() * W;

    // В статичном режиме или при старте распределяем по высоте,
    // в полёте искры зарождаются у самого низа
    if (initial) {
      s.y = H * (0.35 + Math.pow(Math.random(), 1.5) * 0.65);
    } else {
      s.y = H + Math.random() * 16;
    }

    // Скорость вверх: дальние медленнее, ближние быстрее
    s.vy = -(65 + Math.random() * 115) * (0.55 + s.z * 0.55);
    s.vx = (Math.random() - 0.5) * 26 * (0.5 + s.z * 0.5);
    s.sway = Math.random() * Math.PI * 2;
    s.swaySpeed = 1.6 + Math.random() * 2.2;
    s.twinkle = Math.random() * Math.PI * 2;
    s.twinkleSpeed = 9 + Math.random() * 11;

    var roll = Math.random();
    var c = roll < 0.14 ? COLORS[2] : (roll < 0.62 ? COLORS[0] : COLORS[1]);
    s.r = c.r;
    s.g = c.g;
    s.b = c.b;

    s.baseAlpha = 0.35 + s.z * 0.65;
    // Высота затухания в верхней трети подвала
    s.dieY = H * (0.05 + Math.random() * 0.28);
  }

  function createSpark(initial) {
    var s = {};
    resetSpark(s, initial);
    return s;
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 1.75);
    W = canvas.clientWidth;
    H = canvas.clientHeight;
    if (!W || !H) return;

    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);

    var target = getTargetCount();
    while (sparks.length < target) {
      sparks.push(createSpark(true));
    }
    if (sparks.length > target) {
      sparks.length = target;
    }

    for (var i = 0; i < sparks.length; i++) {
      if (sparks[i].x > W) sparks[i].x = Math.random() * W;
      if (sparks[i].dieY > H * 0.35) sparks[i].dieY = H * (0.05 + Math.random() * 0.28);
    }

    if (still || !raf) draw(0);
  }

  function draw(dt) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineCap = 'round';

    for (var i = 0; i < sparks.length; i++) {
      var s = sparks[i];

      if (dt > 0) {
        s.sway += dt * s.swaySpeed;
        s.twinkle += dt * s.twinkleSpeed;
        s.x += (s.vx + Math.sin(s.sway) * 8) * dt;
        s.y += s.vy * dt;

        // Затухание по мере подъёма к верхней трети
        if (s.y <= s.dieY) {
          resetSpark(s, false);
          continue;
        }
        if (s.x < -20 || s.x > W + 20) {
          resetSpark(s, false);
          continue;
        }
      }

      // Яркость зависит от высоты: ближе к низу гуще и ярче
      var progress = (s.y - s.dieY) / Math.max(1, H - s.dieY);
      if (progress < 0) progress = 0;
      if (progress > 1) progress = 1;
      var fade = progress * progress * (3 - 2 * progress);

      var flicker = 0.72 + 0.28 * Math.sin(s.twinkle);
      var alpha = s.baseAlpha * fade * flicker;
      if (alpha < 0.01) continue;

      // Вытянутая светящаяся капля по вектору скорости
      var speed = Math.sqrt(s.vx * s.vx + s.vy * s.vy);
      var len = Math.max(4, speed * 0.07 * (0.6 + s.z * 0.4));
      var dx = s.vx / speed;
      var dy = s.vy / speed;
      var tailX = s.x - dx * len;
      var tailY = s.y - dy * len;

      var rgb = s.r + ',' + s.g + ',' + s.b;

      // Внешний мягкий ореол
      ctx.strokeStyle = 'rgba(' + rgb + ',' + (alpha * 0.35).toFixed(3) + ')';
      ctx.lineWidth = s.size * 2.4;
      ctx.beginPath();
      ctx.moveTo(tailX, tailY);
      ctx.lineTo(s.x, s.y);
      ctx.stroke();

      // Яркое ядро капли
      ctx.strokeStyle = 'rgba(' + rgb + ',' + (alpha * 0.95).toFixed(3) + ')';
      ctx.lineWidth = s.size;
      ctx.beginPath();
      ctx.moveTo(tailX, tailY);
      ctx.lineTo(s.x, s.y);
      ctx.stroke();

      // Раскалённая головка капли
      ctx.fillStyle = 'rgba(255,255,230,' + (alpha * 0.85).toFixed(3) + ')';
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size * 0.7, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalCompositeOperation = 'source-over';
  }

  function frame(now) {
    raf = 0;
    if (!visible || document.hidden) return;

    var dt = Math.min((now - last) / 1000 || 0, 0.05);
    last = now;

    draw(dt);
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

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function(entries) {
      visible = entries[0].isIntersecting;
      start();
    }).observe(canvas);
  } else {
    visible = true;
  }

  document.addEventListener('visibilitychange', start);
  start();
})();
