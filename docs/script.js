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

const ambientVideos = Array.from(document.querySelectorAll('[data-ambient-video]'));
const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

if (ambientVideos.length > 0) {
  const syncAmbientVideo = (video, shouldPlay) => {
    if (reducedMotionQuery.matches || !shouldPlay) {
      video.pause();
      return;
    }

    const playAttempt = video.play();
    if (playAttempt && typeof playAttempt.catch === 'function') {
      playAttempt.catch(() => {});
    }
  };

  if ('IntersectionObserver' in window) {
    const ambientVideoObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        syncAmbientVideo(entry.target, entry.isIntersecting && entry.intersectionRatio > 0.15);
      });
    }, {
      threshold: [0.15, 0.4]
    });

    ambientVideos.forEach((video) => {
      ambientVideoObserver.observe(video);
    });
  } else {
    ambientVideos.forEach((video) => {
      syncAmbientVideo(video, true);
    });
  }

  const handleReducedMotionChange = () => {
    ambientVideos.forEach((video) => {
      syncAmbientVideo(video, true);
    });
  };

  if (typeof reducedMotionQuery.addEventListener === 'function') {
    reducedMotionQuery.addEventListener('change', handleReducedMotionChange);
  } else if (typeof reducedMotionQuery.addListener === 'function') {
    reducedMotionQuery.addListener(handleReducedMotionChange);
  }
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

const beatThree = document.querySelector('#beat-3');
const depthRail = beatThree?.querySelector('[data-depth-rail]');
const depthValue = depthRail?.querySelector('[data-depth-value]');
const depthNote = depthRail?.querySelector('[data-depth-note]');
const pressureValue = depthRail?.querySelector('[data-pressure-value]');
const temperatureValue = depthRail?.querySelector('[data-temperature-value]');
const lightValue = depthRail?.querySelector('[data-light-value]');
const pressureBar = depthRail?.querySelector('[data-pressure-bar]');
const temperatureBar = depthRail?.querySelector('[data-temperature-bar]');
const lightBar = depthRail?.querySelector('[data-light-bar]');

if (
  beatThree &&
  depthRail &&
  depthValue &&
  depthNote &&
  pressureValue &&
  temperatureValue &&
  lightValue &&
  pressureBar &&
  temperatureBar &&
  lightBar
) {
  registerScrollScene(beatThree, (_section, progress) => {
    const diveProgress = clamp((progress - 0.08) / 0.84, 0, 1);
    const depth = Math.round((diveProgress * 2000) / 25) * 25;
    const pressure = Math.round(1 + depth / 10);
    const temperature = Math.max(4, 18 - diveProgress * 14);
    const light = Math.max(0, Math.round(100 * Math.exp(-depth / 280)));
    let note = 'Surface glare. Full sunlight.';

    if (depth >= 1400) {
      note = 'Squid-hunt depth. Crushing pressure, almost no light.';
    } else if (depth >= 900) {
      note = 'Midnight zone. Instruments matter more than eyesight.';
    } else if (depth >= 400) {
      note = 'Twilight water. Blue light fades and the cold takes over.';
    }

    depthValue.textContent = depth.toLocaleString();
    depthNote.textContent = note;
    pressureValue.textContent = pressure.toLocaleString();
    temperatureValue.textContent = temperature.toFixed(1);
    lightValue.textContent = light.toString();
    pressureBar.style.transform = `scaleX(${clamp(pressure / 201, 0, 1).toFixed(4)})`;
    temperatureBar.style.transform = `scaleX(${clamp((temperature - 4) / 14, 0, 1).toFixed(4)})`;
    lightBar.style.transform = `scaleX(${clamp(light / 100, 0, 1).toFixed(4)})`;
  }, (rect) => {
    const travelDistance = Math.max(window.innerHeight * 1.15, rect.height * 1.65);
    return clamp((window.innerHeight - rect.top) / travelDistance, 0, 1);
  });
}

const beatFive = document.querySelector('[data-family-scene]');
const familyCards = beatFive ? Array.from(beatFive.querySelectorAll('[data-family-card]')) : [];
const compactFamilySceneQuery = window.matchMedia('(max-width: 640px)');

if (beatFive && familyCards.length > 0) {
  registerScrollScene(beatFive, (section, progress) => {
    if (reducedMotionQuery.matches || compactFamilySceneQuery.matches) {
      section.style.setProperty('--family-progress', '1.0000');

      familyCards.forEach((card) => {
        card.style.setProperty('--family-card-progress', '1');
        card.classList.add('is-revealed');
      });

      return;
    }

    const sceneProgress = clamp((progress - 0.02) / 0.94, 0, 1);
    section.style.setProperty('--family-progress', sceneProgress.toFixed(4));

    familyCards.forEach((card, index) => {
      const start = 0.02 + index * 0.19;
      const reveal = clamp((sceneProgress - start) / 0.18, 0, 1);

      card.style.setProperty('--family-card-progress', reveal.toFixed(4));
      card.classList.toggle('is-revealed', reveal > 0.98);
    });
  }, (rect) => {
    const lockedDistance = Math.max(rect.height - window.innerHeight, 1);
    return clamp(-rect.top / lockedDistance, 0, 1);
  });
}

