const supportedLang = ["en", "es", "fr", "zh"];
const languageStorageKey = "timelessStoriesOfficialLanguage";
let translations;
let linkRegistry;
let localizedLinks;
const browserLang = (
  navigator.languages
    ? navigator.languages[0]
    : navigator.language || navigator.userLanguage
).split("-")[0];
const storedLang = getStoredLanguage();
const lang = supportedLang.includes(storedLang)
  ? storedLang
  : supportedLang.includes(browserLang)
    ? browserLang
    : "en";
const bookCoverBasePath = "img/cover-colorized-v2-sm";
const localizedBookCoverLanguages = new Set(["es"]);

document.documentElement.lang = lang;

function getStoredLanguage() {
  try {
    return window.localStorage.getItem(languageStorageKey);
  } catch (error) {
    return null;
  }
}

function storeLanguage(language) {
  try {
    window.localStorage.setItem(languageStorageKey, language);
  } catch (error) {
    return;
  }
}

function initOfficialLanguageSelector() {
  const languageSelect = document.getElementById("officialLanguageSelect");
  if (!languageSelect) return;

  languageSelect.value = lang;
  languageSelect.addEventListener("change", () => {
    const selectedLanguage = languageSelect.value;
    if (
      !supportedLang.includes(selectedLanguage) ||
      selectedLanguage === lang
    ) {
      return;
    }

    storeLanguage(selectedLanguage);
    window.location.reload();
  });
}

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

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          observer.disconnect();
          assignSource();
        }
      });
    },
    { rootMargin: "250px 0px" },
  );

  observer.observe(frame);
}

function updateLocalizedBookCover(language) {
  const webpSource = document.getElementById("bookCoverWebpSource");
  const jpegSource = document.getElementById("bookCoverJpgSource");
  const coverImage = document.getElementById("bookCoverImage");

  if (!webpSource || !jpegSource || !coverImage) return;

  const suffix = localizedBookCoverLanguages.has(language)
    ? `-${language}`
    : "";
  const jpegPath = `${bookCoverBasePath}${suffix}.jpg`;
  const webpPath = `${bookCoverBasePath}${suffix}.webp`;
  const altText =
    translations?.bookCoverAlt || translations?.introSM || coverImage.alt;

  webpSource.setAttribute("srcset", webpPath);
  jpegSource.setAttribute("srcset", jpegPath);
  coverImage.setAttribute("src", jpegPath);
  coverImage.setAttribute("alt", altText);
}

function getTranslationValue(obj, path) {
  return path.split(".").reduce((acc, part) => acc && acc[part], obj);
}

function mergeLinkConfig(defaults, overrides = {}) {
  const merged = { ...defaults };

  Object.entries(overrides).forEach(([key, value]) => {
    const defaultValue = merged[key];
    const shouldMerge =
      value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      defaultValue &&
      typeof defaultValue === "object" &&
      !Array.isArray(defaultValue);

    merged[key] = shouldMerge ? mergeLinkConfig(defaultValue, value) : value;
  });

  return merged;
}

function getLinkValue(path) {
  return getTranslationValue(linkRegistry, path) || "#";
}

function getLocalizedLink(path) {
  return getTranslationValue(localizedLinks, path) || "#";
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
    href: "carouselCards.ebook",
    itemClass: "col-12 col-md-6 col-lg-4",
    desktopBottomClass: "",
    mobileBottomClass: "eBPrice",
    leftClass: "row-auto",
    rightClass: "row-auto",
  },
  {
    edition: "edition2",
    text: "edition3",
    price: "price2",
    href: "carouselCards.paperback",
    itemClass: "col-12 col-md-6 col-lg-4",
    desktopBottomClass: "price-bottom-r",
    mobileBottomClass: "eBPriceR",
    leftClass: "row-auto",
    rightClass: "row-auto",
  },
  {
    edition: "edition6",
    text: "edition7",
    price: "price3",
    href: "carouselCards.hardcover",
    itemClass: "col-12 col-md-6 col-lg-4 d-none d-lg-block",
    desktopBottomClass: "",
    mobileBottomClass: "eBPrice",
    leftClass: "row-auto",
    rightClass: "row-auto",
  },
  {
    edition: "edition10",
    text: "edition11",
    price: "price5",
    href: "carouselCards.audiobook",
    itemClass: "col-12 col-md-6 col-lg-4 d-none d-lg-block",
    desktopBottomClass: "",
    mobileBottomClass: "eBPrice",
    leftClass: "row-auto",
    rightClass: "row-auto",
  },
  {
    edition: "edition8",
    text: "edition9",
    price: "price4",
    href: "carouselCards.directorX",
    cta: "comingSoon",
    itemClass: "col-12 col-md-6 col-lg-4 d-none d-lg-block",
    desktopBottomClass: "price-bottom-x",
    mobileBottomClass: "eBPriceX",
    leftClass: "row-auto",
    rightClass: "row-auto",
  },
];

