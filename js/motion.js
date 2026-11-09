// Независимые эффекты и управление страницей.
(function() {
  'use strict';

  // Скрывать содержимое до появления можно только когда этот файл реально запустился.
  document.documentElement.classList.add('js');

  function safe(fn, fallback) {
    try {
      fn();
    } catch (e) {
      // Остальные модули продолжают работать.
      if (fallback) fallback();
    }
  }

  function reducedMotion() {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function reveal() {
    var items = document.querySelectorAll('.reveal');
    var i;
    if (!window.IntersectionObserver || reducedMotion()) {
      for (i = 0; i < items.length; i++) items[i].classList.add('is-in');
      return;
    }

    var observer = new window.IntersectionObserver(function(entries) {
      safe(function() {
        for (var j = 0; j < entries.length; j++) {
          if (!entries[j].isIntersecting) continue;
          entries[j].target.classList.add('is-in');
          observer.unobserve(entries[j].target);
        }
      });
    }, { threshold: 0.14, rootMargin: '0px 0px -40px 0px' });

    for (i = 0; i < items.length; i++) observer.observe(items[i]);
  }

  function header() {
    var element = document.getElementById('header');
    if (!element) return;

    function update() {
      safe(function() {
        element.classList.toggle('is-scrolled', (window.scrollY || window.pageYOffset || 0) > 24);
      });
    }

    window.addEventListener('scroll', update, { passive: true });
    update();
  }

  function navigation() {
    var links = document.querySelectorAll('.nav a[href^="#"]');
    var sections = document.querySelectorAll('section[id], footer[id]');
    var visible = [];
    var i;
    if (!links.length || !window.IntersectionObserver) return;

    function activate(id) {
      for (var j = 0; j < links.length; j++) {
        links[j].classList.toggle('active', id !== 'home' && links[j].getAttribute('href') === '#' + id);
      }
    }

    var observer = new window.IntersectionObserver(function(entries) {
      safe(function() {
        var j, k, id = '';
        for (j = 0; j < entries.length; j++) {
          for (k = 0; k < sections.length; k++) {
            if (sections[k] === entries[j].target) visible[k] = entries[j].isIntersecting;
          }
        }
        for (j = 0; j < sections.length; j++) {
          if (visible[j]) {
            id = sections[j].id;
            break;
          }
        }
        activate(id);
      });
    }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });

    activate('home');
    for (i = 0; i < sections.length; i++) {
      visible[i] = false;
      observer.observe(sections[i]);
    }
  }

  function mobileMenu() {
    var button = document.getElementById('menu-btn');
    var menu = document.getElementById('mobile-nav');
    if (!button || !menu) return;
    var behind = document.querySelectorAll('main, footer, .skip');

    function setOpen(open) {
      menu.hidden = !open;
      button.setAttribute('aria-expanded', open ? 'true' : 'false');
      button.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
      document.body.classList.toggle('menu-open', open);
      // Под открытым меню фокус недоступен.
      for (var j = 0; j < behind.length; j++) behind[j].inert = open;
      if (open) {
        var first = menu.querySelector('a');
        if (first) first.focus();
      }
    }

    button.addEventListener('click', function() {
      safe(function() {
        setOpen(menu.hidden);
      });
    });

    menu.addEventListener('click', function(e) {
      safe(function() {
        var target = e.target;
        while (target && target !== menu) {
          if (target.nodeName === 'A') {
            setOpen(false);
            return;
          }
          target = target.parentNode;
        }
      });
    });

    document.addEventListener('keydown', function(e) {
      safe(function() {
        if ((e.key === 'Escape' || e.keyCode === 27) && !menu.hidden) {
          setOpen(false);
          button.focus();
        }
      });
    });

    window.addEventListener('resize', function() {
      safe(function() {
        if (window.innerWidth > 960) setOpen(false);
      });
    }, { passive: true });

    setOpen(false);
  }

  function counters() {
    if (reducedMotion() || !window.IntersectionObserver || !window.requestAnimationFrame) return;
    var items = document.querySelectorAll('[data-count]');

    function animate(element) {
      var value = Number(element.getAttribute('data-count'));
      var suffix = element.getAttribute('data-suffix') || '';
      if (!isFinite(value)) return;
      var start = window.performance.now();

      function frame(now) {
        safe(function() {
          var p = Math.max(0, Math.min(1, (now - start) / 1400));
          var eased = 1 - Math.pow(1 - p, 3);
          element.textContent = (p === 1 ? value : Math.round(value * eased)) + suffix;
          if (p < 1) window.requestAnimationFrame(frame);
        });
      }

      // Обнуляем только при фактическом старте.
      frame(start);
    }

    var observer = new window.IntersectionObserver(function(entries) {
      safe(function() {
        for (var j = 0; j < entries.length; j++) {
          if (!entries[j].isIntersecting) continue;
          observer.unobserve(entries[j].target);
          safe(function() { animate(entries[j].target); });
        }
      });
    }, { threshold: 0.14 });

    for (var i = 0; i < items.length; i++) observer.observe(items[i]);
  }

  function process() {
    var track = document.getElementById('process-track');
    if (!track) return;
    var steps = track.querySelectorAll('.step');
    var pending = false;

    function paint(p) {
      track.style.setProperty('--p', String(p));
      for (var i = 0; i < steps.length; i++) {
        var on = i === 0 ? p > 0.01 : p >= i / (steps.length - 1) * 0.98;
        steps[i].classList.toggle('is-on', on);
      }
    }

    if (reducedMotion()) {
      paint(1);
      return;
    }

    function update() {
      pending = false;
      safe(function() {
        var rect = track.getBoundingClientRect();
        var height = window.innerHeight;
        var distance = rect.bottom - rect.top + height * 0.24;
        var p = distance > 0 ? (height * 0.82 - rect.top) / distance : 0;
        paint(Math.max(0, Math.min(1, p)));
      });
    }

    function schedule() {
      if (pending) return;
      pending = true;
      window.requestAnimationFrame(update);
    }

    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule, { passive: true });
    update();
  }

  function parallax() {
    if (reducedMotion() || !window.matchMedia) return;
    var items = document.querySelectorAll('[data-parallax]');
    if (!items.length) return;
    var media = window.matchMedia('(hover: hover) and (min-width: 961px)');
    var pending = false;

    function update() {
      pending = false;
      safe(function() {
        for (var i = 0; i < items.length; i++) {
          if (!media.matches || reducedMotion()) {
            items[i].style.removeProperty('translate');
            continue;
          }
          var parent = items[i].parentNode;
          var factor = Number(items[i].getAttribute('data-parallax'));
          if (!parent || !isFinite(factor)) continue;
          var rect = parent.getBoundingClientRect();
          var offset = ((rect.top + rect.bottom) / 2 - window.innerHeight / 2) * factor;
          // Смещение не затрагивает увеличение при наведении.
          items[i].style.setProperty('translate', '0 ' + offset + 'px');
        }
      });
    }

    function schedule() {
      if (pending) return;
      pending = true;
      window.requestAnimationFrame(update);
    }

    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule, { passive: true });
    if (media.addEventListener) media.addEventListener('change', schedule);
    else if (media.addListener) media.addListener(schedule);
    update();
  }

  function lightbox() {
    var buttons = document.querySelectorAll('[data-zoom]');
    var dialog = document.getElementById('lightbox');
    var image = document.getElementById('lightbox-img');
    var opener = null;

    function open(e) {
      safe(function() {
        var button = e.currentTarget;
        var path = button.getAttribute('data-zoom');
        // Без диалога срабатывает обычная ссылка на картинку.
        if (!path || !dialog || !image || typeof dialog.showModal !== 'function') return;
        e.preventDefault();
        opener = button;
        image.src = path;
        image.alt = button.getAttribute('data-zoom-alt') || '';
        image.classList.toggle('is-cut', path.indexOf('prosevatel') !== -1);
        dialog.showModal();
      });
    }

    for (var i = 0; i < buttons.length; i++) buttons[i].addEventListener('click', open);
    if (!dialog) return;

    var close = dialog.querySelector('.lightbox-close');
    if (close) close.addEventListener('click', function() {
      safe(function() { dialog.close(); });
    });

    dialog.addEventListener('click', function(e) {
      safe(function() {
        if (e.target === dialog) dialog.close();
      });
    });

    dialog.addEventListener('close', function() {
      safe(function() {
        if (opener) opener.focus();
        opener = null;
      });
    });
  }

  safe(reveal, function() {
    var items = document.querySelectorAll('.reveal');
    for (var i = 0; i < items.length; i++) items[i].classList.add('is-in');
  });
  safe(header);
  safe(navigation);
  safe(mobileMenu);
  safe(counters);
  safe(process);
  safe(parallax);
  safe(lightbox);
})();
