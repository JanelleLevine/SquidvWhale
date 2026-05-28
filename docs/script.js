const siteHeader = document.querySelector('.site-header');
const menuToggle = document.querySelector('.menu-toggle');
const siteNav = document.querySelector('.site-nav');
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

if (menuToggle && siteNav) {
  menuToggle.addEventListener('click', () => {
    const isOpen = menuToggle.getAttribute('aria-expanded') === 'true';
    menuToggle.setAttribute('aria-expanded', String(!isOpen));
    siteNav.classList.toggle('is-open', !isOpen);

    if (siteHeader) {
      siteHeader.classList.remove('site-header--hidden');
    }
  });

  siteNav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      menuToggle.setAttribute('aria-expanded', 'false');
      siteNav.classList.remove('is-open');

      if (siteHeader) {
        siteHeader.classList.remove('site-header--hidden');
      }
    });
  });
}

if (siteHeader) {
  let lastScrollY = window.scrollY;
  let ticking = false;
  const hideAfter = 0;
  const directionThreshold = 2;

  const updateHeaderVisibility = () => {
    const currentScrollY = window.scrollY;
    const isMenuOpen = menuToggle && menuToggle.getAttribute('aria-expanded') === 'true';

    if (isMenuOpen || currentScrollY <= hideAfter) {
      siteHeader.classList.remove('site-header--hidden');
    } else if (currentScrollY > lastScrollY + directionThreshold) {
      siteHeader.classList.add('site-header--hidden');
    } else if (currentScrollY < lastScrollY - directionThreshold) {
      siteHeader.classList.remove('site-header--hidden');
    }

    lastScrollY = currentScrollY;
    ticking = false;
  };

  window.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(updateHeaderVisibility);
      ticking = true;
    }
  }, { passive: true });
}

const registerScrollScene = (element, updateScene, getProgress) => {
  if (!element) {
    return;
  }

  let ticking = false;

  const renderScene = () => {
    const rect = element.getBoundingClientRect();
    const progress = getProgress
      ? getProgress(rect)
      : clamp((window.innerHeight - rect.top) / (window.innerHeight + rect.height), 0, 1);

    updateScene(element, progress);
    ticking = false;
  };

  const requestSceneRender = () => {
    if (ticking) {
      return;
    }

    ticking = true;
    window.requestAnimationFrame(renderScene);
  };

  window.addEventListener('scroll', requestSceneRender, { passive: true });
  window.addEventListener('resize', requestSceneRender);
  requestSceneRender();
};

registerScrollScene(document.querySelector('[data-bottom-encounter]'), (scene, progress) => {
  const whale = clamp((progress - 0.02) / 0.64, 0, 1);
  const squid = clamp((progress - 0.16) / 0.36, 0, 1);

  scene.style.setProperty('--bottom-encounter-progress', progress.toFixed(4));
  scene.style.setProperty('--bottom-encounter-whale', whale.toFixed(4));
  scene.style.setProperty('--bottom-encounter-squid', squid.toFixed(4));
}, (rect) => {
  const revealDistance = Math.max(window.innerHeight * 1.45, rect.height * 1.7);
  return clamp((window.innerHeight - rect.top) / revealDistance, 0, 1);
});

const carousels = document.querySelectorAll('[data-carousel]');

carousels.forEach((carousel) => {
  const track = carousel.querySelector('[data-carousel-track]');
  const slides = Array.from(carousel.querySelectorAll('[data-carousel-slide]'));
  const prevButton = carousel.querySelector('[data-carousel-prev]');
  const nextButton = carousel.querySelector('[data-carousel-next]');
  const dots = Array.from(carousel.querySelectorAll('[data-carousel-dot]'));

  if (!track || slides.length === 0 || !prevButton || !nextButton) {
    return;
  }

  let currentIndex = 0;

  const renderCarousel = (index) => {
    currentIndex = (index + slides.length) % slides.length;
    track.style.transform = `translateX(-${currentIndex * 100}%)`;

    slides.forEach((slide, slideIndex) => {
      slide.classList.toggle('is-active', slideIndex === currentIndex);
    });

    dots.forEach((dot, dotIndex) => {
      const isActive = dotIndex === currentIndex;
      dot.classList.toggle('is-active', isActive);
      dot.setAttribute('aria-pressed', String(isActive));
    });
  };

  prevButton.addEventListener('click', () => {
    renderCarousel(currentIndex - 1);
  });

  nextButton.addEventListener('click', () => {
    renderCarousel(currentIndex + 1);
  });

  dots.forEach((dot, dotIndex) => {
    dot.addEventListener('click', () => {
      renderCarousel(dotIndex);
    });
  });

  carousel.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      renderCarousel(currentIndex - 1);
    }

    if (event.key === 'ArrowRight') {
      event.preventDefault();
      renderCarousel(currentIndex + 1);
    }
  });

  renderCarousel(0);
});
