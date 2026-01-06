let nLang = (navigator.languages
	? navigator.languages[0]
	: (navigator.language || navigator.userLanguage)).split('-')[0];

let supportedLang = ['en', 'es', 'zh'];
let translations;
const lang = supportedLang.includes(nLang) ? nLang : 'en';

fetchData(`js/i18n/lang-${lang}.min.json`)
	.then((data) => {
		translations = data.translations;

		// Apply translations to DOM
		document.querySelectorAll('[data-translation]').forEach(item => {
			item.innerHTML = translations[item.dataset.translation];
		});

		const tEdition10 = document.getElementById("tEdition10");
		const tEdition4 = document.getElementById("tEdition4");
		//const tEdition8 = document.getElementById("tEdition8");
		//const tEdition12 = document.getElementById("tEdition12");
		const tEdition2 = document.getElementById("tEdition2");
		const tEdition6 = document.getElementById("tEdition6");

		if (lang === 'es') {
			tEdition10.href = 'https://adbl.co/4qExKCP';
			tEdition4.href = 'https://a.co/d/cVQ0B39';
			document.getElementById('dEdition8').style.display ='none';
			document.getElementById('dEdition12').style.display ='none';
			tEdition2.href = 'https://a.co/d/e4W03f0';
			tEdition6.href = 'https://a.co/d/6ycRDq4';
		}


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
		document.title = (lang === 'es')
			? 'Historias Eternas de El Salvador | Folclore, Leyendas y Cuentos'
			: 'Timeless Stories of El Salvador | Folklore, Legends & Fairy tales';


		// Update image if Spanish version is needed
		const picture = document.querySelector("#div-book picture");
		if (picture && lang === 'es') {
			picture.innerHTML = `
            <source srcset="img/cover-colorized-v2-sm-es.webp" type="image/webp">
            <source srcset="img/cover-colorized-v2-sm-es.jpg" type="image/jpeg">
            <img style="width: 100%;" alt="Historias Eternas de El Salvador — Espejos Españoles"
                src="img/cover-colorized-v2-sm-es.jpg" />
        `;
		}

		if (lang === 'es') {
			const btnEditor = document.getElementById('btnEditor');
			btnEditor.style.setProperty("display", "none", "important");

			const desktopCarouselInner = document.querySelector('#multiItemCarousel .carousel-inner');
			const mobileCarouselInner = document.querySelector('#galleryCarousel .carousel-inner');

			if (desktopCarouselInner) {
				desktopCarouselInner.innerHTML = `
                <div class="carousel-item active">
                  <div class="row">
                    <div class="col-12 col-md-6 col-lg-4">
                      <div class="single-price no-padding">
                        <div class="price-top">
                          <h4 data-translation="edition4"></h4>
                        </div>
                        <p data-translation="edition5"></p>
                        <div class="price-bottom">
                          <span class="h1" data-translation="price1"></span>
                          <a href="https://a.co/d/hIKdELB" target="_blank" class="primary-btn" data-translation="editionP"></a>
                        </div>
                      </div>
                    </div>
                    <div class="col-12 col-md-6 col-lg-4">
                      <div class="single-price no-padding">
                        <div class="price-top">
                          <h4 data-translation="edition2"></h4>
                        </div>
                        <p data-translation="edition3"></p>
                        <div class="price-bottom price-bottom-r">
                          <span class="h1" data-translation="price2"></span>
                          <a href="https://amzn.to/4jVgzcE" target="_blank" class="primary-btn" data-translation="editionP"></a>
                        </div>
                      </div>
                    </div>
                    <div class="col-12 col-md-6 col-lg-4 d-none d-lg-block">
                      <div class="single-price no-padding">
                        <div class="price-top">
                          <h4 data-translation="edition6"></h4>
                        </div>
                        <p data-translation="edition7"></p>
                        <div class="price-bottom">
                          <span class="h1" data-translation="price3"></span>
                          <a href="https://bit.ly/4d86GGG" target="_blank" class="primary-btn" data-translation="editionP"></a>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>`;
			}

			if (mobileCarouselInner) {
				mobileCarouselInner.innerHTML = `
                <div class="carousel-item active">
                  <div class="single-price no-padding">
                    <div class="price-top">
                      <h4 data-translation="edition4"></h4>
                    </div>
                    <p data-translation="edition5"></p>
                    <div class="price-bottom">
                      <span class="h1" data-translation="price1"></span><br>
                      <a href="https://a.co/d/hIKdELB" target="_blank" class="primary-btn" data-translation="editionP"></a>
                    </div>
                  </div>
                </div>
                <div class="carousel-item">
                  <div class="single-price no-padding">
                    <div class="price-top">
                      <h4 data-translation="edition2"></h4>
                    </div>
                    <p data-translation="edition3"></p>
                    <div class="price-bottom eBPriceR">
                      <span class="h1" data-translation="price2"></span><br>
                      <a href="https://amzn.to/4jVgzcE" target="_blank" class="primary-btn" data-translation="editionP"></a>
                    </div>
                  </div>
                </div>
                <div class="carousel-item">
                  <div class="single-price no-padding">
                    <div class="price-top">
                      <h4 data-translation="edition6"></h4>
                    </div>
                    <p data-translation="edition7"></p>
                    <div class="price-bottom">
                      <span class="h1" data-translation="price3"></span><br>
                      <a href="https://bit.ly/4d86GGG" target="_blank" class="primary-btn" data-translation="editionP"></a>
                    </div>
                  </div>
                </div>`;
			}

			// Re-run translation injection on the newly inserted elements
			document.querySelectorAll('[data-translation]').forEach(item => {
				const key = item.dataset.translation;
				if (translations[key]) {
					item.innerHTML = translations[key];
				}
			});
		}
	})
	.catch((e) => {
		console.error(e);
	});