const carouselCards2 = [
  {
    edition: "old4",
    href: "shared.previousBooks.epiphanyEn",
  },
  {
    edition: "old5",
    href: "shared.previousBooks.epiphanyEs",
  },
  {
    edition: "old1",
    href: "shared.previousBooks.beginningEn",
  },
  {
    edition: "old2",
    href: "shared.previousBooks.beginningEs",
  },
  {
    edition: "old3",
    href: "shared.previousBooks.beginningFr",
  },
];

const massMediaCards = [
  {
    text: "mMedia11",
    href: "shared.massMedia.marruecos",
    imageBase: "img/fair/marruecos",
    alt: "marruecos",
  },
  {
    text: "mMedia5",
    href: "shared.massMedia.siel",
    imageBase: "img/fair/SIEL",
    alt: "siel",
  },
  {
    text: "mMedia9",
    href: "shared.massMedia.india",
    imageBase: "img/fair/india",
    alt: "india",
  },
  {
    text: "mMedia6",
    href: "shared.massMedia.turkiye",
    imageBase: "img/fair/turkey",
    alt: "turkey",
  },
  {
    text: "mMedia10",
    href: "shared.massMedia.consuladoEspana",
    imageBase: "img/fair/consulado_es",
    alt: "consulado españa",
  },
  {
    text: "mMedia3",
    href: "shared.massMedia.diarioMadrid",
    imageBase: "img/fair/diario_el_salvador_2",
    alt: "diario el salvador",
  },
  {
    text: "mMedia4",
    href: "shared.massMedia.pulgarcito",
    imageBase: "img/fair/pulgarcito",
    alt: "pulgarcito",
  },
  {
    text: "mMedia1",
    href: "shared.massMedia.buchWien",
    imageBase: "img/fair/buch_viena",
    alt: "buch viena",
  },
  {
    text: "mMedia2",
    href: "shared.massMedia.diarioAlemania",
    imageBase: "img/fair/diario_el_salvador",
    alt: "diario el salvador",
  },
  {
    text: "mMedia8",
    href: "shared.massMedia.embajadaAlemania",
    imageBase: "img/fair/diario_el_salvador",
    alt: "embajada alemania",
  },
  {
    text: "mMedia7",
    href: "shared.massMedia.exterior",
    imageBase: "img/fair/exterior",
    alt: "exterior",
  },
];

const institutionalRecordCards = [
  {
    country: "pCountry5",
    event: "event5",
    date: "institutionalDateMorocco",
    linkLabel: "institutionalEventPage",
    href: "shared.institutionalRecords.morocco",
  },
  {
    country: "pCountry4",
    event: "event4",
    date: "institutionalDateIndia",
    linkLabel: "institutionalEventPage",
    href: "shared.institutionalRecords.india",
  },
  {
    country: "pCountry3",
    event: "event3",
    date: "institutionalDateTurkiye",
    linkLabel: "institutionalPressNote",
    href: "shared.institutionalRecords.turkiye",
  },
  {
    country: "pCountry2",
    event: "event2",
    date: "institutionalDateChina",
    linkLabel: "institutionalEventPage",
    href: "shared.institutionalRecords.china",
  },
  {
    country: "pCountry1",
    event: "event1",
    date: "institutionalDateAustria",
    linkLabel: "institutionalEventPage",
    href: "shared.institutionalRecords.austria",
  },
];

// Countdown is currently paused in index.html because SIEL 2026 has passed.
// To reactivate it for a future launch, uncomment the availability-countdown
// block in index.html and update this date. Months are zero-based: 4 = May.
const availabilityDate = new Date(2026, 4, 1, 0, 0, 0);
const postLaunchIntroDate = new Date(2026, 4, 2, 0, 0, 0);
let availabilityCountdownInterval;

// Optional helper for future launches. It is intentionally not called now so
// the hero text does not switch after first paint.
function updateHeroIntroTranslation() {
  const heroIntro = document.getElementById("intro3");
  if (!heroIntro) return;

  heroIntro.dataset.translation =
    Date.now() < postLaunchIntroDate.getTime()
      ? "launchHeroBefore"
      : "launchHeroAfter";
}

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

  if (!document.querySelector(".availability-countdown")) {
    return;
  }

  updateAvailabilityCountdown();
  availabilityCountdownInterval = window.setInterval(
    updateAvailabilityCountdown,
    1000,
  );
}

