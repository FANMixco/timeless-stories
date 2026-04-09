"use strict";

// Initialize page dimensions and heights
function initializePageDimensions() {
    const windowHeight = window.innerHeight;
    const headerHeight = document.querySelector("#header")?.offsetHeight || 0;
    const fitscreen = windowHeight - headerHeight;

    document.querySelectorAll(".fullscreen").forEach(el => {
        el.style.height = windowHeight + "px";
    });

    document.querySelectorAll(".fitscreen").forEach(el => {
        el.style.height = fitscreen + "px";
    });
}

// Prevent default on user links
function initUserLinks() {
    document.querySelectorAll('.user').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
        });
    });
}

// Smooth scroll for nav links
function initSmoothScroll() {
    document.querySelectorAll('.nav-link, .scrollto').forEach(link => {
        link.addEventListener('click', function(e) {
            try {
                const href = this.getAttribute('href');
                if (href.startsWith('#')) {
                    const targetId = href.substring(1);
                    const target = document.getElementById(targetId);
                    
                    if (target) {
                        e.preventDefault();
                        
                        let topSpace = 0;
                        const header = document.getElementById('header');
                        if (header) {
                            topSpace = header.offsetHeight;
                        }

                        const targetTop = target.offsetTop - topSpace;
                        animateScroll(targetTop, 1500);

                        // Update active menu item
                        document.querySelectorAll('.nav-link.active').forEach(el => {
                            el.classList.remove('active');
                        });
                        
                        this.classList.add('active');

                        // Close mobile nav after click
                        const navbarCollapse = document.querySelector('.navbar-collapse');
                        if (navbarCollapse && navbarCollapse.classList.contains('show')) {
                            const navbarToggler = document.querySelector('.navbar-toggler');
                            navbarToggler.click();
                        }
                    }
                }
            } catch (err) {
                console.error('Smooth scroll error:', err);
            }
        });
    });
}

// Smooth scroll animation
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

// Handle initial hash navigation
function handleInitialHash() {
    if (window.location.hash) {
        setTimeout(() => {
            const target = document.querySelector(window.location.hash);
            if (target) {
                const topSpace = document.getElementById('header')?.offsetHeight || 0;
                const targetTop = target.offsetTop - topSpace;
                animateScroll(targetTop, 1000);
            }
        }, 0);
    }
}

// Header scroll effect
function initHeaderScroll() {
    window.addEventListener('scroll', () => {
        const header = document.getElementById('header');
        if (header) {
            if (window.scrollY > 100) {
                header.classList.add('header-scrolled');
            } else {
                header.classList.remove('header-scrolled');
            }
        }
    });
}

// Initialize carousel controls (ensure Bootstrap carousel navigation works)
function initCarouselControls() {
    document.querySelectorAll('.carousel-control-prev, .carousel-control-next').forEach(control => {
        control.addEventListener('click', function(e) {
            e.preventDefault();
            const carouselId = this.getAttribute('href') || this.getAttribute('data-bs-target');
            if (carouselId) {
                const carousel = document.querySelector(carouselId);
                if (carousel) {
                    const direction = this.classList.contains('carousel-control-next') ? 'next' : 'prev';
                    const bsCarousel = new (window.bootstrap || {}).Carousel(carousel, {});
                    if (bsCarousel) {
                        bsCarousel[direction]?.();
                    }
                }
            }
        });
    });
}

// Handle collapse state changes
function initCollapseHandlers() {
    const collapseEl = document.getElementById('moreAuthorsCollapse');
    const btnReadMore = document.getElementById('btnReadMore');

    if (collapseEl && btnReadMore && typeof translations !== 'undefined') {
        collapseEl.addEventListener('show.bs.collapse', () => {
            btnReadMore.textContent = translations.readLess;
        });

        collapseEl.addEventListener('hide.bs.collapse', () => {
            btnReadMore.textContent = translations.readMore;
        });
    }
}

// Lazy load review script
function initLazyLoadScripts() {
    window.addEventListener('scroll', () => {
        const scroll = window.scrollY;
        const pageHeight = getHeight();

        // Load reviews script at 55% scroll
        if (scroll > pageHeight * 0.55) {
            const aReviews = document.getElementById('aReviews');
            if (aReviews && aReviews.innerHTML === "") {
                const script = document.createElement('script');
                script.src = 'https://apps.elfsight.com/p/platform.js';
                document.body.appendChild(script);
            }
        }

        // Load Google Translate at 70% scroll
        if (scroll > pageHeight * 0.7) {
            if (!document.getElementById('g_translate')) {
                const script = document.createElement('script');
                script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
                script.id = 'g_translate';
                document.body.appendChild(script);
            }
        }
    });
}

// Google Translate initialization
function googleTranslateElementInit() {
    if (typeof google !== 'undefined' && google.translate) {
        new google.translate.TranslateElement({
            pageLanguage: 'en',
            includedLanguages: 'nl,de,it,en,pt',
            autoDisplay: false,
            layout: google.translate.TranslateElement.InlineLayout.SIMPLE
        }, 'google_translate_element');
    }
}

// Get page height
function getHeight() {
    const body = document.body;
    const html = document.documentElement;

    return Math.max(
        body.scrollHeight,
        body.offsetHeight,
        html.clientHeight,
        html.scrollHeight,
        html.offsetHeight,
        body.getBoundingClientRect().height
    );
}

// Set current year in footer
function setCurrentYear() {
    const dateEl = document.getElementById("sDate");
    if (dateEl) {
        dateEl.textContent = new Date().getFullYear();
    }
}

// TikTok embed lazy loading
function initTikTokEmbed() {
    const tiktokContainer = document.getElementById("tiktok-container");
    
    if (!tiktokContainer) return;

    const embedHTML = `
    <blockquote class="tiktok-embed" cite="https://www.tiktok.com/@federicostories/video/7152795728778185990" data-video-id="7152795728778185990" style="max-width: 605px;min-width: 325px;">
      <section>
        <a target="_blank" title="@federicostories" href="https://www.tiktok.com/@federicostories?refer=embed">@federicostories</a>
        Many years ago, the <a title="blackknight" target="_blank" href="https://www.tiktok.com/tag/blackknight?refer=embed">#blackknight</a> 🗡️ returned to <a title="elsalvador" target="_blank" href="https://www.tiktok.com/tag/elsalvador?refer=embed">#ElSalvador</a>. He wanted to test the Salvadorans' greed. He gave them all their wishes, but the cost was their <a title="souls" target="_blank" href="https://www.tiktok.com/tag/souls?refer=embed">#souls</a>! 👻 ...
      </section>
    </blockquote>`;

    let scriptLoaded = false;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !scriptLoaded) {
                tiktokContainer.innerHTML = embedHTML;

                const script = document.createElement('script');
                script.src = 'https://www.tiktok.com/embed.js';
                script.async = true;
                document.body.appendChild(script);

                scriptLoaded = true;
                observer.disconnect();
            }
        });
    });

    observer.observe(tiktokContainer);
}

// Initialize everything when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    initializePageDimensions();
    initUserLinks();
    initSmoothScroll();
    handleInitialHash();
    initHeaderScroll();
    initCarouselControls();
    initCollapseHandlers();
    initLazyLoadScripts();
    setCurrentYear();
    initTikTokEmbed();
});

// Reinitialize dimensions on window resize
window.addEventListener('resize', initializePageDimensions);
