// Фоновые контурные линии-«лепестки» из логотипа компании.
// Модуль самостоятельный: при сбое секция остаётся со стандартным фоном.
(function() {
  var canvases = document.querySelectorAll('canvas[data-sweep]');
  if (!canvases || !canvases.length) return;

  var still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var COUNT = 20;    // 16–22 тонких кривых в каждом пучке
  var PERIOD = 16;   // период синусоиды волнения в секундах (12–20 с)

  function initSweep(canvas) {
    if (!canvas || !canvas.getContext) return;
    var ctx = canvas.getContext('2d');
    if (!ctx) return;

    var W = 0, H = 0, dpr = 1;
    var visible = false, raf = 0, last = 0, time = 0;

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 1.75);
      W = canvas.clientWidth;
      H = canvas.clientHeight;
      if (!W || !H) return;

      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);

      if (still || !raf) draw(time);
    }

    function draw(t) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      ctx.lineWidth = 1;
      ctx.lineCap = 'round';

      // Смещение от прокрутки страницы: пучки расходятся на десяток-другой пикселей
      var rect = canvas.getBoundingClientRect();
      var vh = window.innerHeight || 800;
      var progress = (vh - rect.top) / (vh + H);
      if (progress < 0) progress = 0;
      if (progress > 1) progress = 1;
      var scrollShift = (progress - 0.5) * 22; // от -11 до +11 px

      var angle = (t / PERIOD) * Math.PI * 2;
      var reachX = W < 720 ? 0.28 : (W < 1200 ? 0.33 : 0.38);

      // Рисуем два пучка: левый нижний и зеркальный правый верхний
      drawBundle(false, angle, scrollShift, reachX);
      drawBundle(true, angle, scrollShift, reachX);
    }

    function drawBundle(mirrored, angle, scrollShift, reachX) {
      for (var i = 0; i < COUNT; i++) {
        var u = i / (COUNT - 1);
        var endSpread = Math.pow(u, 1.25);

        // Медленное волнение контрольных точек синусоидой (амплитуда 10–24 px)
        var wave1 = Math.sin(angle + u * 2.1) * 16;
        var wave2 = Math.cos(angle * 0.85 + u * 1.7) * 13;

        // Исходные точки для левого нижнего пучка:
        // у основания линии плотно собраны, к концу веером расходятся шире
        var x0 = -W * 0.02 + u * (W * 0.06) - scrollShift * 0.4;
        var y0 = H * 1.02 - (1 - u) * (H * 0.05) + scrollShift * 0.4;

        var cp1x = -W * 0.04 + u * (W * 0.12) + wave1 * 0.5 - scrollShift * 0.5;
        var cp1y = H * (0.78 - u * 0.30) + wave2 * 0.5 + scrollShift * 0.5;

        var cp2x = W * (0.04 + u * 0.24) + wave2 - scrollShift * 0.8;
        var cp2y = H * (0.34 - u * 0.24) + wave1 + scrollShift * 0.6;

        var x3 = W * (0.07 + endSpread * reachX) + wave1 * 0.8 - scrollShift;
        var y3 = H * (0.28 - endSpread * 0.25) + wave2 * 0.8 + scrollShift * 0.6;

        // Зеркальный пучок из правого верхнего угла
        if (mirrored) {
          x0 = W - x0;
          y0 = H - y0;
          cp1x = W - cp1x;
          cp1y = H - cp1y;
          cp2x = W - cp2x;
          cp2y = H - cp2y;
          x3 = W - x3;
          y3 = H - y3;
        }

        // Плавное изменение прозрачности по пучку: α от 0.05 до 0.19
        var alpha = 0.05 + u * 0.14;
        ctx.strokeStyle = 'rgba(143, 220, 255, ' + alpha.toFixed(3) + ')';
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x3, y3);
        ctx.stroke();
      }
    }

    function frame(now) {
      raf = 0;
      if (!visible || document.hidden) return;

      var dt = Math.min((now - last) / 1000 || 0, 0.05);
      last = now;
      time += dt;

      draw(time);
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
  }

  for (var k = 0; k < canvases.length; k++) {
    initSweep(canvases[k]);
  }
})();
