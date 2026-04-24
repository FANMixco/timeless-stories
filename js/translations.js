let nLang = (
  navigator.languages
    ? navigator.languages[0]
    : navigator.language || navigator.userLanguage
).split("-")[0];

let supportedLang = ["en", "es", "zh", "fr"];
let translations;
const lang = supportedLang.includes(nLang) ? nLang : "en";
const bookCoverBasePath = "img/cover-colorized-v2-sm";
const localizedBookCoverLanguages = new Set(["es"]);

async function fetchTranslationData(url) {
  try {
    const response = await fetch(url);
    return await response.json();
  } catch (error) {
    console.error("Error loading JSON:", error);
    throw error;
  }
}

function setDeferredFrameSource(frameId, src) {
  const frame = document.getElementById(frameId);
  if (!frame || !src) return;

  const assignSource = () => {
    if (!frame.getAttribute("src")) {
      frame.setAttribute("src", src);
    }
  };

  if (!("IntersectionObserver" in window)) {
    assignSource();
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        observer.disconnect();
        assignSource();
      }
    });
  }, { rootMargin: "250px 0px" });

  observer.observe(frame);
}

function updateLocalizedBookCover(language) {
  const webpSource = document.getElementById("bookCoverWebpSource");
  const jpegSource = document.getElementById("bookCoverJpgSource");
  const coverImage = document.getElementById("bookCoverImage");

  if (!webpSource || !jpegSource || !coverImage) return;

  const suffix = localizedBookCoverLanguages.has(language) ? `-${language}` : "";
  const jpegPath = `${bookCoverBasePath}${suffix}.jpg`;
  const webpPath = `${bookCoverBasePath}${suffix}.webp`;
  const altText = translations?.bookCoverAlt || translations?.introSM || coverImage.alt;

  webpSource.setAttribute("srcset", webpPath);
  jpegSource.setAttribute("srcset", jpegPath);
  coverImage.setAttribute("src", jpegPath);
  coverImage.setAttribute("alt", altText);
}

function getTranslationValue(obj, path) {
  return path.split(".").reduce((acc, part) => acc && acc[part], obj);
}

function applyTranslations() {
  document.querySelectorAll("[data-translation]").forEach((item) => {
    const value = getTranslationValue(translations, item.dataset.translation);
    if (value !== undefined) {
      item.innerHTML = value;
    }
  });
}

const carouselCards = [
  {
    edition: "edition4",
    text: "edition5",
    price: "price1",
    href: "https://a.co/d/hIKdELB",
    itemClass: "col-12 col-md-6 col-lg-4",
    desktopBottomClass: "",
    mobileBottomClass: "eBPrice",
    leftClass: "row",
    rightClass: "row-auto",
  },
  {
    edition: "edition2",
    text: "edition3",
    price: "price2",
    href: "https://a.co/d/0euSZ7mF",
    itemClass: "col-12 col-md-6 col-lg-4",
    desktopBottomClass: "price-bottom-r",
    mobileBottomClass: "eBPriceR",
    leftClass: "row",
    rightClass: "row-auto",
  },
  {
    edition: "edition6",
    text: "edition7",
    price: "price3",
    href: "https://a.co/d/0euSZ7mF",
    itemClass: "col-12 col-md-6 col-lg-4 d-none d-lg-block",
    desktopBottomClass: "",
    mobileBottomClass: "eBPrice",
    leftClass: "row",
    rightClass: "row-auto",
  },
  {
    edition: "edition10",
    text: "edition11",
    price: "price5",
    href: "https://a.co/d/0euSZ7mF",
    itemClass: "col-12 col-md-6 col-lg-4 d-none d-lg-block",
    desktopBottomClass: "",
    mobileBottomClass: "eBPrice",
    leftClass: "row",
    rightClass: "row-auto",
  },
];

