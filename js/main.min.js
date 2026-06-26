"use strict";

function runWhenVisible(element, callback, options = {}) {
    if (!element || typeof callback !== "function") {
        return;
    }

    if (!("IntersectionObserver" in window)) {
        callback();
        return;
    }

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                observer.disconnect();
                callback();
            }
        });
    }, options);

    observer.observe(element);
}

function debugLazyLoad(message, data) {
    const debugEnabled =
        new URLSearchParams(window.location.search).has("debugLazy") ||
        window.localStorage?.getItem("debugLazy") === "1";

    if (debugEnabled) {
        console.info(`[lazy-load] ${message}`, data || "");
    }
}

function runLazyScriptQueue(scripts, options = {}) {
    const queue = scripts
        .filter(({ id, target }) => !document.getElementById(id) && target);

    if (!queue.length) {
        debugLazyLoad("No scripts queued");
        return;
    }

    debugLazyLoad("Watching scripts", queue.map(({ id }) => id));

    if (!("IntersectionObserver" in window)) {
        debugLazyLoad("IntersectionObserver unavailable; loading scripts now");
        queue.forEach(({ config }) => injectScriptOnce(config));
        return;
    }

    const callbacks = new Map(queue.map(({ target, config }) => [target, config]));
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) {
                return;
            }

            const config = callbacks.get(entry.target);
            if (!config) {
                return;
            }

            callbacks.delete(entry.target);
            observer.unobserve(entry.target);
            debugLazyLoad("Loading script", config.id);
            injectScriptOnce(config);

            if (!callbacks.size) {
                debugLazyLoad("All queued scripts loaded; observer disconnected");
                observer.disconnect();
            }
        });
    }, options);

    callbacks.forEach((config, target) => observer.observe(target));
}

function injectScriptOnce({ id, src, async = true, defer = false }) {
    if (id && document.getElementById(id)) {
        return;
    }

    const script = document.createElement("script");
    if (id) {
        script.id = id;
    }

    script.src = src;
    script.async = async;
    script.defer = defer;
    document.body.appendChild(script);
}

function loadWidgetOnIdle(callback, timeout = 1500) {
    if ("requestIdleCallback" in window) {
        window.requestIdleCallback(callback, { timeout });
        return;
    }

    window.setTimeout(callback, 1);
}

function initializePageDimensions() {
    const windowHeight = window.innerHeight;
    const headerHeight = document.querySelector("#header")?.offsetHeight || 0;
    const fitscreen = windowHeight - headerHeight;

    document.querySelectorAll(".fullscreen").forEach((el) => {
        el.style.height = `${windowHeight}px`;
    });

    document.querySelectorAll(".fitscreen").forEach((el) => {
        el.style.height = `${fitscreen}px`;
    });
}

function initUserLinks() {
    document.querySelectorAll(".user").forEach((link) => {
        link.addEventListener("click", (e) => {
            e.preventDefault();
        });
    });
}

function animateScroll(targetScroll, duration) {
    const startScroll = window.scrollY;
    const distance = targetScroll - startScroll;
    const startTime = performance.now();

    function easeInOutExpo(t) {
        return t === 0 ? 0 : t === 1 ? 1 : t < 0.5 ? Math.pow(2, 20 * t - 10) / 2 : (2 - Math.pow(2, -20 * t + 10)) / 2;
    }

    function scroll(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const ease = easeInOutExpo(progress);

        window.scrollTo(0, startScroll + distance * ease);

        if (progress < 1) {
            requestAnimationFrame(scroll);
        }
    }

    requestAnimationFrame(scroll);
}

function getFixedHeaderOffset() {
    const header = document.getElementById("header");
    const navbar = header?.querySelector(".navbar");
    return navbar?.offsetHeight || header?.offsetHeight || 0;
}

function scrollToTarget(target, duration = 1500) {
    const targetTop = Math.max(
        target.getBoundingClientRect().top + window.scrollY - getFixedHeaderOffset(),
        0
    );
    animateScroll(targetTop, duration);
}

