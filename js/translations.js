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

fetchData(`js/i18n/lang-${lang}.min.json`)
  .then((data) => {
    console.log("begin");
    translations = data.translations;

    applyTranslations();

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

    const carouselCards = [
      {
        edition: "edition4",
        text: "edition5",
        price: "price1",
        href: "https://a.co/d/hIKdELB",
        itemClass: "col-12 col-md-6 col-lg-4",
        desktopBottomClass: "",
        mobileBottomClass: "eBPrice",
        desktop: { leftClass: "row-auto", rightClass: "row-auto" },
        mobile: { leftClass: "row-auto", rightClass: "row-auto" },
      },
      {
        edition: "edition2",
        text: "edition3",
        price: "price2",
        href: "https://amzn.to/4jVgzcE",
        itemClass: "col-12 col-md-6 col-lg-4",
        desktopBottomClass: "price-bottom-r",
        mobileBottomClass: "eBPriceR",
        leftClass: "row-auto",
        rightClass: "row-auto" 
      },
      {
        edition: "edition6",
        text: "edition7",
        price: "price3",
        href: "https://bit.ly/4d86GGG",
        itemClass: "col-12 col-md-6 col-lg-4 d-none d-lg-block",
        desktopBottomClass: "",
        mobileBottomClass: "eBPrice",
        leftClass: "row-auto",
        rightClass: "row-auto" 
      },
    ];

    const buildPriceCard = ({
      edition,
      text,
      price,
      href,
      leftClass,
      rightClass,
      bottomClass = "",
      itemClass = "",
    }) => `
            <div${itemClass ? ` class="${itemClass}"` : ""}>
              <div class="single-price no-padding">
                <div class="price-top">
                  <h4 data-translation="${edition}"></h4>
                </div>
                <p data-translation="${text}"></p>
                <div class="price-bottom ${bottomClass} row-auto gx-3 gy-2 align-items-center justify-content-center">
                  <div class="${leftClass}"><span class="h1" data-translation="${price}"></span><span style='height: 0.25rem'><div class="${rightClass}"><a href="${href}" target="_blank" class="primary-btn" data-translation="editionP"></a></div></div>
                </div>
              </div>
            </div>`;

    const desktopCarouselInner = document.querySelector(
      "#multiItemCarousel .carousel-inner",
    );
    const mobileCarouselInner = document.querySelector(
      "#galleryCarousel .carousel-inner",
    );

    if (desktopCarouselInner) {
      desktopCarouselInner.innerHTML = `
                <div class="carousel-item active">
                  <div class="row">
                    ${carouselCards
                      .map((card) =>
                        buildPriceCard({
                          edition: card.edition,
                          text: card.text,
                          price: card.price,
                          href: card.href,
                          leftClass: card.leftClass,
                          rightClass: card.rightClass,
                          bottomClass: card.desktopBottomClass,
                          itemClass: card.itemClass,
                        }),
                      )
                      .join("")}
                  </div>
                </div>`;
    }

    if (mobileCarouselInner) {
      mobileCarouselInner.innerHTML = `
                ${carouselCards
                  .map(
                    (card, index) => `
                    <div class="carousel-item${index === 0 ? " active" : ""}">
                      ${buildPriceCard({
                        edition: card.edition,
                        text: card.text,
                        price: card.price,
                        href: card.href,
                        leftClass: card.leftClass,
                        rightClass: card.rightClass,
                        bottomClass: card.mobileBottomClass,
                        itemClass: "",
                      })}
                    </div>
                `,
                  )
                  .join("")}`;
    }

    applyTranslations();

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

    contactModal.addEventListener("show.bs.modal", function (e) {
      console.log("opened");

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
        detail: { lang, translations }
      })
    );
  })
  .catch((e) => {
    console.error(e);
  });