const carouselCards2 = [
  {
    edition: "old4",
    href: "https://a.co/d/00fMsc8u",
  },
  {
    edition: "old5",
    href: "https://a.co/d/0c8GXXKx",
  },
  {
    edition: "old1",
    href: "https://a.co/d/bdxy6Bz",
  },
  {
    edition: "old2",
    href: "https://a.co/d/5VsAmsE",
  },
  {
    edition: "old3",
    href: "https://a.co/d/7pP9HgH",
  },
];

const massMediaCards = [
  {
    text: "mMedia3",
    href: "https://diarioelsalvador.com/salvadoreno-participo-en-feria-de-libro-en-madrid/369897/",
    imageBase: "img/fair/diario_el_salvador_2",
    alt: "diario el salvador",
  },
  {
    text: "mMedia4",
    href: "https://bit.ly/3QiEzgF",
    imageBase: "img/fair/pulgarcito",
    alt: "pulgarcito",
  },
  {
    text: "mMedia1",
    href: "https://rree.gob.sv/embajada-de-el-salvador-en-austria-apoya-obra-de-escritor-salvadoreno-en-feria-del-libro-en-viena/",
    imageBase: "img/fair/buch_viena",
    alt: "buch viena",
  },
  {
    text: "mMedia2",
    href: "https://diarioelsalvador.com/el-narrador-de-historias-magicas-de-cuscatlan/15042",
    imageBase: "img/fair/diario_el_salvador",
    alt: "diario el salvador",
  },
];

const availabilityDate = new Date(2026, 4, 1, 0, 0, 0);
let availabilityCountdownInterval;

function getCountdownText(key, fallback) {
  return translations?.[key] || fallback;
}

function updateAvailabilityCountdown() {
  const countdowns = document.querySelectorAll(".availability-countdown");
  if (!countdowns.length) return;

  const remaining = availabilityDate.getTime() - Date.now();
  const isAvailable = remaining <= 0;
  const safeRemaining = Math.max(remaining, 0);
  const dayMs = 24 * 60 * 60 * 1000;
  const hourMs = 60 * 60 * 1000;
  const minuteMs = 60 * 1000;
  const days = Math.floor(safeRemaining / dayMs);
  const hours = Math.floor((safeRemaining % dayMs) / hourMs);
  const minutes = Math.floor((safeRemaining % hourMs) / minuteMs);
  const seconds = Math.floor((safeRemaining % minuteMs) / 1000);

  countdowns.forEach((countdown) => {
    countdown.classList.toggle("is-available", isAvailable);
    const status = countdown.querySelector(".availability-countdown-status");
    const timer = countdown.querySelector(".availability-countdown-timer");

    if (status) {
      status.innerHTML = isAvailable
        ? getCountdownText("countdownAvailable", "Fully available now")
        : getCountdownText("countdownIntro", "Fully available in");
    }

    if (timer) {
      timer.hidden = isAvailable;
    }

    [
      ["days", days],
      ["hours", hours],
      ["minutes", minutes],
      ["seconds", seconds],
    ].forEach(([unit, value]) => {
      const item = countdown.querySelector(`[data-countdown-unit="${unit}"]`);
      if (item) {
        item.textContent = String(value).padStart(unit === "days" ? 1 : 2, "0");
      }
    });
  });
}

function initAvailabilityCountdown() {
  if (availabilityCountdownInterval) {
    window.clearInterval(availabilityCountdownInterval);
  }

  updateAvailabilityCountdown();
  availabilityCountdownInterval = window.setInterval(updateAvailabilityCountdown, 1000);
}

function getItemsPerSlide() {
  return window.innerWidth < 768 ? 1 : 3;
}

