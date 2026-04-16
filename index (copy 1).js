document.addEventListener('DOMContentLoaded', () => {

  const animateOnScroll = () => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target); // один раз — и хватит
        }
      });
    }, {
      threshold: 0.12,        
      rootMargin: '0px 0px -50px 0px'
    });

    document.querySelectorAll('.anim').forEach(el => {
      observer.observe(el);
    });
  };

  const initHeader = () => {
    const header = document.querySelector('.hdr');

    const handleScroll = () => {
      header.classList.toggle('hdr--scrolled', window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
  };

  const initActiveNav = () => {
    const navLinks = document.querySelectorAll('.hdr-nav a[href^="#"]');

    const navObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const currentId = '#' + entry.target.id;

          navLinks.forEach(link => {
            link.classList.toggle('active', link.getAttribute('href') === currentId);
          });
        }
      });
    }, {
      rootMargin: '-40% 0px -55% 0px'  
    });

    // наблюдаем все секции + футер
    document.querySelectorAll('section[id], footer[id]').forEach(section => {
      navObserver.observe(section);
    });
  };

  const handleImagesError = () => {
    document.querySelectorAll('.equip-img').forEach(img => {
      img.addEventListener('error', function () {
        this.classList.add('equip-img--error');
      }, { once: true });
    });
  };


  animateOnScroll();
  initHeader();
  initActiveNav();
  handleImagesError();

  console.log('%c✅ Нескользкая компания — скрипты загружены', 'color:#00c4a0; font-weight:600');
});