document.addEventListener('DOMContentLoaded', function() {

  // анимации при скролле
  function initAnimations() {
    var observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.12,
      rootMargin: '0px 0px -50px 0px'
    });

    document.querySelectorAll('.anim').forEach(function(el) {
      observer.observe(el);
    });
  }

  // тень у хедера при скролле
  function initHeader() {
    var header = document.getElementById('header');
    if (!header) return; // на всякий случай

    window.addEventListener('scroll', function() {
      header.classList.toggle('header--scrolled', window.scrollY > 10);
    }, { passive: true });
  }

  // подсветка активного пункта меню
  function initActiveNav() {
    var navLinks = document.querySelectorAll('.header-nav a[href^="#"]');
    if (!navLinks.length) return;

    var navObserver = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (!entry.isIntersecting) return;

        var id = '#' + entry.target.id;
        navLinks.forEach(function(link) {
          link.classList.toggle('active', link.getAttribute('href') === id);
        });
      });
    }, {
      rootMargin: '-40% 0px -55% 0px'
    });

    document.querySelectorAll('section[id], footer[id]').forEach(function(section) {
      navObserver.observe(section);
    });
  }

  // заглушка если картинки не загрузились
  function handleBrokenImages() {
    document.querySelectorAll('.equip-img').forEach(function(img) {
      img.addEventListener('error', function() {
        this.classList.add('equip-img--error');
      }, { once: true });
    });
  }

  initAnimations();
  initHeader();
  initActiveNav();
  handleBrokenImages();

  console.log('%c✅ Нескользкая компания — скрипты загружены', 'color:#00c4a0; font-weight:600');
});