function renderPriceCarousel() {
  const carouselElement = document.getElementById("priceCarousel");
  const carouselInner = document.getElementById("priceCarouselInner");

  if (!carouselElement || !carouselInner) return;

  const itemsPerSlide = getItemsPerSlide();
  const existingInstance = bootstrap.Carousel.getInstance(carouselElement);
  if (existingInstance) {
    existingInstance.dispose();
  }

  const slides = [];

  for (let i = 0; i < carouselCards.length; i += itemsPerSlide) {
    const group = carouselCards.slice(i, i + itemsPerSlide);

    slides.push(`
      <div class="carousel-item ${i === 0 ? "active" : ""}">
        <div class="row justify-content-center">
          ${group.map((card) => buildPriceCard(card, itemsPerSlide)).join("")}
        </div>
      </div>
    `);
  }

  function buildPriceCard(card, currentItemsPerSlide) {
    const colClass = currentItemsPerSlide === 1 ? "col-12" : "col-12 col-md-4";
    const bottomClass =
      currentItemsPerSlide === 1 ? card.mobileBottomClass : card.desktopBottomClass;

    return `
    <div class="${colClass}">
      <div class="single-price no-padding">
        <div class="price-top">
          <h4 data-translation="${card.edition}"></h4>
        </div>
        <p data-translation="${card.text}"></p>
        <div class="price-bottom ${bottomClass} row gx-3 gy-2 align-items-center justify-content-center">
          <div class="${card.leftClass}">
            <span class="h1" data-translation="${card.price}"></span>
          </div>
          <div class="${card.rightClass}">
            <a href="${card.href}" target="_blank" rel="noopener noreferrer" class="primary-btn" data-translation="editionP"></a>
          </div>
        </div>
      </div>
    </div>
  `;
  }

  carouselInner.innerHTML = slides.join("");

  if (typeof applyTranslations === "function") {
    applyTranslations();
  }

  initAvailabilityCountdown();

  new bootstrap.Carousel(carouselElement, {
    interval: false,
    ride: false,
    wrap: true,
  });
}

function renderBooksCarousel() {
  const carouselElement = document.getElementById("booksCarousel");
  const carouselInner = document.getElementById("booksCarouselInner");

  if (!carouselElement || !carouselInner) return;

  const itemsPerSlide = getItemsPerSlide();
  const existingInstance = bootstrap.Carousel.getInstance(carouselElement);
  if (existingInstance) {
    existingInstance.dispose();
  }

  const slides = [];

  for (let i = 0; i < carouselCards2.length; i += itemsPerSlide) {
    const group = carouselCards2.slice(i, i + itemsPerSlide);

    slides.push(`
      <div class="carousel-item ${i === 0 ? "active" : ""}">
        <div class="row justify-content-center g-4">
          ${group.map((card) => buildBookCard(card, itemsPerSlide)).join("")}
        </div>
      </div>
    `);
  }

  function buildBookCard(card, currentItemsPerSlide) {
    const colClass = currentItemsPerSlide === 1 ? "col-12" : "col-12 col-md-4";

    return `
    <div class="${colClass}">
      <a class="book-card text-decoration-none d-block h-100" href="${card.href}" target="_blank" rel="noopener noreferrer">
        <div class="card h-100 text-center shadow-sm border-0">
          <div class="card-body d-flex flex-column justify-content-center">
            <i class="icon-download mb-3 fs-1" aria-hidden="true"></i>
            <p class="mb-0 fw-semibold" data-translation="${card.edition}"></p>
          </div>
        </div>
      </a>
    </div>`;
  }

  carouselInner.innerHTML = slides.join("");

  if (typeof applyTranslations === "function") {
    applyTranslations();
  }

  new bootstrap.Carousel(carouselElement, {
    interval: false,
    ride: false,
    wrap: true,
  });
}

