(() => {
  const container = document.querySelector('.book-preview-trigger');
  const book = container?.querySelector('.book');
  const modalElement = document.getElementById('bookPreviewModal');
  if (!container || !book || !modalElement || typeof bootstrap === 'undefined') return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const hasFinePointer = window.matchMedia('(pointer: fine)');
  const modal = new bootstrap.Modal(modalElement);
  const frame = modalElement.querySelector('[data-preview-frame]');
  const loading = modalElement.querySelector('[data-preview-loading]');
  const fallback = modalElement.querySelector('[data-preview-fallback]');
  const previewLinks = modalElement.querySelectorAll('[data-book-preview-link]');
  const readerRevealDelay = 1800;
  let readerRevealTimer;
  let readerLoaded = false;
  let opening = false;
  let lastFocusedElement = null;
  let localizedBookId = container.dataset.defaultBookId || 'B0GV3V9YDK';
  let linksConfigReady;
  let previewTranslations = {};

  const reset = () => {
    book.style.transform = '';
  };

  const getLocalizedBookId = () => {
    return localizedBookId;
  };

  const buildPreviewUrl = (bookId) => `https://read.amazon.com/sample/${bookId}?clientId=share`;

  const updatePreviewLinks = () => {
    const previewUrl = buildPreviewUrl(getLocalizedBookId());
    container.setAttribute('href', previewUrl);
    container.dataset.previewUrl = previewUrl;
    previewLinks.forEach((link) => {
      link.setAttribute('href', previewUrl);
    });
  };

  const getTranslationValue = (path) => (
    path.split('.').reduce((value, part) => value && value[part], previewTranslations)
  );

  const updatePreviewCopy = () => {
    modalElement.querySelectorAll('[data-translation^="bookPreview."]').forEach((element) => {
      const value = getTranslationValue(element.dataset.translation);
      if (value !== undefined) {
        element.innerHTML = value;
      }
    });

    const triggerLabel = getTranslationValue(container.dataset.previewAriaLabel);
    if (triggerLabel) {
      container.setAttribute('aria-label', triggerLabel);
    }

    const frameTitlePath = frame?.dataset.previewTitle;
    const frameTitle = frameTitlePath ? getTranslationValue(frameTitlePath) : null;
    if (frameTitle) {
      frame.setAttribute('title', frameTitle);
    }
  };

  const loadPreviewTranslations = async () => {
    try {
      const language = document.documentElement.lang || 'en';
      const cacheVersion = window.timelessStoriesI18nCacheVersion || '20260913-volume-map-i18n';
      const response = await fetch(`js/i18n/lang-${language}.min.json?v=${cacheVersion}`);
      const languageData = await response.json();
      previewTranslations = languageData?.translations || {};
      updatePreviewCopy();
    } catch (error) {
      updatePreviewCopy();
    }
  };

  const loadLocalizedBookId = async () => {
    try {
      const response = await fetch('js/data/links.min.json');
      const linkData = await response.json();
      const language = document.documentElement.lang;
      localizedBookId =
        linkData?.localized?.[language]?.book
        || linkData?.localized?.default?.book
        || localizedBookId;
      updatePreviewLinks();
    } catch (error) {
      updatePreviewLinks();
    }
  };

  container.addEventListener('pointermove', (event) => {
    if (!hasFinePointer.matches || event.pointerType !== 'mouse' || reducedMotion.matches) return;
    const bounds = container.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width * 2 - 1;
    const y = (event.clientY - bounds.top) / bounds.height * 2 - 1;
    book.style.transform = `rotateY(${x * 4}deg) rotateX(${-y * 4}deg)`;
  });

  container.addEventListener('pointerleave', reset);
  reducedMotion.addEventListener('change', reset);

  const hideLoading = () => {
    if (loading) {
      loading.hidden = true;
    }
  };

  const showFallback = () => {
    if (readerLoaded) return;
    hideLoading();
    if (fallback) {
      fallback.hidden = false;
    }
  };

  const resetReader = () => {
    window.clearTimeout(readerRevealTimer);
    readerLoaded = false;
    if (frame) {
      frame.removeAttribute('src');
      frame.classList.remove('is-loaded');
    }
    if (loading) {
      loading.hidden = false;
    }
    if (fallback) {
      fallback.hidden = true;
    }
  };

  const revealReader = () => {
    readerLoaded = true;
    window.clearTimeout(readerRevealTimer);
    hideLoading();
    if (fallback) {
      fallback.hidden = true;
    }
    if (frame) {
      frame.classList.add('is-loaded');
    }
  };

  const loadReader = async () => {
    if (linksConfigReady) {
      await linksConfigReady;
    }
    updatePreviewLinks();
    const previewUrl = container.dataset.previewUrl;

    if (!frame || !previewUrl) {
      showFallback();
      return;
    }

    resetReader();
    frame.addEventListener('load', revealReader, { once: true });
    frame.addEventListener('error', showFallback, { once: true });
    frame.setAttribute('src', previewUrl);
    readerRevealTimer = window.setTimeout(revealReader, readerRevealDelay);
  };

  const animateCoverOpen = () => new Promise((resolve) => {
    if (reducedMotion.matches) {
      window.setTimeout(resolve, 80);
      return;
    }

    const bounds = book.getBoundingClientRect();
    const clone = document.createElement('div');
    const bookClone = book.cloneNode(true);
    const startX = bounds.left + bounds.width / 2 - window.innerWidth / 2;
    const startY = bounds.top + bounds.height / 2 - window.innerHeight / 2;

    clone.className = 'book-preview-cover-clone';
    clone.style.left = 'calc(50% - 100px)';
    clone.style.top = 'calc(50% - 160px)';
    clone.style.setProperty('--book-preview-start-x', `${startX}px`);
    clone.style.setProperty('--book-preview-start-y', `${startY}px`);
    clone.style.setProperty('--book-preview-scale', `${bounds.width / 200}`);
    clone.appendChild(bookClone);
    document.body.appendChild(clone);

    clone.addEventListener('animationend', () => {
      clone.remove();
      resolve();
    }, { once: true });

    window.setTimeout(() => {
      if (document.body.contains(clone)) {
        clone.remove();
        resolve();
      }
    }, 900);
  });

  const openPreview = async (event) => {
    event.preventDefault();
    if (opening) return;
    opening = true;
    lastFocusedElement = document.activeElement;
    container.setAttribute('aria-expanded', 'true');
    reset();
    await animateCoverOpen();
    await loadReader();
    modal.show();
    opening = false;
  };

  container.addEventListener('click', openPreview);
  window.addEventListener('translationsLoaded', (event) => {
    previewTranslations = event.detail?.translations || previewTranslations;
    updatePreviewLinks();
    updatePreviewCopy();
  });
  linksConfigReady = loadLocalizedBookId();
  loadPreviewTranslations();
  updatePreviewLinks();

  modalElement.addEventListener('hidden.bs.modal', () => {
    container.setAttribute('aria-expanded', 'false');
    resetReader();
    if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
      lastFocusedElement.focus({ preventScroll: true });
    } else {
      container.focus({ preventScroll: true });
    }
  });
})();
