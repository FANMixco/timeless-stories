let nLang = (
  navigator.languages
    ? navigator.languages[0]
    : navigator.language || navigator.userLanguage
).split("-")[0];

let supportedLang = ["en", "es", "zh", "fr"];
let translations;
const lang = supportedLang.includes(nLang) ? nLang : "en";

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
  ,
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

  function buildPriceCard(card, itemsPerSlide) {
    const colClass = itemsPerSlide === 1 ? "col-12" : "col-12 col-md-4";
    const bottomClass =
      itemsPerSlide === 1 ? card.mobileBottomClass : card.desktopBottomClass;

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

  function buildBookCard(card, itemsPerSlide) {
    const colClass = itemsPerSlide === 1 ? "col-12" : "col-12 col-md-4";

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

let currentCarouselMode = getItemsPerSlide();

window.addEventListener("resize", () => {
  const newMode = getItemsPerSlide();

  if (newMode !== currentCarouselMode) {
    currentCarouselMode = newMode;
    renderPriceCarousel();
    renderBooksCarousel();
  }
});

fetchData(`js/i18n/lang-${lang}.min.json`)
  .then((data) => {
    console.log("begin");
    translations = data.translations;

    document.title = translations.title;

    if (lang === "es") {
      const tEdition10 = document.getElementById("tEdition10");
      const tEdition4 = document.getElementById("tEdition4");
      const tEdition2 = document.getElementById("tEdition2");
      const tEdition6 = document.getElementById("tEdition6");

      document.querySelector("#div-book picture").innerHTML = `
                <source srcset="img/cover-colorized-v2-sm-es.webp" type="image/webp">
                <source srcset="img/cover-colorized-v2-sm-es.jpg" type="image/jpeg">
                <img style="width: 100%;" alt="Historias Eternas de El Salvador — Espejos Españoles"
                    src="img/cover-colorized-v2-sm-es.jpg" />
            `;

      tEdition10.href = "https://adbl.co/4qExKCP";
      tEdition4.href = "https://a.co/d/cVQ0B39";
      document.getElementById("dEdition8").style.display = "none";
      document.getElementById("dEdition12").style.display = "none";
      tEdition2.href = "https://a.co/d/e4W03f0";
      tEdition6.href = "https://a.co/d/6ycRDq4";

      document
        .getElementById("btnEditor")
        .style.setProperty("display", "none", "important");
    }

    //applyTranslations();

    const validLinks = translations.links;

    document
      .getElementById("bookPreviewFrame")
      .setAttribute(
        "src",
        `https://leer.amazon.es/kp/card?asin=${validLinks.book}&preview=inline&linkCode=kpe&ref_=cm_sw_r_kb_dp_HJ6YDMXY6BRE1FA9AWE3`,
      );
    document
      .getElementById("preziPreviewFrame")
      .setAttribute("src", `https://prezi.com/p/embed/${validLinks.prezi}`);

    const contactModal = document.getElementById("mContactUs");
    renderPriceCarousel();
    renderBooksCarousel();
    applyTranslations();

    contactModal.addEventListener("show.bs.modal", function () {
      const cuScriptExist = document.getElementById("cu_script");

      if (!cuScriptExist) {
        const script = document.createElement("script");
        script.src = "https://www.cognitoforms.com/f/seamless.js";
        script.id = "cu_script";
        script.dataset.key = validLinks.contactUs.key;
        script.dataset.form = validLinks.contactUs.form;

        document.getElementById("divContactUs").appendChild(script);
      }
    });

    window.dispatchEvent(
      new CustomEvent("translationsLoaded", {
        detail: { lang, translations },
      }),
    );
  })
  .catch((e) => {
    console.error(e);
  });
