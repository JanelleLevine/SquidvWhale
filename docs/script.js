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
const compactHeroMigrationQuery = window.matchMedia('(max-width: 900px)');
const mediaVisibilityThresholds = [0.15, 0.4];

const addMediaQueryChangeListener = (query, handler) => {
  if (typeof query.addEventListener === 'function') {
    query.addEventListener('change', handler);
  } else if (typeof query.addListener === 'function') {
    query.addListener(handler);
  }
};

const initializeLoopingVideo = (video) => {
  video.muted = true;
  video.defaultMuted = true;
  video.loop = true;
  video.playsInline = true;
  video.setAttribute('muted', '');
  video.setAttribute('loop', '');
  video.setAttribute('playsinline', '');
};

const setMediaPlayback = (media, shouldPlay) => {
  if (!shouldPlay) {
    media.pause();
    return false;
  }

  const playAttempt = media.play();

  if (playAttempt && typeof playAttempt.catch === 'function') {
    playAttempt.catch(() => {});
  }

  return true;
};

const observeVisibility = (
  items,
  onChange,
  getTarget = (item) => item,
  thresholds = mediaVisibilityThresholds
) => {
  if (items.length === 0) {
    return;
  }

  const visibilityThreshold = thresholds[0] ?? 0;

  if ('IntersectionObserver' in window) {
    const observedItems = new Map();

    items.forEach((item) => {
      const target = getTarget(item);

      if (target) {
        observedItems.set(target, item);
      }
    });

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const item = observedItems.get(entry.target);

        if (!item) {
          return;
        }

        onChange(item, entry.isIntersecting && entry.intersectionRatio > visibilityThreshold);
      });
    }, {
      threshold: thresholds
    });

    observedItems.forEach((_, target) => {
      observer.observe(target);
    });

    return;
  }

  items.forEach((item) => {
    onChange(item, true);
  });
};

ambientVideos.forEach(initializeLoopingVideo);

const enableWheelScrollSmoothing = () => {
  return;
};

enableWheelScrollSmoothing();

const syncAmbientVideo = (video, shouldPlay) => {
  setMediaPlayback(video, shouldPlay && !reducedMotionQuery.matches);
};

if (ambientVideos.length > 0) {
  const refreshAmbientVideos = () => {
    ambientVideos.forEach((video) => {
      syncAmbientVideo(video, true);
    });
  };

  observeVisibility(ambientVideos, syncAmbientVideo);
  addMediaQueryChangeListener(reducedMotionQuery, refreshAmbientVideos);
}

const maskedVideos = Array.from(document.querySelectorAll('[data-masked-video]'));

maskedVideos.forEach(initializeLoopingVideo);

if (maskedVideos.length > 0) {
  const squidMaskSrc = 'assets/images/giant_squid_silhouette_transparent.png';

  const maskedVideoEntries = maskedVideos.map((video) => {
    const host = video.closest('.bottom-encounter__ink-squid-group');
    const canvas = host?.querySelector('.bottom-encounter__squid-ink-canvas');
    const context = canvas?.getContext('2d');

    if (!host || !canvas || !context) {
      return null;
    }

    const mask = new Image();
    mask.decoding = 'async';
    mask.src = squidMaskSrc;

    return {
      canvas,
      context,
      frameRequest: null,
      host,
      mask,
      maskReady: false,
      video
    };
  }).filter(Boolean);

  const resizeMaskedCanvas = (entry) => {
    const rect = entry.host.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const width = Math.max(1, Math.round(rect.width * dpr));
    const height = Math.max(1, Math.round(rect.height * dpr));

    if (entry.canvas.width !== width || entry.canvas.height !== height) {
      entry.canvas.width = width;
      entry.canvas.height = height;
    }
  };

  const drawVideoCover = (context, video, width, height) => {
    const sourceWidth = video.videoWidth || 1;
    const sourceHeight = video.videoHeight || 1;
    const scale = Math.max(width / sourceWidth, height / sourceHeight);
    const drawWidth = sourceWidth * scale;
    const drawHeight = sourceHeight * scale;
    const offsetX = (width - drawWidth) / 2;
    const offsetY = (height - drawHeight) / 2;

    context.drawImage(video, offsetX, offsetY, drawWidth, drawHeight);
  };

  const renderMaskedVideo = (entry) => {
    if (!entry.maskReady) {
      return;
    }

    resizeMaskedCanvas(entry);

    const { canvas, context, mask, video } = entry;
    context.clearRect(0, 0, canvas.width, canvas.height);

    if (video.readyState < 2) {
      return;
    }

    drawVideoCover(context, video, canvas.width, canvas.height);
    context.globalCompositeOperation = 'destination-in';
    context.drawImage(mask, 0, 0, canvas.width, canvas.height);
    context.globalCompositeOperation = 'source-over';
  };

  const stopMaskedVideoLoop = (entry) => {
    if (!entry.frameRequest) {
      return;
    }

    if (entry.frameRequest.type === 'video-frame' && typeof entry.video.cancelVideoFrameCallback === 'function') {
      entry.video.cancelVideoFrameCallback(entry.frameRequest.id);
    } else if (entry.frameRequest.type === 'raf') {
      window.cancelAnimationFrame(entry.frameRequest.id);
    }

    entry.frameRequest = null;
  };

  const queueMaskedVideoFrame = (entry) => {
    if (entry.frameRequest || entry.video.paused || entry.video.ended) {
      return;
    }

    const tick = () => {
      entry.frameRequest = null;
      renderMaskedVideo(entry);

      if (!entry.video.paused && !entry.video.ended) {
        queueMaskedVideoFrame(entry);
      }
    };

    if (typeof entry.video.requestVideoFrameCallback === 'function') {
      entry.frameRequest = {
        type: 'video-frame',
        id: entry.video.requestVideoFrameCallback(() => {
          tick();
        })
      };
      return;
    }

    entry.frameRequest = {
      type: 'raf',
      id: window.requestAnimationFrame(() => {
        tick();
      })
    };
  };

  maskedVideoEntries.forEach((entry) => {
    entry.mask.addEventListener('load', () => {
      entry.maskReady = true;
      renderMaskedVideo(entry);

      if (!entry.video.paused) {
        queueMaskedVideoFrame(entry);
      }
    }, { once: true });

    if (entry.mask.complete) {
      entry.maskReady = true;
      renderMaskedVideo(entry);

      if (!entry.video.paused) {
        queueMaskedVideoFrame(entry);
      }
    }

    entry.video.addEventListener('loadeddata', () => {
      renderMaskedVideo(entry);
    });

    entry.video.addEventListener('play', () => {
      renderMaskedVideo(entry);
      queueMaskedVideoFrame(entry);
    });

    entry.video.addEventListener('pause', () => {
      stopMaskedVideoLoop(entry);
      renderMaskedVideo(entry);
    });

    entry.video.addEventListener('ended', () => {
      stopMaskedVideoLoop(entry);
      renderMaskedVideo(entry);
    });
  });

  const syncMaskedEntry = (entry, shouldPlay) => {
    const isPlaying = setMediaPlayback(entry.video, shouldPlay && !reducedMotionQuery.matches);

    if (!isPlaying) {
      stopMaskedVideoLoop(entry);
      renderMaskedVideo(entry);
      return;
    }

    renderMaskedVideo(entry);
    queueMaskedVideoFrame(entry);
  };

  const refreshMaskedVideos = () => {
    maskedVideoEntries.forEach((entry) => {
      syncMaskedEntry(entry, true);
    });
  };

  observeVisibility(maskedVideoEntries, syncMaskedEntry, (entry) => entry.host);
  addMediaQueryChangeListener(reducedMotionQuery, refreshMaskedVideos);

  window.addEventListener('resize', () => {
    maskedVideoEntries.forEach((entry) => {
      renderMaskedVideo(entry);
    });
  }, { passive: true });
}