function initSmoothScroll() {
    document.querySelectorAll(".nav-link, .scrollto").forEach((link) => {
        link.addEventListener("click", function (e) {
            try {
                const href = this.getAttribute("href");
                if (!href || !href.startsWith("#")) {
                    return;
                }

                if (this.getAttribute("data-bs-toggle") === "modal") {
                    return;
                }

                const target = document.getElementById(href.substring(1));
                if (!target) {
                    return;
                }

                e.preventDefault();

                document.querySelectorAll(".nav-link.active").forEach((el) => {
                    el.classList.remove("active");
                });

                this.classList.add("active");

                const navbarCollapse = document.querySelector(".navbar-collapse");
                if (navbarCollapse && navbarCollapse.classList.contains("show")) {
                    const collapseInstance =
                        bootstrap.Collapse.getInstance(navbarCollapse) ||
                        new bootstrap.Collapse(navbarCollapse, { toggle: false });

                    navbarCollapse.addEventListener(
                        "hidden.bs.collapse",
                        () => scrollToTarget(target),
                        { once: true }
                    );
                    collapseInstance.hide();
                    return;
                }

                scrollToTarget(target);
            } catch (err) {
                console.error("Smooth scroll error:", err);
            }
        });
    });
}

function handleInitialHash() {
    if (!window.location.hash) {
        return;
    }

    window.setTimeout(() => {
        const target = document.querySelector(window.location.hash);
        if (!target) {
            return;
        }

        scrollToTarget(target, 1000);
    }, 0);
}

function initHeaderScroll() {
    const header = document.getElementById("header");
    if (!header) {
        return;
    }

    let ticking = false;

    const updateHeader = () => {
        header.classList.toggle("header-scrolled", window.scrollY > 100);
        ticking = false;
    };

    window.addEventListener("scroll", () => {
        if (ticking) {
            return;
        }

        ticking = true;
        requestAnimationFrame(updateHeader);
    }, { passive: true });

    requestAnimationFrame(updateHeader);
}

function initCarouselControls() {
    document.querySelectorAll(".carousel-control-prev, .carousel-control-next").forEach((control) => {
        control.addEventListener("click", function (e) {
            e.preventDefault();
            const carouselId = this.getAttribute("href") || this.getAttribute("data-bs-target");
            if (!carouselId) {
                return;
            }

            const carousel = document.querySelector(carouselId);
            if (!carousel) {
                return;
            }

            const direction = this.classList.contains("carousel-control-next") ? "next" : "prev";
            const BootstrapCarousel = window.bootstrap?.Carousel;
            if (!BootstrapCarousel) {
                return;
            }

            const bsCarousel = BootstrapCarousel.getOrCreateInstance(carousel);
            bsCarousel[direction]?.();
        });
    });
}

function initCollapseHandlers() {
    const collapseEl = document.getElementById("moreAuthorsCollapse");
    const btnReadMore = document.getElementById("btnReadMore");

    if (!collapseEl || !btnReadMore || typeof translations === "undefined") {
        return;
    }

    collapseEl.addEventListener("show.bs.collapse", () => {
        btnReadMore.textContent = translations.readLess;
    });

    collapseEl.addEventListener("hide.bs.collapse", () => {
        btnReadMore.textContent = translations.readMore;
    });
}

function initNavbarToggleState() {
    const navbarMenu = document.getElementById("navbarMenu");
    const navbarToggler = document.querySelector(".navbar-toggler");

    if (!navbarMenu || !navbarToggler) {
        return;
    }

    const syncExpandedState = () => {
        const isExpanded = navbarMenu.classList.contains("show");
        navbarToggler.setAttribute("aria-expanded", String(isExpanded));
    };

    navbarMenu.addEventListener("show.bs.collapse", () => {
        navbarToggler.setAttribute("aria-expanded", "true");
    });

    navbarMenu.addEventListener("hide.bs.collapse", () => {
        navbarToggler.setAttribute("aria-expanded", "false");
    });

    syncExpandedState();
}

function initLazyLoadScripts() {
    runLazyScriptQueue([
        {
            id: "g_translate",
            target: document.getElementById("google_translate_element"),
            config: {
                id: "g_translate",
                src: "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"
            }
        }
    ], { rootMargin: "300px 0px" });
}