function renderMassMediaCarousel() {
  const carouselElement = document.getElementById("mMediaCarousel");
  const carouselInner = document.getElementById("mMediaCarouselInner");

  if (!carouselElement || !carouselInner) return;

  const itemsPerSlide = getItemsPerSlide();
  const existingInstance = bootstrap.Carousel.getInstance(carouselElement);
  if (existingInstance) {
    existingInstance.dispose();
  }

  const slides = [];

  for (let i = 0; i < massMediaCards.length; i += itemsPerSlide) {
    const group = massMediaCards.slice(i, i + itemsPerSlide);

    slides.push(`
      <div class="carousel-item ${i === 0 ? "active" : ""}">
        <div class="row justify-content-center g-4">
          ${group.map((card) => buildMassMediaCard(card, itemsPerSlide)).join("")}
        </div>
      </div>
    `);
  }

  function buildMassMediaCard(card, currentItemsPerSlide) {
    const colClass = currentItemsPerSlide === 1
      ? "col-12 mMedia-container"
      : "col-12 col-md-4 mMedia-container";
    const cardClass = currentItemsPerSlide === 1 ? "card mx-3" : "card";
    const imageClass = currentItemsPerSlide === 1 ? "card-img-top img-fluid" : "card-img-top";
    const bodyClass = currentItemsPerSlide === 1 ? "card-body text-center font-weight-bold" : "card-body";

    return `
      <div class="${colClass}">
        <div class="${cardClass}">
          <a
            target="_blank"
            href="${card.href}"
            class="text-decoration-none text-dark d-block"
          >
            <picture>
              <source type="image/webp" srcset="${card.imageBase}.webp" />
              <source type="image/jpeg" srcset="${card.imageBase}.jpg" />
              <img
                class="${imageClass}"
                alt="${card.alt}"
                src="${card.imageBase}.jpg"
                loading="lazy"
              />
            </picture>
            <div class="${bodyClass}">
              <p class="card-text" data-translation="${card.text}"></p>
            </div>
          </a>
        </div>
      </div>`;
  }

  carouselInner.innerHTML = slides.join("");

  if (typeof applyTranslations === "function") {
    applyTranslations();
  }

  new bootstrap.Carousel(carouselElement, {
    interval: false,
    ride: false,
    wrap: true,
  });
}

let currentCarouselMode = getItemsPerSlide();

window.addEventListener("resize", () => {
  const newMode = getItemsPerSlide();

  if (newMode !== currentCarouselMode) {
    currentCarouselMode = newMode;
    renderPriceCarousel();
    renderBooksCarousel();
    renderMassMediaCarousel();
  }
});

fetchTranslationData(`js/i18n/lang-${lang}.min.json`)
  .then((data) => {
    translations = data.translations;

    document.title = translations.title;
    updateLocalizedBookCover(lang);

    if (lang === "es") {

      document
        .getElementById("btnEditor")
        .style.setProperty("display", "none", "important");

      document
        .getElementById("menuContactMe")
        .setAttribute(
          "href",
          "https://www.cognitoforms.com/FedericoNavarrete1/EntremosEnContactoHistoriasEternas",
        );
    }

    const validLinks = translations.links;

    setDeferredFrameSource(
      "bookPreviewFrame",
      `https://leer.amazon.es/kp/card?asin=${validLinks.book}&preview=inline&linkCode=kpe&ref_=cm_sw_r_kb_dp_HJ6YDMXY6BRE1FA9AWE3`,
    );
    setDeferredFrameSource(
      "preziPreviewFrame",
      `https://prezi.com/p/embed/${validLinks.prezi}`,
    );

    const contactModal = document.getElementById("mContactUs");
    renderPriceCarousel();
    renderBooksCarousel();
    renderMassMediaCarousel();
    applyTranslations();

    contactModal.addEventListener("show.bs.modal", () => {
      const cuScriptExist = document.getElementById("cu_script");

      if (!cuScriptExist) {
        const script = document.createElement("script");
        script.src = "https://www.cognitoforms.com/f/seamless.js";
        script.id = "cu_script";
        script.async = true;
        script.dataset.key = validLinks.contactUs.key;
        script.dataset.form = validLinks.contactUs.form;

        document.getElementById("divContactUs").appendChild(script);
      }
    }, { once: true });

    window.dispatchEvent(
      new CustomEvent("translationsLoaded", {
        detail: { lang, translations },
      }),
    );
  })
  .catch((e) => {
    console.error(e);
  });
