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

function initSmoothScroll() {
    document.querySelectorAll(".nav-link, .scrollto").forEach((link) => {
        link.addEventListener("click", function (e) {
            try {
                const href = this.getAttribute("href");
                if (!href || !href.startsWith("#")) {
                    return;
                }

                const target = document.getElementById(href.substring(1));
                if (!target) {
                    return;
                }

                e.preventDefault();

                const header = document.getElementById("header");
                const topSpace = header ? header.offsetHeight : 0;
                const targetTop = target.offsetTop - topSpace;
                animateScroll(targetTop, 1500);

                document.querySelectorAll(".nav-link.active").forEach((el) => {
                    el.classList.remove("active");
                });

                this.classList.add("active");

                const navbarCollapse = document.querySelector(".navbar-collapse");
                if (navbarCollapse && navbarCollapse.classList.contains("show")) {
                    document.querySelector(".navbar-toggler")?.click();
                }
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

        const topSpace = document.getElementById("header")?.offsetHeight || 0;
        animateScroll(target.offsetTop - topSpace, 1000);
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
            id: "elfsight_platform",
            target: document.getElementById("aReviews"),
            config: {
                id: "elfsight_platform",
                src: "https://apps.elfsight.com/p/platform.js"
            }
        },
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

function googleTranslateElementInit() {
    if (typeof google === "undefined" || !google.translate) {
        return;
    }

    new google.translate.TranslateElement({
        pageLanguage: "en",
        includedLanguages: "nl,de,it,en,pt",
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
    initDeferredAnalytics();
    setCurrentYear();
    initTikTokEmbed();
    initMobileMenuOutsideClose();
    initMobileMenuHideOnScroll();
    initContentModal();
});

window.addEventListener("resize", initializePageDimensions);