const reviewsDataUrl = "js/data/reviews.min.json?v=20260626-readers-count";
let seriesReviews = [];
let seriesRatings = [];
let seriesReaders = null;
let currentReviewsCarouselMode;

async function loadSeriesReviews() {
    const response = await fetch(reviewsDataUrl);
    const data = await response.json();
    seriesReviews = Array.isArray(data?.reviews) ? data.reviews : [];
    seriesRatings = Array.isArray(data?.ratings) ? data.ratings : [];
    seriesReaders = data?.readers && Number(data.readers.count) ? data.readers : null;
}

function escapeHtml(value = "") {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function getReviewItemsPerSlide() {
    if (typeof getItemsPerSlide === "function") {
        return getItemsPerSlide();
    }

    return window.innerWidth < 768 ? 1 : window.innerWidth < 992 ? 2 : 3;
}

function getReviewTranslation(key, fallback) {
    const reviewTranslations =
        typeof translations !== "undefined" && translations?.reviews
            ? translations.reviews
            : {};

    return reviewTranslations[key] || fallback;
}

function getBaseTranslation(key, fallback) {
    return typeof translations !== "undefined" && translations?.[key]
        ? translations[key]
        : fallback;
}

function getReviewLocale() {
    const pageLanguage = document.documentElement.lang || navigator.language || "en";

    if (pageLanguage.startsWith("en")) {
        return "en-US";
    }

    return pageLanguage;
}

function formatReviewDate(date) {
    try {
        return new Intl.DateTimeFormat(getReviewLocale(), {
            day: "numeric",
            month: "long",
            timeZone: "UTC",
            year: "numeric"
        }).format(new Date(`${date}T00:00:00Z`));
    } catch (error) {
        return date;
    }
}

function formatReviewCountry(countryCode) {
    try {
        return new Intl.DisplayNames([getReviewLocale()], { type: "region" }).of(countryCode);
    } catch (error) {
        return countryCode;
    }
}

function getReviewEditionFlag(editionKey) {
    return editionKey === "spanishEdition" ? "🇪🇸" : "🇺🇸";
}

function formatReviewEdition(review) {
    const book = getReviewTranslation(review.bookKey, review.bookKey === "book2" ? "Book 2" : "Book 1");

    return `${book} ${getReviewEditionFlag(review.editionKey)} - ${formatReviewCountry(review.country)}`;
}

function formatReviewRating(value) {
    return Number(value).toFixed(1);
}

function formatReviewNumber(value) {
    try {
        return new Intl.NumberFormat(getReviewLocale()).format(value);
    } catch (error) {
        return String(value);
    }
}

function getSeriesRatingsSummary() {
    const totalRatings = seriesRatings.reduce((sum, item) => sum + Number(item.count || 0), 0);
    const weightedRating = seriesRatings.reduce(
        (sum, item) => sum + Number(item.rating || 0) * Number(item.count || 0),
        0
    );

    return {
        count: totalRatings,
        rating: totalRatings ? weightedRating / totalRatings : 0
    };
}

function formatRatingsCount(count) {
    const template = getReviewTranslation(
        "ratingsCountTemplate",
        "{count} global ratings across series editions"
    );

    return template.replace("{count}", formatReviewNumber(count));
}

function formatReadersCount(count) {
    const template = getReviewTranslation(
        "readersCountTemplate",
        "{count}+ readers across the series"
    );

    return template.replace("{count}", formatReviewNumber(count));
}

function formatRatingAriaLabel(rating) {
    const template = getReviewTranslation(
        "ratingAriaLabel",
        "Average rating {rating} out of 5 stars"
    );

    return template.replace("{rating}", formatReviewRating(rating));
}

function renderReviewsSummary() {
    if (!seriesRatings.length) {
        return;
    }

    const averageRating = document.getElementById("reviewsAverageRating");
    const ratingsCount = document.getElementById("reviewsRatingsCount");
    const ratingsContainer = document.getElementById("reviewsEditionRatings");
    const readers = document.getElementById("reviewsReaders");
    const score = document.getElementById("reviewsScore");
    const summary = getSeriesRatingsSummary();
    const formattedRating = formatReviewRating(summary.rating);

    if (averageRating) {
        averageRating.textContent = formattedRating;
    }

    if (ratingsCount) {
        ratingsCount.textContent = formatRatingsCount(summary.count);
    }

    if (score) {
        score.setAttribute("aria-label", formatRatingAriaLabel(summary.rating));
    }

    if (ratingsContainer) {
        ratingsContainer.innerHTML = seriesRatings
            .map((item) => {
                const book = getReviewTranslation(item.bookKey, item.bookKey === "book2" ? "Book 2" : "Book 1");

                return `<span>${escapeHtml(book)} ${getReviewEditionFlag(item.editionKey)}: ${escapeHtml(formatReviewRating(item.rating))} (${escapeHtml(item.count)})</span>`;
            })
            .join("");
    }

    if (readers && seriesReaders?.count) {
        readers.textContent = formatReadersCount(seriesReaders.count);
    }
}

function getReviewExcerpt(text) {
    return text.length > 170 ? `${text.slice(0, 167).trim()}...` : text;
}

function getSortedSeriesReviews() {
    return seriesReviews
        .map((review, index) => ({ ...review, sourceIndex: index }))
        .sort((first, second) => {
            const dateDiff = new Date(`${second.date}T00:00:00Z`) - new Date(`${first.date}T00:00:00Z`);
            return dateDiff || first.sourceIndex - second.sourceIndex;
        });
}

function renderReviewCard(review, index, itemsPerSlide) {
    const columnClass = itemsPerSlide === 1 ? "col-12" : itemsPerSlide === 2 ? "col-12 col-md-6" : "col-12 col-lg-4";
    const initial = escapeHtml(review.author.charAt(0));
    const reviewIndex = review.sourceIndex ?? index;

    return `
      <div class="${columnClass} review-slide-card">
        <article class="review-card h-100">
          <header class="review-author">
            <span class="review-avatar" aria-hidden="true">${initial}</span>
            <div>
              <h3>${escapeHtml(review.author)}</h3>
              <p>${escapeHtml(formatReviewDate(review.date))}</p>
            </div>
          </header>
          <div class="review-stars" aria-label="5 out of 5 stars">
            <span aria-hidden="true">&#9733;&#9733;&#9733;&#9733;&#9733;</span>
          </div>
          <p class="review-edition">${escapeHtml(formatReviewEdition(review))}</p>
          <h4>${escapeHtml(review.title)}</h4>
          <p class="review-text" data-review-excerpt="${escapeHtml(getReviewExcerpt(review.text))}">${escapeHtml(getReviewExcerpt(review.text))}</p>
          <button
            class="review-toggle"
            type="button"
            data-bs-toggle="modal"
            data-bs-target="#reviewModal"
            data-review-index="${reviewIndex}"
          >${escapeHtml(getReviewTranslation("readMore", getBaseTranslation("readMore", "Read more")))}</button>
          <footer>
            <span class="review-amazon-icon" aria-hidden="true">a</span>
            <span>${escapeHtml(getReviewTranslation("postedOn", "Posted on"))} <a href="${escapeHtml(review.href)}" target="_blank" rel="noopener noreferrer">Amazon</a></span>
          </footer>
        </article>
      </div>
    `;
}

function renderReviewsCarousel() {
    const carousel = document.getElementById("reviewsCarousel");
    const inner = document.getElementById("reviewsCarouselInner");

    if (!carousel || !inner) {
        return;
    }

    if (!seriesReviews.length) {
        inner.innerHTML = "";
        return;
    }

    renderReviewsSummary();

    const itemsPerSlide = getReviewItemsPerSlide();
    const BootstrapCarousel = window.bootstrap?.Carousel;
    const existingCarousel = BootstrapCarousel?.getInstance(carousel);

    if (existingCarousel) {
        existingCarousel.dispose();
    }

    const slides = [];

    const sortedReviews = getSortedSeriesReviews();

    for (let index = 0; index < sortedReviews.length; index += itemsPerSlide) {
        const group = sortedReviews.slice(index, index + itemsPerSlide);
        slides.push(`
          <div class="carousel-item ${index === 0 ? "active" : ""}">
            <div class="row justify-content-center g-4">
              ${group.map((review, offset) => renderReviewCard(review, index + offset, itemsPerSlide)).join("")}
            </div>
          </div>
        `);
    }

    inner.innerHTML = slides.join("");

    if (BootstrapCarousel) {
        new BootstrapCarousel(carousel, { interval: false, ride: false, wrap: true });
    }
}

function initReviewsWidget() {
    currentReviewsCarouselMode = getReviewItemsPerSlide();

    loadSeriesReviews()
        .then(() => {
            renderReviewsSummary();
            renderReviewsCarousel();
        })
        .catch((error) => {
            console.error("Error loading reviews:", error);
        });

    window.addEventListener("resize", () => {
        const nextMode = getReviewItemsPerSlide();

        if (nextMode === currentReviewsCarouselMode) {
            return;
        }

        currentReviewsCarouselMode = nextMode;
        renderReviewsCarousel();
    });

    window.addEventListener("translationsLoaded", () => {
        renderReviewsSummary();
        renderReviewsCarousel();
    });

    document.getElementById("reviewsCarousel")?.addEventListener("click", (event) => {
        const button = event.target.closest(".review-toggle");

        if (!button || window.bootstrap?.Modal) {
            return;
        }

        const review = seriesReviews[Number(button.dataset.reviewIndex)];
        const card = button.closest(".review-card");
        const reviewText = card?.querySelector(".review-text");

        if (!review || !reviewText) {
            return;
        }

        const expanded = card.classList.toggle("is-expanded");
        reviewText.textContent = expanded ? review.text : reviewText.dataset.reviewExcerpt;
        button.textContent = expanded
            ? getReviewTranslation("readLess", getBaseTranslation("readLess", "Read less"))
            : getReviewTranslation("readMore", getBaseTranslation("readMore", "Read more"));
    });

    const modal = document.getElementById("reviewModal");
    const title = document.getElementById("reviewModalTitle");
    const author = document.getElementById("reviewModalAuthor");
    const text = document.getElementById("reviewModalText");
    const link = document.getElementById("reviewModalLink");

    if (!modal || !title || !author || !text || !link || typeof bootstrap === "undefined") {
        return;
    }

    modal.addEventListener("show.bs.modal", (event) => {
        const index = Number(event.relatedTarget?.dataset.reviewIndex);
        const review = seriesReviews[index];

        if (!review) {
            event.preventDefault();
            return;
        }

        title.textContent = review.title;
        author.textContent = `${review.author} - ${formatReviewDate(review.date)} - ${formatReviewEdition(review)}`;
        text.textContent = review.text;
        link.href = review.href;
    });
}

function googleTranslateElementInit() {
    if (typeof google === "undefined" || !google.translate) {
        return;
    }

    new google.translate.TranslateElement({
        pageLanguage: "en",
        includedLanguages: "nl,de,it,en,pt,pl",
        autoDisplay: false,
        layout: google.translate.TranslateElement.InlineLayout.SIMPLE
    }, "google_translate_element");
}

function setCurrentYear() {
    const dateEl = document.getElementById("sDate");
    if (dateEl) {
        dateEl.textContent = new Date().getFullYear();
    }
}

function initTikTokEmbed() {
    const tiktokContainer = document.getElementById("tiktok-container");
    if (!tiktokContainer) {
        return;
    }

    const embedHTML = `
    <blockquote class="tiktok-embed" cite="https://www.tiktok.com/@federicostories/video/7152795728778185990" data-video-id="7152795728778185990" style="max-width: 605px;min-width: 325px;">
      <section>
        <a target="_blank" title="@federicostories" href="https://www.tiktok.com/@federicostories?refer=embed">@federicostories</a>
        Many years ago, the <a title="blackknight" target="_blank" href="https://www.tiktok.com/tag/blackknight?refer=embed">#blackknight</a> returned to <a title="elsalvador" target="_blank" href="https://www.tiktok.com/tag/elsalvador?refer=embed">#ElSalvador</a>. He wanted to test the Salvadorans' greed. He gave them all their wishes, but the cost was their <a title="souls" target="_blank" href="https://www.tiktok.com/tag/souls?refer=embed">#souls</a>.
      </section>
    </blockquote>`;

    const loadTikTokEmbed = () => {
        runWhenVisible(tiktokContainer, () => {
            tiktokContainer.innerHTML = embedHTML;
            injectScriptOnce({
                id: "tiktok_embed",
                src: "https://www.tiktok.com/embed.js"
            });
        }, { rootMargin: "0px" });
    };

    const onFirstScroll = () => {
        window.removeEventListener("scroll", onFirstScroll);
        loadTikTokEmbed();
    };

    if (window.scrollY > 0) {
        loadTikTokEmbed();
        return;
    }

    window.addEventListener("scroll", onFirstScroll, { passive: true, once: true });
}

function initDeferredCookiebot() {
    loadWidgetOnIdle(() => {
        if (document.getElementById("Cookiebot")) {
            return;
        }

        const script = document.createElement("script");
        script.id = "Cookiebot";
        script.src = "https://consent.cookiebot.com/uc.js";
        script.type = "text/javascript";
        script.async = true;
        script.defer = true;
        script.setAttribute("data-cbid", "78149afe-6653-4dcf-80de-2ef63de89ffc");
        script.setAttribute("data-blockingmode", "auto");
        document.head.appendChild(script);
    }, 1200);
}

function initDeferredAnalytics() {
    loadWidgetOnIdle(() => {
        debugLazyLoad("Loading analytics loader", "ga_loader");
        injectScriptOnce({
            id: "ga_loader",
            src: "js/gAnalyticsLoad.min.js",
            async: true,
            defer: true
        });
    });
}

function initMobileMenuOutsideClose() {
    const navbarMenu = document.getElementById("navbarMenu");
    const navbarToggler = document.querySelector(".navbar-toggler");

    if (!navbarMenu || !navbarToggler || typeof bootstrap === "undefined") {
        return;
    }

    document.addEventListener("click", (e) => {
        if (!navbarMenu.classList.contains("show")) {
            return;
        }

        const clickedInsideMenu = navbarMenu.contains(e.target);
        const clickedToggler = navbarToggler.contains(e.target);

        if (!clickedInsideMenu && !clickedToggler) {
            const collapseInstance =
                bootstrap.Collapse.getInstance(navbarMenu) ||
                new bootstrap.Collapse(navbarMenu, { toggle: false });

            collapseInstance.hide();
        }
    });
}

function initMobileMenuHideOnScroll() {
    const navbarMenu = document.getElementById("navbarMenu");

    if (!navbarMenu || typeof bootstrap === "undefined") {
        return;
    }

    let lastScrollY = window.scrollY;

    window.addEventListener("scroll", () => {
        if (!navbarMenu.classList.contains("show")) {
            lastScrollY = window.scrollY;
            return;
        }

        const currentScrollY = window.scrollY;
        if (Math.abs(currentScrollY - lastScrollY) > 10) {
            const collapseInstance =
                bootstrap.Collapse.getInstance(navbarMenu) ||
                new bootstrap.Collapse(navbarMenu, { toggle: false });

            collapseInstance.hide();
        }

        lastScrollY = currentScrollY;
    }, { passive: true });
}

function initContentModal() {
    const modalElement = document.getElementById("contentModal");
    const modalTitle = document.getElementById("contentModalTitle");
    const modalBody = document.getElementById("contentModalBody");
    const massMediaSection = document.getElementById("mass-media");
    const massMediaContainer = massMediaSection?.querySelector(".container");
    const institutionalRecords = document.querySelector(".institutional-records");

    if (
        !modalElement ||
        !modalBody ||
        !modalTitle ||
        !massMediaContainer ||
        !institutionalRecords ||
        typeof bootstrap === "undefined"
    ) {
        return;
    }

    const createExternalLink = (href, label, className = "content-modal-list-link") => {
        const link = document.createElement("a");
        link.href = href;
        link.className = className;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.innerHTML = label;
        return link;
    };

    const buildInternationalPresenceList = () => {
        const list = document.createElement("ul");
        list.className = "content-modal-list";

        massMediaContainer.querySelectorAll("#mMediaCarouselInner a[href]").forEach((cardLink) => {
            const text = cardLink.querySelector(".card-text")?.innerHTML?.trim();
            if (!text) {
                return;
            }

            const item = document.createElement("li");
            item.appendChild(createExternalLink(cardLink.href, text));
            list.appendChild(item);
        });

        return list;
    };

    const buildInstitutionalRecordsList = () => {
        const list = document.createElement("ul");
        list.className = "content-modal-list";

        institutionalRecords.querySelectorAll(".institutional-record-card").forEach((card) => {
            const country = card.querySelector(".institutional-record-country")?.textContent?.trim();
            const titleElement = card.querySelector(".institutional-record-title");
            const link = card.querySelector(".institutional-record-link[href]");
            const title = titleElement?.innerHTML?.trim();

            if (!country || !title || !link) {
                return;
            }

            const item = document.createElement("li");
            item.appendChild(createExternalLink(link.href, `${country}: ${title}`));
            list.appendChild(item);
        });

        return list;
    };

    const getModalContent = (target) => {
        if (target === "international-presence") {
            return buildInternationalPresenceList();
        }

        if (target === "institutional-records") {
            return buildInstitutionalRecordsList();
        }

        return null;
    };

    modalElement.addEventListener("show.bs.modal", (event) => {
        const trigger = event.relatedTarget;
        const target = trigger?.dataset.contentModalTarget;
        const content = getModalContent(target);

        if (!trigger || !content || !content.children.length) {
            event.preventDefault();
            return;
        }

        modalBody.replaceChildren(content);
        modalTitle.textContent = trigger.textContent.trim();
    });

    document.querySelectorAll("[data-content-modal-target]").forEach((trigger) => {
        trigger.classList.add("modal-trigger-title");
        trigger.setAttribute("aria-haspopup", "dialog");
    });

    modalElement.addEventListener("hidden.bs.modal", () => {
        modalBody.innerHTML = "";
    });
}

function applyFloatingCookieBannerLayout() {
    const banner = document.getElementById("cookiebanner") || document.getElementById("CybotCookiebotDialog");

    if (!banner) {
        return false;
    }

    const mobileLayout = window.innerWidth <= 767;
    const edgeInset = mobileLayout ? "12px" : "16px";

    banner.style.setProperty("position", "fixed", "important");
    banner.style.setProperty("left", edgeInset, "important");
    banner.style.setProperty("right", edgeInset, "important");
    banner.style.setProperty("bottom", edgeInset, "important");
    banner.style.setProperty("top", "auto", "important");
    banner.style.setProperty("width", "auto", "important");
    banner.style.setProperty("max-width", "1120px", "important");
    banner.style.setProperty("margin", "0 auto", "important");
    banner.style.setProperty("z-index", "2147483000", "important");

    return true;
}

function initCookieBannerObserver() {
    const syncBannerLayout = () => {
        if (!applyFloatingCookieBannerLayout()) {
            return;
        }

        window.requestAnimationFrame(() => {
            window.requestAnimationFrame(initializePageDimensions);
        });
    };

    syncBannerLayout();

    const observer = new MutationObserver(() => {
        syncBannerLayout();
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["style", "class"]
    });

    window.addEventListener("resize", syncBannerLayout);
}

document.addEventListener("DOMContentLoaded", () => {
    initializePageDimensions();
    initUserLinks();
    initSmoothScroll();
    handleInitialHash();
    initHeaderScroll();
    initCarouselControls();
    initCollapseHandlers();
    initNavbarToggleState();
    initLazyLoadScripts();
    initReviewsWidget();
    initDeferredCookiebot();
    initDeferredAnalytics();
    setCurrentYear();
    initTikTokEmbed();
    initMobileMenuOutsideClose();
    initMobileMenuHideOnScroll();
    initContentModal();
    initCookieBannerObserver();
});

window.addEventListener("resize", initializePageDimensions);

window.requestAnimationFrame(() => {
    window.requestAnimationFrame(initializePageDimensions);
});

if (document.fonts?.ready) {
    document.fonts.ready
        .then(() => {
            window.requestAnimationFrame(initializePageDimensions);
        })
        .catch(() => {});
}

const initialHeroImage = document.querySelector("#div-book img");
if (initialHeroImage && !initialHeroImage.complete) {
    initialHeroImage.addEventListener("load", initializePageDimensions, { once: true });
}