function getItemsPerSlide() {
  if (window.innerWidth < 768) return 1;
  if (window.innerWidth < 992) return 2;
  return 3;
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
    const colClass =
      currentItemsPerSlide === 1
        ? "col-12"
        : currentItemsPerSlide === 2
          ? "col-12 col-md-6"
          : "col-12 col-md-4";
    const bottomClass =
      currentItemsPerSlide === 1
        ? card.mobileBottomClass
        : card.desktopBottomClass;

    return `
    <div class="${colClass}">
      <div class="single-price no-padding">
        <div class="price-top">
          <h4 data-translation="${card.edition}"></h4>
        </div>
        <p data-translation="${card.text}"></p>
        <div class="price-bottom ${bottomClass}">
          <div class="${card.leftClass}">
            <span class="h1" data-translation="${card.price}"></span>
          </div>
          <div class="${card.rightClass}">
            <a href="${getLocalizedLink(card.href)}" target="_blank" rel="noopener noreferrer" class="primary-btn" data-translation="${card.cta || "editionP"}"></a>
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
    const colClass =
      currentItemsPerSlide === 1
        ? "col-12"
        : currentItemsPerSlide === 2
          ? "col-12 col-md-6"
          : "col-12 col-md-4";

    return `
    <div class="${colClass}">
      <a class="book-card text-decoration-none d-block h-100" href="${getLinkValue(card.href)}" target="_blank" rel="noopener noreferrer">
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
    const colClass =
      currentItemsPerSlide === 1
        ? "col-12 mMedia-container"
        : currentItemsPerSlide === 2
          ? "col-12 col-md-6 mMedia-container"
          : "col-12 col-md-4 mMedia-container";
    const cardClass = currentItemsPerSlide === 1 ? "card mx-3" : "card";
    const imageClass =
      currentItemsPerSlide === 1 ? "card-img-top img-fluid" : "card-img-top";
    const bodyClass =
      currentItemsPerSlide === 1
        ? "card-body text-center font-weight-bold"
        : "card-body";

    return `
      <div class="${colClass}">
        <div class="${cardClass}">
          <a
            target="_blank"
            rel="noopener noreferrer"
            href="${getLinkValue(card.href)}"
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

function renderInstitutionalRecords() {
  const carouselElement = document.getElementById(
    "institutionalRecordsCarousel",
  );
  const carouselInner = document.getElementById(
    "institutionalRecordsCarouselInner",
  );

  if (!carouselElement || !carouselInner) return;

  const itemsPerSlide = getItemsPerSlide();
  const existingInstance = bootstrap.Carousel.getInstance(carouselElement);
  if (existingInstance) {
    existingInstance.dispose();
  }

  const slides = [];

  for (let i = 0; i < institutionalRecordCards.length; i += itemsPerSlide) {
    const group = institutionalRecordCards.slice(i, i + itemsPerSlide);

    slides.push(`
      <div class="carousel-item ${i === 0 ? "active" : ""}">
        <div class="row justify-content-center g-4">
          ${group.map((card) => buildInstitutionalRecordCard(card, itemsPerSlide)).join("")}
        </div>
      </div>
    `);
  }

  function buildInstitutionalRecordCard(card, currentItemsPerSlide) {
    const colClass =
      currentItemsPerSlide === 1
        ? "col-12 institutional-record-slide"
        : currentItemsPerSlide === 2
          ? "col-12 col-md-6 institutional-record-slide"
          : "col-12 col-md-4 institutional-record-slide";
    const event = getTranslationValue(translations, card.event) || {};
    const institution = event.institution || "";
    const title = event.title || "";

    return `
      <div class="${colClass}">
        <article class="institutional-record-card">
          <p class="institutional-record-country" data-translation="${card.country}"></p>
          <h3>${institution}</h3>
          <p class="institutional-record-title">${title}</p>
          <p class="institutional-record-date" data-translation="${card.date}"></p>
          <a
            href="${getLinkValue(card.href)}"
            class="institutional-record-link"
            target="_blank"
            rel="noopener noreferrer"
            data-translation="${card.linkLabel}"
          ></a>
        </article>
      </div>
    `;
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
    renderInstitutionalRecords();
  }
});

Promise.all([
  fetchTranslationData(`js/i18n/lang-${lang}.min.json`),
  fetchTranslationData("js/data/links.min.json"),
])
  .then(([translationData, linksData]) => {
    translations = translationData.translations;
    linkRegistry = linksData;
    localizedLinks = mergeLinkConfig(
      linkRegistry.localized.default,
      linkRegistry.localized[lang],
    );

    initOfficialLanguageSelector();
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
          getLinkValue("shared.contact.spanishContactForm"),
        );
    }

    setDeferredFrameSource(
      "bookPreviewFrame",
      `https://leer.amazon.es/kp/card?asin=${localizedLinks.book}&preview=inline&linkCode=kpe&ref_=cm_sw_r_kb_dp_HJ6YDMXY6BRE1FA9AWE3`,
    );
    setDeferredFrameSource(
      "preziPreviewFrame",
      `https://prezi.com/p/embed/${localizedLinks.prezi}`,
    );

    const contactModal = document.getElementById("mContactUs");
    renderPriceCarousel();
    renderBooksCarousel();
    renderMassMediaCarousel();
    renderInstitutionalRecords();
    applyTranslations();

    contactModal.addEventListener(
      "show.bs.modal",
      () => {
        const cuScriptExist = document.getElementById("cu_script");

        if (!cuScriptExist) {
          const script = document.createElement("script");
          script.src = "https://www.cognitoforms.com/f/seamless.js";
          script.id = "cu_script";
          script.async = true;
          script.dataset.key = localizedLinks.contactUs.key;
          script.dataset.form = localizedLinks.contactUs.form;

          document.getElementById("divContactUs").appendChild(script);
        }
      },
      { once: true },
    );

    window.dispatchEvent(
      new CustomEvent("translationsLoaded", {
        detail: { lang, translations },
      }),
    );
  })
  .catch((e) => {
    console.error(e);
  });
