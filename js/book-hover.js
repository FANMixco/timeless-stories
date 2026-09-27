(() => {
  const triggers = document.querySelectorAll('.book-preview-trigger');
  const container = document.querySelector('.book-preview-trigger');
  const book = container?.querySelector('.book');
  const modalElement = document.getElementById('bookPreviewModal');
  if (!triggers.length || !container || !modalElement) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const hasFinePointer = window.matchMedia('(pointer: fine)');
  const bootstrapModal = typeof bootstrap !== 'undefined'
    ? new bootstrap.Modal(modalElement)
    : null;
  let managedBackdrop = null;
  const frame = modalElement.querySelector('[data-preview-frame]');
  const loading = modalElement.querySelector('[data-preview-loading]');
  const fallback = modalElement.querySelector('[data-preview-fallback]');
  const previewLinks = modalElement.querySelectorAll('[data-book-preview-link]');
  const shareButton = document.querySelector('[data-book-preview-share]');
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

  const handleHidden = () => {
    triggers.forEach((trigger) => trigger.setAttribute('aria-expanded', 'false'));
    resetReader();
    if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
      lastFocusedElement.focus({ preventScroll: true });
    } else {
      container.focus({ preventScroll: true });
    }
  };

  const showModal = () => {
    if (bootstrapModal) {
      bootstrapModal.show();
      return;
    }

    managedBackdrop = document.createElement('div');
    managedBackdrop.className = 'modal-backdrop fade show book-preview-managed-backdrop';
    document.body.appendChild(managedBackdrop);
    document.body.classList.add('modal-open');
    modalElement.style.display = 'block';
    modalElement.removeAttribute('aria-hidden');
    modalElement.classList.add('show');
    modalElement.focus();
  };

  const hideModal = () => {
    if (bootstrapModal) {
      bootstrapModal.hide();
      return;
    }

    modalElement.classList.remove('show');
    modalElement.style.display = 'none';
    modalElement.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
    managedBackdrop?.remove();
    managedBackdrop = null;
    handleHidden();
  };

  const getLocalizedBookId = () => {
    return localizedBookId;
  };

  const buildPreviewUrl = (bookId) => `https://read.amazon.com/sample/${bookId}?clientId=share`;

  const updatePreviewLinks = () => {
    const previewUrl = buildPreviewUrl(getLocalizedBookId());
    triggers.forEach((trigger) => {
      if (trigger.tagName === 'A') {
        trigger.setAttribute('href', previewUrl);
      }
      trigger.dataset.previewUrl = previewUrl;
    });
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
      triggers.forEach((trigger) => {
        if (trigger.dataset.previewAriaLabel) {
          trigger.setAttribute('aria-label', triggerLabel);
        }
      });
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
    if (!book) return;
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
    const previewUrl = buildPreviewUrl(getLocalizedBookId());

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

  const animateCoverOpen = (trigger) => new Promise((resolve) => {
    const sourceBook = trigger.querySelector('.book');
    if (!sourceBook || reducedMotion.matches) {
      window.setTimeout(resolve, 80);
      return;
    }

    const bounds = sourceBook.getBoundingClientRect();
    const clone = document.createElement('div');
    const bookClone = sourceBook.cloneNode(true);
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

  const openPreview = async (event, trigger = event.currentTarget) => {
    event.preventDefault();
    event.stopPropagation();
    if (opening) return;
    opening = true;
    lastFocusedElement = document.activeElement;
    triggers.forEach((item) => item.setAttribute('aria-expanded', 'true'));
    reset();
    await animateCoverOpen(trigger);
    await loadReader();
    showModal();
    opening = false;
  };

  window.timelessStoriesOpenBookPreview = openPreview;

  const handlePreviewTriggerEvent = (event) => {
    const target = event.target.nodeType === Node.ELEMENT_NODE
      ? event.target
      : event.target.parentElement;
    const trigger = target?.closest('.book-preview-trigger');
    if (!trigger) return;
    openPreview(event, trigger);
  };

  document.addEventListener('click', handlePreviewTriggerEvent);
  document.addEventListener('pointerup', handlePreviewTriggerEvent);

  shareButton?.addEventListener('click', async () => {
    updatePreviewLinks();
    const previewUrl = buildPreviewUrl(getLocalizedBookId());
    const title = getTranslationValue('bookPreview.title') || document.title;

    if (navigator.share) {
      try {
        await navigator.share({ title, url: previewUrl });
        return;
      } catch (error) {
        if (error?.name === 'AbortError') return;
      }
    }

    try {
      await navigator.clipboard.writeText(previewUrl);
    } catch (error) {
      window.open(previewUrl, '_blank', 'noopener,noreferrer');
    }
  });

  window.addEventListener('translationsLoaded', (event) => {
    previewTranslations = event.detail?.translations || previewTranslations;
    updatePreviewLinks();
    updatePreviewCopy();
  });
  linksConfigReady = loadLocalizedBookId();
  loadPreviewTranslations();
  updatePreviewLinks();

  modalElement.addEventListener('hidden.bs.modal', handleHidden);
  modalElement.querySelectorAll('[data-bs-dismiss="modal"]').forEach((button) => {
    button.addEventListener('click', hideModal);
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && modalElement.classList.contains('show')) {
      hideModal();
    }
  });
})();