document.querySelectorAll('[data-bottom-encounter]').forEach((scene) => {
  registerScrollScene(scene, (element, progress) => {
    const whale = clamp((progress - 0.02) / 0.64, 0, 1);
    const squid = clamp((progress - 0.16) / 0.36, 0, 1);

    element.style.setProperty('--bottom-encounter-progress', progress.toFixed(4));
    element.style.setProperty('--bottom-encounter-whale', whale.toFixed(4));
    element.style.setProperty('--bottom-encounter-squid', squid.toFixed(4));

    if (element.classList.contains('bottom-encounter--scene-one')) {
      const eyeReveal = clamp((progress - 0.18) / 0.3, 0, 1);
      const whaleGlow = clamp((progress - 0.12) / 0.34, 0, 1);

      element.style.setProperty('--scene-one-eye-reveal', eyeReveal.toFixed(4));
      element.style.setProperty('--scene-one-whale-glow', whaleGlow.toFixed(4));
    }

    if (element.classList.contains('bottom-encounter--scene-four')) {
      const whaleTwo = clamp((whale - 0.2) / 0.7, 0, 1);
      element.style.setProperty('--scene-four-whale-two', whaleTwo.toFixed(4));
    }

    if (element.classList.contains('bottom-encounter--scene-five')) {
      const inkSwallow = clamp((progress - 0.18) / 0.58, 0, 1);
      const inkBloom = clamp((progress - 0.06) / 0.72, 0, 1);

      element.style.setProperty('--scene-five-ink-swallow', inkSwallow.toFixed(4));
      element.style.setProperty('--scene-five-ink-bloom', inkBloom.toFixed(4));
    }
  }, (rect) => {
    const revealDistance = Math.max(window.innerHeight * 1.45, rect.height * 1.7);
    return clamp((window.innerHeight - rect.top) / revealDistance, 0, 1);
  });
});

const audioToggles = Array.from(document.querySelectorAll('[data-audio-toggle]'));

if (audioToggles.length > 0) {
  const setAudioButtonState = (button, isPlaying) => {
    button.setAttribute('aria-pressed', String(isPlaying));
    button.textContent = isPlaying ? 'Pause Sperm Whale Creak' : 'Play Sperm Whale Creak';
  };

  const syncEncounterAudioState = (button, isPlaying) => {
    const scene = button.closest('[data-bottom-encounter]');

    if (!scene) {
      return;
    }

    if (!scene.classList.contains('bottom-encounter--scene-two')) {
      return;
    }

    if (!isPlaying) {
      scene.classList.remove('is-sonar-active');
      return;
    }

    scene.classList.remove('is-sonar-active');
    window.requestAnimationFrame(() => {
      scene.classList.add('is-sonar-active');
    });
  };

  audioToggles.forEach((button) => {
    const audio = button.parentElement?.querySelector('[data-audio-player]');

    if (!audio) {
      return;
    }

    button.addEventListener('click', () => {
      const shouldPlay = audio.paused;

      audioToggles.forEach((otherButton) => {
        const otherAudio = otherButton.parentElement?.querySelector('[data-audio-player]');

        if (!otherAudio || otherAudio === audio) {
          return;
        }

        otherAudio.pause();
        otherAudio.currentTime = 0;
        setAudioButtonState(otherButton, false);
        syncEncounterAudioState(otherButton, false);
      });

      if (!shouldPlay) {
        audio.pause();
        setAudioButtonState(button, false);
        syncEncounterAudioState(button, false);
        return;
      }

      const playAttempt = audio.play();

      if (playAttempt && typeof playAttempt.then === 'function') {
        playAttempt.then(() => {
          setAudioButtonState(button, true);
          syncEncounterAudioState(button, true);
        }).catch(() => {
          setAudioButtonState(button, false);
          syncEncounterAudioState(button, false);
        });
      } else {
        setAudioButtonState(button, true);
        syncEncounterAudioState(button, true);
      }
    });

    audio.addEventListener('pause', () => {
      if (audio.currentTime < audio.duration) {
        setAudioButtonState(button, false);
        syncEncounterAudioState(button, false);
      }
    });

    audio.addEventListener('ended', () => {
      audio.currentTime = 0;
      setAudioButtonState(button, false);
      syncEncounterAudioState(button, false);
    });
  });
}

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
