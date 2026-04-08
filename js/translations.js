let nLang = (navigator.languages
    ? navigator.languages[0]
    : (navigator.language || navigator.userLanguage)).split('-')[0];

let supportedLang = ['en', 'es', 'zh', 'fr'];
let translations;
const lang = supportedLang.includes(nLang) ? nLang : 'en';

fetchData(`js/i18n/lang-${lang}.min.json`)
    .then((data) => {
        console.log('begin');
        translations = data.translations;

        // Apply translations to DOM
        document.querySelectorAll('[data-translation]').forEach(item => {
            item.innerHTML = translations[item.dataset.translation];
        });


        //to be re-enabled
        // Update Amazon and Books2Read links
        /*const amazonBtn = document.getElementById("price0");
        if (amazonBtn) {
          amazonBtn.href = (lang === 'es')
            ? "https://a.co/d/codBr2F"
            : "https://a.co/d/0jrpI9T";
        }
    
        const bookAnchor = document.querySelector("#div-book a");
        if (bookAnchor) {
          bookAnchor.href = (lang === 'es')
            ? "https://books2read.com/u/4NEzj9"
            : "https://books2read.com/u/3nXNNR";
        }*/

        document.title = translations.title;

        if (lang === 'es') {
            // Update image if Spanish version is needed
            //const picture = document.querySelector("#div-book picture");
            //if (picture && lang === 'es') {
            //}

            const tEdition10 = document.getElementById("tEdition10");
            const tEdition4 = document.getElementById("tEdition4");
            //const tEdition8 = document.getElementById("tEdition8");
            //const tEdition12 = document.getElementById("tEdition12");
            const tEdition2 = document.getElementById("tEdition2");
            const tEdition6 = document.getElementById("tEdition6");

            document.querySelector("#div-book picture").innerHTML = `
                <source srcset="img/cover-colorized-v2-sm-es.webp" type="image/webp">
                <source srcset="img/cover-colorized-v2-sm-es.jpg" type="image/jpeg">
                <img style="width: 100%;" alt="Historias Eternas de El Salvador — Espejos Españoles"
                    src="img/cover-colorized-v2-sm-es.jpg" />
            `;

            tEdition10.href = 'https://adbl.co/4qExKCP';
            tEdition4.href = 'https://a.co/d/cVQ0B39';
            document.getElementById('dEdition8').style.display = 'none';
            document.getElementById('dEdition12').style.display = 'none';
            tEdition2.href = 'https://a.co/d/e4W03f0';
            tEdition6.href = 'https://a.co/d/6ycRDq4';

            //const btnEditor = document.getElementById('btnEditor');
            document.getElementById('btnEditor').style.setProperty("display", "none", "important");
        }

        const carouselCards = [
            {
                edition: 'edition4',
                text: 'edition5',
                price: 'price1',
                href: 'https://a.co/d/hIKdELB',
                itemClass: 'col-12 col-md-6 col-lg-4',
                desktopBottomClass: '',
                mobileBottomClass: 'eBPrice',
                desktop: { leftClass: 'row-auto', rightClass: 'row-auto' },
                mobile: { leftClass: 'row-auto', rightClass: 'row-auto' }
            },
            {
                edition: 'edition2',
                text: 'edition3',
                price: 'price2',
                href: 'https://amzn.to/4jVgzcE',
                itemClass: 'col-12 col-md-6 col-lg-4',
                desktopBottomClass: 'price-bottom-r',
                mobileBottomClass: 'eBPriceR',
                desktop: { leftClass: 'row-auto', rightClass: 'row-auto' },
                mobile: { leftClass: 'row-auto', rightClass: 'row-auto' }
            },
            {
                edition: 'edition6',
                text: 'edition7',
                price: 'price3',
                href: 'https://bit.ly/4d86GGG',
                itemClass: 'col-12 col-md-6 col-lg-4 d-none d-lg-block',
                desktopBottomClass: '',
                mobileBottomClass: 'eBPrice',
                desktop: { leftClass: 'row-auto', rightClass: 'row-auto' },
                mobile: { leftClass: 'row-auto', rightClass: 'row-auto' }
            }
        ];

        const buildPriceCard = ({ edition, text, price, href, leftClass, rightClass, bottomClass = '', itemClass = '' }) => `
            <div${itemClass ? ` class="${itemClass}"` : ''}>
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

        const desktopCarouselInner = document.querySelector('#multiItemCarousel .carousel-inner');
        const mobileCarouselInner = document.querySelector('#galleryCarousel .carousel-inner');

        if (desktopCarouselInner) {
            desktopCarouselInner.innerHTML = `
                <div class="carousel-item active">
                  <div class="row">
                    ${carouselCards.map(card => buildPriceCard({
                        edition: card.edition,
                        text: card.text,
                        price: card.price,
                        href: card.href,
                        leftClass: card.desktop.leftClass,
                        rightClass: card.desktop.rightClass,
                        bottomClass: card.desktopBottomClass,
                        itemClass: card.itemClass
                    })).join('')}
                  </div>
                </div>`;
        }

        if (mobileCarouselInner) {
            mobileCarouselInner.innerHTML = `
                ${carouselCards.map((card, index) => `
                    <div class="carousel-item${index === 0 ? ' active' : ''}">
                      ${buildPriceCard({
                        edition: card.edition,
                        text: card.text,
                        price: card.price,
                        href: card.href,
                        leftClass: card.mobile.leftClass,
                        rightClass: card.mobile.rightClass,
                        bottomClass: card.mobileBottomClass,
                        itemClass: ''
                    })}
                    </div>
                `).join('')}`;
        }

        // Re-run translation injection on the newly inserted elements
        document.querySelectorAll('[data-translation]').forEach(item => {
            const key = item.dataset.translation;
            if (translations[key]) {
                item.innerHTML = translations[key];
            }
        });

        //const validLinks = links_translations[lang];

        const validLinks = translations.links;

        document.getElementById("bookPreviewFrame").setAttribute("src", `https://leer.amazon.es/kp/card?asin=${validLinks.book}&preview=inline&linkCode=kpe&ref_=cm_sw_r_kb_dp_HJ6YDMXY6BRE1FA9AWE3`);
        document.getElementById("preziPreviewFrame").setAttribute("src", `https://prezi.com/p/embed/${validLinks.prezi}`);

        $('#mContactUs').on('show.bs.modal', function (e) {
            console.log('opened');

            const cuScriptExist = document.getElementById('cu_script');

            if (!cuScriptExist) {
                const script = document.createElement('script');
                script.src = 'https://www.cognitoforms.com/f/seamless.js';
                script.id = 'cu_script';
                script.dataset.key = validLinks.contactUs.key;
                script.dataset.form = validLinks.contactUs.form;
                document.getElementById('divContactUs').appendChild(script);
            }
        });
    })
    .catch((e) => {
        console.error(e);
    });