const registerScrollScene = (element, updateScene, getProgress) => {
  if (!element) {
    return;
  }

  let ticking = false;
  let animationFrame = null;
  let currentProgress = null;
  let targetProgress = 0;

  const settleThreshold = 0.00035;
  const smoothingFactor = 0.075;

  const measureProgress = () => {
    const rect = element.getBoundingClientRect();
    return getProgress
      ? getProgress(rect)
      : clamp((window.innerHeight - rect.top) / (window.innerHeight + rect.height), 0, 1);
  };

  const animateScene = () => {
    const shouldSnap = reducedMotionQuery.matches;

    if (currentProgress === null || shouldSnap) {
      currentProgress = targetProgress;
    } else {
      currentProgress += (targetProgress - currentProgress) * smoothingFactor;

      if (Math.abs(targetProgress - currentProgress) < settleThreshold) {
        currentProgress = targetProgress;
      }
    }

    updateScene(element, currentProgress);

    if (Math.abs(targetProgress - currentProgress) >= settleThreshold) {
      animationFrame = window.requestAnimationFrame(animateScene);
      return;
    }

    animationFrame = null;
  };

  const renderScene = () => {
    targetProgress = measureProgress();

    if (currentProgress === null) {
      currentProgress = targetProgress;
    }

    if (animationFrame === null) {
      animationFrame = window.requestAnimationFrame(animateScene);
    }

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

const followWhaleScene = document.querySelector('[data-follow-whale-scene]');
const followWhaleViewport = followWhaleScene ? followWhaleScene.querySelector('.follow-whale-viewport') : null;
const followWhaleTrack = followWhaleScene ? followWhaleScene.querySelector('[data-follow-whale-track]') : null;
const followWhalePanels = followWhaleScene ? Array.from(followWhaleScene.querySelectorAll('[data-follow-whale-panel]')) : [];
const beatFourScene = document.querySelector('[data-beat-four-scene]');
const beatFourViewport = beatFourScene ? beatFourScene.querySelector('.beat-four-viewport') : null;
const beatFourTrack = beatFourScene ? beatFourScene.querySelector('[data-beat-four-track]') : null;
const beatFourPanels = beatFourScene ? Array.from(beatFourScene.querySelectorAll('[data-beat-four-panel]')) : [];
const compactFollowWhaleQuery = window.matchMedia('(max-width: 960px)');
const compactBeatFourQuery = window.matchMedia('(max-width: 720px)');

const registerHorizontalPanels = ({
  scene,
  viewport,
  track,
  panels,
  countVar,
  stepVar,
  progressVar,
  getProgress,
  compactQuery = compactFollowWhaleQuery
}) => {
  if (!scene || !viewport || !track || panels.length === 0) {
    return;
  }

  scene.style.setProperty(countVar, String(panels.length));

  registerScrollScene(scene, (section, progress) => {
    const viewportWidth = viewport.clientWidth;
    const trackStyles = window.getComputedStyle(track);
    const gap = parseFloat(trackStyles.gap || '0') || 0;

    section.style.setProperty(stepVar, `${viewportWidth}px`);

    if (reducedMotionQuery.matches || compactQuery.matches) {
      section.style.setProperty(progressVar, '0.0000');
      track.style.transform = 'translate3d(0, 0, 0)';
      return;
    }

    const sceneProgress = clamp((progress - 0.04) / 0.92, 0, 1);
    const trackShift = sceneProgress * (panels.length - 1) * (viewportWidth + gap);

    section.style.setProperty(progressVar, sceneProgress.toFixed(4));
    track.style.transform = `translate3d(-${trackShift.toFixed(2)}px, 0, 0)`;
  }, getProgress || ((rect) => {
    const lockedDistance = Math.max(rect.height - window.innerHeight, 1);
    return clamp(-rect.top / lockedDistance, 0, 1);
  }));
};

registerHorizontalPanels({
  scene: followWhaleScene,
  viewport: followWhaleViewport,
  track: followWhaleTrack,
  panels: followWhalePanels,
  countVar: '--follow-whale-panel-count',
  stepVar: '--follow-whale-step',
  progressVar: '--follow-whale-progress',
  compactQuery: compactFollowWhaleQuery
});

registerHorizontalPanels({
  scene: beatFourScene,
  viewport: beatFourViewport,
  track: beatFourTrack,
  panels: beatFourPanels,
  countVar: '--beat-four-panel-count',
  stepVar: '--beat-four-step',
  progressVar: '--beat-four-progress',
  compactQuery: compactBeatFourQuery
});

const beatFourDiagramPanels = Array.from(document.querySelectorAll('[data-beat-four-diagram]'));

if (beatFourDiagramPanels.length > 0) {
  const beatFourConnectorConfigs = {
    pod: {
      pod: {
        card: 'pod',
        direction: 'left',
        source: 'pod',
        sourcePoint: { x: 0.16, y: 0.52 },
        targetPoint: { x: 1, y: 0.5 }
      }
    },
    sound: {
      echolocation: {
        card: 'echolocation',
        direction: 'right',
        source: 'echolocation',
        sourcePoint: { x: 0.68, y: 0.42 },
        targetPoint: { x: 0, y: 0.5 }
      },
      stealth: {
        card: 'stealth',
        direction: 'left',
        source: 'stealth',
        sourcePoint: { x: 0.22, y: 0.5 },
        targetPoint: { x: 1, y: 0.5 }
      }
    },
    vision: {
      body: {
        card: 'body',
        direction: 'left',
        source: 'body',
        sourcePoint: { x: 0.16, y: 0.47 },
        targetPoint: { x: 1, y: 0.5 }
      },
      ink: {
        card: 'ink',
        direction: 'right',
        source: 'ink',
        sourcePoint: { x: 0.78, y: 0.5 },
        targetPoint: { x: 0, y: 0.5 }
      },
      lead: {
        card: 'lead',
        direction: 'right',
        source: 'lead',
        sourcePoint: { x: 0.82, y: 0.48 },
        targetPoint: { x: 0, y: 0.5 }
      }
    }
  };

  const connectorStates = beatFourDiagramPanels.map((panel) => {
    const overlay = panel.querySelector('.beat-four-wire__connectors');
    const panelType = panel.dataset.beatFourDiagram;
    const panelConfig = panelType ? beatFourConnectorConfigs[panelType] : null;

    if (!overlay || !panelConfig) {
      return null;
    }

    const connectors = Object.entries(panelConfig).map(([key, connectorConfig]) => {
      const group = overlay.querySelector(`[data-beat-four-link="${key}"]`);

      if (!group) {
        return null;
      }

      return {
        card: panel.querySelector(`[data-beat-four-card="${connectorConfig.card}"]`),
        config: connectorConfig,
        group,
        source: panel.querySelector(`[data-beat-four-source="${connectorConfig.source}"]`)
      };
    }).filter(Boolean);

    if (connectors.length === 0) {
      return null;
    }

    return {
      connectors,
      overlay,
      panel
    };
  }).filter(Boolean);

  const setConnectorVisibility = (group, isVisible) => {
    if (!group) {
      return;
    }

    group.style.opacity = isVisible ? '1' : '0';
  };

  const getRectRelativeToPanel = (element, panelRect) => {
    const rect = element.getBoundingClientRect();

    return {
      bottom: rect.bottom - panelRect.top,
      height: rect.height,
      left: rect.left - panelRect.left,
      right: rect.right - panelRect.left,
      top: rect.top - panelRect.top,
      width: rect.width
    };
  };

  const getAnchorPoint = (rect, anchorPoint) => ({
    x: rect.left + (rect.width * anchorPoint.x),
    y: rect.top + (rect.height * anchorPoint.y)
  });

  const buildOrthogonalConnectorPath = (startPoint, endPoint, direction) => {
    const horizontalGap = Math.abs(endPoint.x - startPoint.x);
    const verticalGap = Math.abs(endPoint.y - startPoint.y);
    const signY = endPoint.y >= startPoint.y ? 1 : -1;

    if (horizontalGap < 18) {
      return null;
    }

    if (verticalGap < 8) {
      return `M ${startPoint.x.toFixed(2)} ${startPoint.y.toFixed(2)} H ${endPoint.x.toFixed(2)}`;
    }

    const elbowTravel = clamp(horizontalGap * 0.38, 18, 88);
    const elbowX = direction === 'right'
      ? Math.min(startPoint.x + elbowTravel, endPoint.x - 14)
      : Math.max(startPoint.x - elbowTravel, endPoint.x + 14);

    if (
      (direction === 'right' && elbowX <= startPoint.x + 8) ||
      (direction === 'right' && elbowX >= endPoint.x - 8) ||
      (direction === 'left' && elbowX >= startPoint.x - 8) ||
      (direction === 'left' && elbowX <= endPoint.x + 8)
    ) {
      return null;
    }

    const cornerRadius = clamp(Math.min(verticalGap * 0.35, horizontalGap * 0.18), 4, 12);

    if (direction === 'right') {
      const firstTurnX = elbowX - cornerRadius;
      const firstTurnY = startPoint.y + (signY * cornerRadius);
      const secondTurnY = endPoint.y - (signY * cornerRadius);
      const secondTurnX = elbowX + cornerRadius;

      return `M ${startPoint.x.toFixed(2)} ${startPoint.y.toFixed(2)} H ${firstTurnX.toFixed(2)} Q ${elbowX.toFixed(2)} ${startPoint.y.toFixed(2)} ${elbowX.toFixed(2)} ${firstTurnY.toFixed(2)} V ${secondTurnY.toFixed(2)} Q ${elbowX.toFixed(2)} ${endPoint.y.toFixed(2)} ${secondTurnX.toFixed(2)} ${endPoint.y.toFixed(2)} H ${endPoint.x.toFixed(2)}`;
    }

    const firstTurnX = elbowX + cornerRadius;
    const firstTurnY = startPoint.y + (signY * cornerRadius);
    const secondTurnY = endPoint.y - (signY * cornerRadius);
    const secondTurnX = elbowX - cornerRadius;

    return `M ${startPoint.x.toFixed(2)} ${startPoint.y.toFixed(2)} H ${firstTurnX.toFixed(2)} Q ${elbowX.toFixed(2)} ${startPoint.y.toFixed(2)} ${elbowX.toFixed(2)} ${firstTurnY.toFixed(2)} V ${secondTurnY.toFixed(2)} Q ${elbowX.toFixed(2)} ${endPoint.y.toFixed(2)} ${secondTurnX.toFixed(2)} ${endPoint.y.toFixed(2)} H ${endPoint.x.toFixed(2)}`;
  };

  const updateBeatFourPanelConnectors = (state) => {
    const panelRect = state.panel.getBoundingClientRect();

    if (
      compactBeatFourQuery.matches ||
      panelRect.width < 1 ||
      panelRect.height < 1
    ) {
      state.connectors.forEach(({ group }) => setConnectorVisibility(group, false));
      return;
    }

    state.overlay.setAttribute('viewBox', `0 0 ${panelRect.width.toFixed(2)} ${panelRect.height.toFixed(2)}`);

    state.connectors.forEach(({ card, config, group, source }) => {
      if (!source || !card || !group) {
        setConnectorVisibility(group, false);
        return;
      }

      const sourceRect = getRectRelativeToPanel(source, panelRect);
      const cardRect = getRectRelativeToPanel(card, panelRect);

      if (sourceRect.width < 1 || sourceRect.height < 1 || cardRect.width < 1 || cardRect.height < 1) {
        setConnectorVisibility(group, false);
        return;
      }

      const startPoint = getAnchorPoint(sourceRect, config.sourcePoint);
      const endPoint = getAnchorPoint(cardRect, config.targetPoint);
      const horizontalDelta = endPoint.x - startPoint.x;

      if (
        (config.direction === 'right' && horizontalDelta <= 18) ||
        (config.direction === 'left' && horizontalDelta >= -18)
      ) {
        setConnectorVisibility(group, false);
        return;
      }

      const connectorPath = buildOrthogonalConnectorPath(
        startPoint,
        endPoint,
        config.direction
      );
      const path = group.querySelector('.beat-four-wire__connector-line');
      const animalNode = group.querySelector('.beat-four-wire__connector-node--animal');
      const cardNode = group.querySelector('.beat-four-wire__connector-node--card');

      if (!connectorPath || !path || !animalNode || !cardNode) {
        setConnectorVisibility(group, false);
        return;
      }

      path.setAttribute('d', connectorPath);
      animalNode.setAttribute('cx', startPoint.x.toFixed(2));
      animalNode.setAttribute('cy', startPoint.y.toFixed(2));
      cardNode.setAttribute('cx', endPoint.x.toFixed(2));
      cardNode.setAttribute('cy', endPoint.y.toFixed(2));
      setConnectorVisibility(group, true);
    });
  };

  let connectorFrame = null;

  const queueBeatFourConnectorUpdate = () => {
    if (connectorFrame !== null) {
      return;
    }

    connectorFrame = window.requestAnimationFrame(() => {
      connectorFrame = null;
      connectorStates.forEach(updateBeatFourPanelConnectors);
    });
  };

  if ('ResizeObserver' in window) {
    const connectorObserver = new ResizeObserver(queueBeatFourConnectorUpdate);

    connectorStates.forEach((state) => {
      connectorObserver.observe(state.panel);

      const observedElements = new Set();

      state.connectors.forEach(({ card, source }) => {
        [card, source].forEach((element) => {
          if (element) {
            observedElements.add(element);
          }
        });
      });

      observedElements.forEach((element) => {
        if (element) {
          connectorObserver.observe(element);
        }
      });
    });
  }

  if ('MutationObserver' in window && beatFourTrack) {
    const trackObserver = new MutationObserver(queueBeatFourConnectorUpdate);
    trackObserver.observe(beatFourTrack, {
      attributeFilter: ['style'],
      attributes: true
    });
  }

  window.addEventListener('resize', queueBeatFourConnectorUpdate, { passive: true });
  window.addEventListener('scroll', queueBeatFourConnectorUpdate, { passive: true });
  addMediaQueryChangeListener(compactBeatFourQuery, queueBeatFourConnectorUpdate);

  if (document.fonts?.ready) {
    document.fonts.ready.then(queueBeatFourConnectorUpdate).catch(() => {});
  }

  window.addEventListener('load', queueBeatFourConnectorUpdate, { once: true });

  queueBeatFourConnectorUpdate();
}

const migrationSceneStates = new Map();

const createSeededRandom = (seed) => {
  let state = seed >>> 0;

  return () => {
    state += 0x6D2B79F5;
    let value = Math.imul(state ^ (state >>> 15), 1 | state);
    value ^= value + Math.imul(value ^ (value >>> 7), 61 | value);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
};

const randomBetween = (random, min, max) => min + ((max - min) * random());

const migrationAssets = {
  whale: {
    height: 1024,
    src: 'assets/images/Silhouette_Sperm_Whale.png',
    width: 1536
  },
  squid: {
    height: 1402,
    src: 'assets/images/giant_squid_silhouette_transparent.png',
    width: 1122
  }
};

const migrationBlueprints = {
  whale: [
    { x: 84, y: 74, start: 0.05, duration: 0.24, scale: 0.62, rotation: -12, opacity: 0.22, tier: 'background', parallaxX: '2.4vw', parallaxY: '-16px' },
    { x: 73, y: 60, start: 0.19, duration: 0.29, scale: 1.08, rotation: -2, opacity: 0.42, parallaxX: '1.9vw', parallaxY: '10px' },
    { x: 60, y: 78, start: 0.33, duration: 0.23, scale: 0.7, rotation: -16, opacity: 0.2, tier: 'background', parallaxX: '3.1vw', parallaxY: '-10px' },
    { x: 46, y: 66, start: 0.48, duration: 0.31, scale: 0.95, rotation: 4, opacity: 0.34, parallaxX: '1.2vw', parallaxY: '8px' },
    { x: 31, y: 72, start: 0.63, duration: 0.27, scale: 0.52, rotation: -7, opacity: 0.18, tier: 'background', mirror: -1, parallaxX: '2.7vw', parallaxY: '-12px' }
  ],
  squid: [
    { x: 16, y: 22, start: 0.15, duration: 0.24, scale: 0.68, rotation: 4, opacity: 0.2, tier: 'background', parallaxX: '-2.6vw', parallaxY: '-14px' },
    { x: 28, y: 49, start: 0.28, duration: 0.26, scale: 0.88, rotation: 17, opacity: 0.34, parallaxX: '-1.9vw', parallaxY: '-8px' },
    { x: 60, y: 25, start: 0.39, duration: 0.3, scale: 1.02, rotation: 9, opacity: 0.46, parallaxX: '-1.1vw', parallaxY: '-10px' }
  ]
};

const heroMigrationBlueprints = {
  wide: {
    whale: [
      { x: 112, y: -16, start: 0.04, duration: 0.24, cycleDuration: 54, phase: 0.04, scale: 0.52, rotation: -14, opacity: 0.16, tier: 'background', parallaxX: '-2.2vw', parallaxY: '-12px' },
      { x: 114, y: -4, start: 0.1, duration: 0.28, cycleDuration: 54, phase: 0.1, scale: 0.74, rotation: -9, opacity: 0.22, parallaxX: '-1.9vw', parallaxY: '-8px' },
      { x: 110, y: 12, start: 0.16, duration: 0.28, cycleDuration: 54, phase: 0.16, scale: 0.66, rotation: -11, opacity: 0.19, tier: 'background', parallaxX: '-2vw', parallaxY: '-10px' },
      { x: 116, y: 70, start: 0.38, duration: 0.3, cycleDuration: 54, phase: 0.38, scale: 0.88, rotation: -4, opacity: 0.28, parallaxX: '-1.7vw', parallaxY: '8px' },
      { x: 118, y: 82, start: 0.44, duration: 0.32, cycleDuration: 54, phase: 0.44, scale: 0.98, rotation: 3, opacity: 0.31, parallaxX: '-1.5vw', parallaxY: '10px' }
    ],
    squid: [
      { x: -16, y: -10, start: 0.02, duration: 0.22, cycleDuration: 52, phase: 0.02, scale: 0.56, rotation: 6, opacity: 0.15, tier: 'background', parallaxX: '2vw', parallaxY: '-12px' },
      { x: -12, y: 12, start: 0.22, duration: 0.24, cycleDuration: 52, phase: 0.22, scale: 0.64, rotation: 10, opacity: 0.18, parallaxX: '1.9vw', parallaxY: '-10px' },
      { x: -18, y: 54, start: 0.42, duration: 0.26, cycleDuration: 52, phase: 0.42, scale: 0.78, rotation: 15, opacity: 0.24, parallaxX: '1.8vw', parallaxY: '-8px' },
      { x: -10, y: 78, start: 0.62, duration: 0.28, cycleDuration: 52, phase: 0.62, scale: 0.72, rotation: 11, opacity: 0.2, tier: 'background', parallaxX: '1.7vw', parallaxY: '-9px' },
      { x: -14, y: 98, start: 0.82, duration: 0.3, cycleDuration: 52, phase: 0.82, scale: 0.9, rotation: 9, opacity: 0.29, parallaxX: '1.5vw', parallaxY: '-10px' }
    ]
  },
  compact: {
    whale: [
      { x: 112, y: -18, start: 0.04, duration: 0.24, cycleDuration: 56, phase: 0.04, scale: 0.52, rotation: -13, opacity: 0.16, tier: 'background', parallaxX: '-2.1vw', parallaxY: '-12px' },
      { x: 114, y: -4, start: 0.1, duration: 0.28, cycleDuration: 56, phase: 0.1, scale: 0.72, rotation: -9, opacity: 0.22, parallaxX: '-1.9vw', parallaxY: '-8px' },
      { x: 110, y: 14, start: 0.16, duration: 0.28, cycleDuration: 56, phase: 0.16, scale: 0.66, rotation: -11, opacity: 0.19, tier: 'background', parallaxX: '-2vw', parallaxY: '-10px' },
      { x: 116, y: 80, start: 0.38, duration: 0.3, cycleDuration: 56, phase: 0.38, scale: 0.86, rotation: -4, opacity: 0.28, parallaxX: '-1.6vw', parallaxY: '8px' },
      { x: 118, y: 94, start: 0.44, duration: 0.32, cycleDuration: 56, phase: 0.44, scale: 0.98, rotation: 3, opacity: 0.31, parallaxX: '-1.4vw', parallaxY: '10px' }
    ],
    squid: [
      { x: -16, y: -12, start: 0.02, duration: 0.22, cycleDuration: 54, phase: 0.02, scale: 0.56, rotation: 6, opacity: 0.15, tier: 'background', parallaxX: '1vw', parallaxY: '-12px' },
      { x: -12, y: 10, start: 0.22, duration: 0.24, cycleDuration: 54, phase: 0.22, scale: 0.64, rotation: 11, opacity: 0.18, parallaxX: '2vw', parallaxY: '-10px' },
      { x: -18, y: 52, start: 0.42, duration: 0.26, cycleDuration: 54, phase: 0.42, scale: 0.78, rotation: 9, opacity: 0.24, parallaxX: '1.8vw', parallaxY: '-8px' },
      { x: -10, y: 86, start: 0.62, duration: 0.28, cycleDuration: 54, phase: 0.62, scale: 0.74, rotation: 18, opacity: 0.2, parallaxX: '1.8vw', parallaxY: '-8px' },
      { x: -14, y: 110, start: 0.82, duration: 0.3, cycleDuration: 54, phase: 0.82, scale: 0.9, rotation: 11, opacity: 0.29, parallaxX: '1.5vw', parallaxY: '-10px' }
    ]
  }
};

const getMigrationBlueprintSet = (host) => {
  if (
    host &&
    host.hasAttribute('data-migration-host') &&
    !host.hasAttribute('data-bottom-encounter')
  ) {
    return compactHeroMigrationQuery.matches
      ? heroMigrationBlueprints.compact
      : heroMigrationBlueprints.wide;
  }

  return migrationBlueprints;
};

const buildMigrationScene = (scene, sceneIndex) => {
  const field = scene.querySelector('[data-migration-field]');

  if (!field) {
    return null;
  }

  field.replaceChildren();
  const host = scene.closest('[data-bottom-encounter], [data-migration-host]') || scene;
  const blueprintSet = getMigrationBlueprintSet(host);
  const isHeroHost =
    host.hasAttribute('data-migration-host') &&
    !host.hasAttribute('data-bottom-encounter');
  const random = createSeededRandom(60231 + (sceneIndex * 97));
  const creatureEntries = [];

  const createCreature = (type, base) => {
    const positionJitterX = isHeroHost ? [-4.4, 4.4] : [-5.5, 5.8];
    const positionJitterY = isHeroHost ? [-12.6, 12.9] : [-8.5, 8.8];
    const positionBoundsX = isHeroHost ? [-28, 128] : [5, 95];
    const positionBoundsY = isHeroHost ? [-30, 114] : [6, 94];
    const driftXRange = isHeroHost
      ? (type === 'whale' ? [3.2, 6.2] : [3.8, 7.2])
      : (type === 'whale' ? [4.5, 9] : [5.2, 11]);
    const driftYRange = isHeroHost ? [4.8, 9.2] : [3, 7];
    const driftRotationRange = isHeroHost ? [1.1, 5.4] : [0.6, 4.8];
    const driftDurationRange = isHeroHost ? [42, 64] : [24, 38];
    const start = clamp(base.start + randomBetween(random, -0.036, 0.046), 0.01, 0.92);
    const duration = clamp(base.duration + randomBetween(random, -0.04, 0.07), 0.18, 0.42);
    const scale = clamp(base.scale + randomBetween(random, -0.08, 0.1), 0.5, type === 'whale' ? 1.18 : 1.16);
    const rotation = base.rotation + randomBetween(random, -4.5, 5.5);
    const opacity = clamp(base.opacity + randomBetween(random, -0.04, 0.06), 0.14, 0.52);
    const x = clamp(base.x + randomBetween(random, positionJitterX[0], positionJitterX[1]), positionBoundsX[0], positionBoundsX[1]);
    const y = clamp(base.y + randomBetween(random, positionJitterY[0], positionJitterY[1]), positionBoundsY[0], positionBoundsY[1]);
    const stretchX = clamp(randomBetween(random, 0.92, type === 'whale' ? 1.1 : 1.14), 0.9, 1.16);
    const stretchY = clamp(randomBetween(random, 0.9, type === 'whale' ? 1.06 : 1.12), 0.88, 1.14);
    const mirror = isHeroHost
      ? 1
      : (
        typeof base.mirror === 'number'
          ? base.mirror
          : (random() > (type === 'whale' ? 0.91 : 0.78) ? -1 : 1)
      );
    const creature = document.createElement('div');
    const body = document.createElement('div');
    const media = document.createElement('img');
    const asset = migrationAssets[type];
    const parallaxXDirection = type === 'whale' ? -1 : 1;
    const parallaxYDirection = typeof base.parallaxY === 'string' && base.parallaxY.trim().startsWith('-') ? -1 : 1;
    const driftX = `${randomBetween(random, driftXRange[0], driftXRange[1]).toFixed(2)}vw`;
    const driftY = `${randomBetween(random, driftYRange[0], driftYRange[1]).toFixed(2)}vh`;
    const driftRotation = `${randomBetween(random, driftRotationRange[0], driftRotationRange[1]).toFixed(2)}deg`;
    const driftDurationValue = isHeroHost && typeof base.cycleDuration === 'number'
      ? base.cycleDuration
      : randomBetween(random, driftDurationRange[0], driftDurationRange[1]);
    const driftDuration = `${driftDurationValue.toFixed(2)}s`;
    const driftDelay = isHeroHost && typeof base.phase === 'number'
      ? `${(-driftDurationValue * base.phase).toFixed(2)}s`
      : `${randomBetween(random, -16, -0.5).toFixed(2)}s`;
    const entryX = `${((type === 'whale' ? 1 : -1) * randomBetween(random, 10, 18)).toFixed(2)}vw`;
    const entryY = `${randomBetween(random, -6, 6).toFixed(2)}vh`;
    const entryRotation = `${randomBetween(random, type === 'whale' ? -10 : -14, type === 'whale' ? 13 : 18).toFixed(2)}deg`;
    const parallaxX = `${(parallaxXDirection * randomBetween(random, 1.8, 4.8)).toFixed(2)}vw`;
    const parallaxY = `${(parallaxYDirection * randomBetween(random, 1.4, 4.4)).toFixed(2)}vh`;
    const travelX = isHeroHost
      ? `${((type === 'whale' ? -1 : 1) * randomBetween(random, 142, 168)).toFixed(2)}vw`
      : '0vw';
    const depth = Math.round((scale * 100) + (opacity * 40) + (type === 'whale' ? 8 : 0));

    creature.className = `bottom-encounter__creature bottom-encounter__creature--${type}`;
    creature.setAttribute('aria-hidden', 'true');

    if (base.tier === 'background') {
      creature.classList.add('bottom-encounter__creature--background');
    }

    creature.style.left = `${x.toFixed(2)}%`;
    creature.style.top = `${y.toFixed(2)}%`;
    creature.style.zIndex = String(depth);
    creature.style.setProperty('--creature-progress', reducedMotionQuery.matches ? '1' : '0');
    creature.style.setProperty('--creature-scale', scale.toFixed(4));
    creature.style.setProperty('--creature-opacity', opacity.toFixed(4));
    creature.style.setProperty('--creature-rotation', `${rotation.toFixed(2)}deg`);
    creature.style.setProperty('--creature-stretch-x', stretchX.toFixed(4));
    creature.style.setProperty('--creature-stretch-y', stretchY.toFixed(4));
    creature.style.setProperty('--creature-entry-x', entryX);
    creature.style.setProperty('--creature-entry-y', entryY);
    creature.style.setProperty('--creature-entry-rotation', entryRotation);
    creature.style.setProperty('--creature-parallax-x', parallaxX);
    creature.style.setProperty('--creature-parallax-y', parallaxY);
    creature.style.setProperty('--creature-drift-x', driftX);
    creature.style.setProperty('--creature-drift-y', driftY);
    creature.style.setProperty('--creature-drift-rotation', driftRotation);
    creature.style.setProperty('--creature-drift-duration', driftDuration);
    creature.style.setProperty('--creature-drift-delay', driftDelay);
    creature.style.setProperty('--creature-travel-x', travelX);
    creature.style.setProperty('--creature-mirror', String(mirror));

    if (isHeroHost) {
      const applyHeroTraversalCycle = () => {
        const heroRandom = Math.random;
        const defaultHeroDirection = type === 'whale' ? -1 : 1;
        const reverseHeroChance = type === 'whale' ? 0.2 : 0.18;
        const heroTravelDirection = heroRandom() < reverseHeroChance
          ? (defaultHeroDirection * -1)
          : defaultHeroDirection;
        const heroBaseX = heroTravelDirection === defaultHeroDirection
          ? base.x
          : (100 - base.x);
        const heroXJitter = type === 'whale'
          ? [-3.2, 3.2]
          : [-4.4, 4.4];
        const heroX = heroBaseX + randomBetween(heroRandom, heroXJitter[0], heroXJitter[1]);
        const heroYMinOffset = type === 'whale'
          ? (base.y < 40 ? -15.4 : -10.8)
          : -6.8;
        const heroYMaxOffset = type === 'whale'
          ? (base.y < 40 ? 13.6 : 9.8)
          : 6.8;
        const heroY = clamp(
          base.y + randomBetween(heroRandom, heroYMinOffset, heroYMaxOffset),
          -30,
          120
        );
        const heroScale = clamp(
          base.scale + randomBetween(heroRandom, type === 'whale' ? -0.2 : -0.18, type === 'whale' ? 0.28 : 0.22),
          type === 'whale' ? 0.34 : 0.4,
          type === 'whale' ? 1.34 : 1.18
        );
        const heroOpacity = clamp(
          base.opacity + randomBetween(heroRandom, type === 'whale' ? -0.08 : -0.09, type === 'whale' ? 0.2 : 0.16),
          0.06,
          type === 'whale' ? 0.56 : 0.48
        );
        const heroRotation = base.rotation + randomBetween(heroRandom, -3.2, 3.2);
        const heroStretchX = clamp(randomBetween(heroRandom, 0.96, type === 'whale' ? 1.08 : 1.12), 0.94, 1.14);
        const heroStretchY = clamp(randomBetween(heroRandom, 0.95, type === 'whale' ? 1.05 : 1.09), 0.93, 1.12);
        const heroDriftX = `${randomBetween(heroRandom, type === 'whale' ? 2.8 : 3.2, type === 'whale' ? 5.2 : 6.2).toFixed(2)}vw`;
        const heroDriftY = `${randomBetween(heroRandom, 4.6, 8.8).toFixed(2)}vh`;
        const heroDriftRotation = `${randomBetween(heroRandom, 1.1, 5.2).toFixed(2)}deg`;
        const heroTravelX = `${(heroTravelDirection * randomBetween(heroRandom, 128, 148)).toFixed(2)}vw`;
        const heroMirror = type === 'whale'
          ? (heroTravelDirection === 1 ? -1 : 1)
          : (heroTravelDirection === -1 ? -1 : 1);
        const heroVisibility = clamp((heroOpacity - 0.06) / (type === 'whale' ? 0.5 : 0.42), 0, 1);
        const heroBrightness = (
          (type === 'whale' ? 1.02 : 1.01) +
          (heroVisibility * (type === 'whale' ? 0.56 : 0.48)) +
          randomBetween(heroRandom, -0.03, 0.08)
        );
        const heroContrast = (
          (type === 'whale' ? 1.08 : 1.06) +
          (heroVisibility * 0.2) +
          randomBetween(heroRandom, -0.02, 0.04)
        );
        const heroCoreGlow = clamp(0.12 + (heroVisibility * 0.46) + randomBetween(heroRandom, -0.02, 0.04), 0.1, 0.68);
        const heroMidGlow = clamp(0.08 + (heroVisibility * 0.24) + randomBetween(heroRandom, -0.02, 0.03), 0.06, 0.4);
        const heroOuterGlow = clamp(0.06 + (heroVisibility * 0.16) + randomBetween(heroRandom, -0.01, 0.03), 0.05, 0.28);

        creature.style.left = `${heroX.toFixed(2)}%`;
        creature.style.top = `${heroY.toFixed(2)}%`;
        creature.style.setProperty('--creature-scale', heroScale.toFixed(4));
        creature.style.setProperty('--creature-opacity', heroOpacity.toFixed(4));
        creature.style.setProperty('--creature-rotation', `${heroRotation.toFixed(2)}deg`);
        creature.style.setProperty('--creature-stretch-x', heroStretchX.toFixed(4));
        creature.style.setProperty('--creature-stretch-y', heroStretchY.toFixed(4));
        creature.style.setProperty('--creature-drift-x', heroDriftX);
        creature.style.setProperty('--creature-drift-y', heroDriftY);
        creature.style.setProperty('--creature-drift-rotation', heroDriftRotation);
        creature.style.setProperty('--creature-travel-x', heroTravelX);
        creature.style.setProperty('--creature-hero-brightness', heroBrightness.toFixed(4));
        creature.style.setProperty('--creature-hero-contrast', heroContrast.toFixed(4));
        creature.style.setProperty('--creature-hero-core-glow', heroCoreGlow.toFixed(4));
        creature.style.setProperty('--creature-hero-mid-glow', heroMidGlow.toFixed(4));
        creature.style.setProperty('--creature-hero-outer-glow', heroOuterGlow.toFixed(4));
        creature.style.setProperty('--creature-mirror', String(heroMirror));
      };

      applyHeroTraversalCycle();
      body.addEventListener('animationiteration', applyHeroTraversalCycle);
    }

    body.className = 'bottom-encounter__creature-body';
    media.className = 'bottom-encounter__creature-media';
    media.src = asset.src;
    media.width = asset.width;
    media.height = asset.height;
    media.alt = '';
    media.loading = 'lazy';
    media.decoding = 'async';
    media.draggable = false;
    body.appendChild(media);
    creature.appendChild(body);

    return {
      depth,
      duration,
      element: creature,
      start
    };
  };

  blueprintSet.whale.forEach((blueprint) => {
    creatureEntries.push(createCreature('whale', blueprint));
  });

  blueprintSet.squid.forEach((blueprint) => {
    creatureEntries.push(createCreature('squid', blueprint));
  });

  creatureEntries
    .sort((left, right) => left.depth - right.depth)
    .forEach(({ element }) => {
      field.appendChild(element);
    });

  return {
    creatures: creatureEntries.map(({ duration, element, start }) => ({
      duration,
      element,
      start
    })),
    host
  };
};

const migrationScenes = Array.from(document.querySelectorAll('[data-migration-scene]'));

const hydrateMigrationScene = (scene, sceneIndex) => {
  const state = buildMigrationScene(scene, sceneIndex);

  if (!state) {
    return;
  }

  if (
    state.host.hasAttribute('data-migration-host') &&
    !state.host.hasAttribute('data-bottom-encounter')
  ) {
    state.host.style.setProperty('--bottom-encounter-progress', '0.5000');
    state.host.style.setProperty('--bottom-encounter-whale', '1');
    state.host.style.setProperty('--bottom-encounter-squid', '1');

    state.creatures.forEach((creatureState) => {
      creatureState.element.style.setProperty('--creature-progress', '1');
    });
  }

  migrationSceneStates.set(state.host, state);
};

migrationScenes.forEach((scene, sceneIndex) => {
  hydrateMigrationScene(scene, sceneIndex);
});

const rehydrateHeroMigrationScenes = () => {
  migrationScenes.forEach((scene, sceneIndex) => {
    const host = scene.closest('[data-bottom-encounter], [data-migration-host]') || scene;

    if (
      !host.hasAttribute('data-migration-host') ||
      host.hasAttribute('data-bottom-encounter')
    ) {
      return;
    }

    hydrateMigrationScene(scene, sceneIndex);
  });
};

addMediaQueryChangeListener(compactHeroMigrationQuery, rehydrateHeroMigrationScenes);

document.querySelectorAll('[data-bottom-encounter]').forEach((scene) => {
  registerScrollScene(scene, (element, progress) => {
    const whale = clamp((progress - 0.02) / 0.64, 0, 1);
    const squid = clamp((progress - 0.16) / 0.36, 0, 1);

    element.style.setProperty('--bottom-encounter-progress', progress.toFixed(4));
    element.style.setProperty('--bottom-encounter-whale', whale.toFixed(4));
    element.style.setProperty('--bottom-encounter-squid', squid.toFixed(4));

    const migrationState = migrationSceneStates.get(element);

    if (migrationState) {
      const migrationProgress = reducedMotionQuery.matches ? 1 : progress;

      migrationState.creatures.forEach((creatureState) => {
        const creatureProgress = clamp(
          (migrationProgress - creatureState.start) / creatureState.duration,
          0,
          1
        );

        creatureState.element.style.setProperty('--creature-progress', creatureProgress.toFixed(4));
      });
    }

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
    const scene = button.closest('[data-sonar-host]');

    if (!scene) {
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
