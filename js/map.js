const legends = [
  { id: 1, key: "blackKnight", loc: [13.667749, -89.290185] },
  { id: 2, key: "siguanaba", loc: [13.938237074475145, -89.19411245692653] },
  { id: 3, key: "goodAndBadCadejo", loc: [13.520926, -88.234184] },
  { id: 4, key: "mulus", loc: [13.676791, -89.27857] },
  { id: 5, key: "funeralCortegeOfChalchuapa", loc: [13.986932, -89.67835] },
  { id: 6, key: "fairJudgeOfTheNight", loc: [14.315494, -89.172335] },
  { id: 7, key: "weepingWoman", loc: [14.329334, -89.150234] },
  { id: 8, key: "headlessPriest", loc: [13.698288, -89.191173] },
  { id: 9, key: "fleshlessWoman", loc: [13.903600, -89.549559] },
  { id: 10, key: "dwarf", loc: [13.87073, -88.628353] }
];

const legends2 = [
  { id: 1, key: "caveOfSalamanca", loc: [40.964053, -5.665657] },
  { id: 2, key: "midnightWasherwomen", loc: [43.243723, -8.375927] },
  { id: 3, key: "dip", loc: [41.051076, 0.871160] },
  { id: 4, key: "urco", loc: [42.426911, -8.656881] },
  { id: 5, key: "holyCompany", loc: [43.588495, -5.929513] },
  { id: 6, key: "gaueko", loc: [43.154772, -2.955539] },
  { id: 7, key: "ploranera", loc: [41.374722, 2.18884] },
  { id: 8, key: "ghostOfSanGines", loc: [40.417214803173316, -3.7071205413454735] },
  { id: 9, key: "girlOnTheCurve", loc: [40.903697, -3.880308] },
  { id: 10, key: "trasgu", loc: [43.187277, -4.820837] }
];

const volumeMapCollections = {
  volume2: {
    title: {
      en: "Timeless Stories of El Salvador V2: Epiphany",
      es: "Historias Eternas de El Salvador V2: Epifanía",
      zh: "Timeless Stories of El Salvador V2: Epiphany"
    },
    center: [13.8029939, -88.9053364],
    zoom: 8.4,
    items: [
      {
        id: 1,
        lang: {
          en: { name: "Sir Francis Drake", desc: "The first pirate of the Pacific." },
          es: { name: "Francis Drake", desc: "The primer pirata del Pacífico." },
          zh: { name: "弗朗西斯·德雷克爵士", desc: "第一个太平洋海盗。" }
        },
        loc: [13.173053, -88.095873]
      },
      {
        id: 2,
        lang: {
          en: { name: "The Death of The Sorcerer of La Nahuaterique", desc: "An old Indian wizard." },
          es: { name: "La Muerte del Brujo de La Nahuaterique", desc: "Un viejo brujo indígena." },
          zh: { name: "拉纳瓦特里克的巫师之死", desc: "一位古老的印度巫师。" }
        },
        loc: [14.051629, -88.149412]
      },
      { id: 3, key: "mulus", loc: [13.676791, -89.27857] },
      {
        id: 4,
        lang: {
          en: { name: "The Almighty Tlaloc", desc: "The god of thunder and rain." },
          es: { name: "El Todopoderoso Tlaloc", desc: "El dios del trueno y la lluvia." },
          zh: { name: "全能的特拉洛克", desc: "雷雨之神。" }
        },
        loc: [14.288539, -89.516962]
      },
      {
        id: 5,
        lang: {
          en: { name: "The Mysterious Woman of The Toad River", desc: "A scary woman living in rivers." },
          es: { name: "La mujer misteriosa del río Sapo", desc: "Una mujer aterradora que vive en los ríos." },
          zh: { name: "蟾蜍河的神秘女人", desc: "一个生活在河流中的可怕女人。" }
        },
        loc: [13.923071, -88.105488]
      },
      {
        id: 6,
        lang: {
          en: { name: "Lake Ilopango", desc: "A mystical lake with many mysteries." },
          es: { name: "Lago de Ilopango", desc: "Un lago místico con muchos misterios." },
          zh: { name: "伊洛潘戈湖", desc: "一个有许多谜团的神秘湖。" }
        },
        loc: [13.666654, -89.078916]
      },
      {
        id: 7,
        lang: {
          en: { name: "The Bewitched Wagon", desc: "A scary wagon that visits cemeteries at night." },
          es: { name: "El carreta embrujado", desc: "Una carreta aterradora que visita los cementerios por la noche." },
          zh: { name: "被蛊惑的货车", desc: "一辆在晚上造访墓地的可怕马车。" }
        },
        loc: [13.724127, -89.660282]
      },
      { id: 8, key: "dwarf", loc: [13.87073, -88.628353] },
      {
        id: 9,
        lang: {
          en: { name: "The Bandari Witch", desc: "A magical being that frightens men." },
          es: { name: "La Mona Bruja", desc: "Un ser mágico que asusta a los hombres." },
          zh: { name: "女猴女巫", desc: "一个让男人害怕的神奇生物。" }
        },
        loc: [14.242402, -89.48265]
      },
      { id: 10, key: "weepingWoman", loc: [14.329334, -89.150234] },
      {
        id: 11,
        lang: {
          en: { name: "The Virgin of Izalco", desc: "The Virgin Mary who protects Izalco." },
          es: { name: "La Virgen de Izalco", desc: "La Virgen María que protege a Izalco." },
          zh: { name: "伊萨尔科圣母", desc: "保护 Izalco 的圣母玛利亚。" }
        },
        loc: [13.815449, -89.630321]
      },
      {
        id: 12,
        lang: {
          en: { name: "The Headless Horseman", desc: "A tragic love story between a farmer and a woman." },
          es: { name: "El jinete sin cabeza", desc: "Una trágica historia de amor entre un granjero y una mujer." },
          zh: { name: "无头骑士", desc: "一个农夫和一个女人之间悲惨的爱情故事。" }
        },
        loc: [13.859607, -89.032474]
      },
      {
        id: 13,
        lang: {
          en: { name: "Tenancin, Cipitio's girlfriend", desc: "A girl who met Cipitio and became good friends." },
          es: { name: "Tenancín, la novia de Cipitío", desc: "Una chica que conoció a Cipitío y se hicieron buenos amigos." },
          zh: { name: "特南辛，西皮蒂奥的女友", desc: "认识 Cipitio 并成为好朋友的女孩。" }
        },
        loc: [13.551432, -88.720998]
      },
      {
        id: 14,
        lang: {
          en: { name: "Prince Atonal", desc: "A Indian prince who bravely fought the Spaniards." },
          es: { name: "El príncipe Atonal", desc: "Un príncipe indígena que luchó valientemente contra los españoles." },
          zh: { name: "阿托纳尔王子", desc: "一位勇敢地与西班牙人作战的印度王子。" }
        },
        loc: [13.662594, -89.724913]
      },
      {
        id: 15,
        lang: {
          en: { name: "The Pirate Treasures of Meanguera Island", desc: "An island that hides Sir Francis Drake's Treasure." },
          es: { name: "Los tesoros piratas de la isla Meanguera", desc: "Una isla que esconde el tesoro de Francis Drake." },
          zh: { name: "棉格拉岛的海盗宝藏", desc: "一个隐藏弗朗西斯·德雷克爵士宝藏的岛屿。" }
        },
        loc: [13.188535, -87.713578]
      },
      {
        id: 16,
        lang: {
          en: { name: "The Black Horse", desc: "The Black Knight's Companion" },
          es: { name: "El Caballo Negro", desc: "El Compañero del Caballero Negro" },
          zh: { name: "黑马", desc: "黑骑士的伙伴" }
        },
        loc: [13.861566, -89.803286]
      },
      {
        id: 17,
        lang: {
          en: { name: "Tangaloa", desc: "The Guardian of The Sea." },
          es: { name: "Tangaloa", desc: "El Guardián del Mar." },
          zh: { name: "汤加洛亚", desc: "海洋守护者。" }
        },
        loc: [13.643763, -88.247734]
      },
      {
        id: 18,
        lang: {
          en: { name: "The Cocoa", desc: "The most valuable Indian treasure." },
          es: { name: "El Cacao", desc: "El tesoro indígena más valioso." },
          zh: { name: "可可", desc: "最有价值的印度宝藏。" }
        },
        loc: [13.823555, -90.079851]
      },
      {
        id: 19,
        lang: {
          en: { name: "Lake Coatepeque Snake", desc: "A snake that creates earthquakes." },
          es: { name: "Serpiente del lago de Coatepeque", desc: "Una serpiente que crea terremotos." },
          zh: { name: "科泰佩克湖蛇", desc: "一条能引起地震的蛇。" }
        },
        loc: [13.863197, -89.5606]
      },
      {
        id: 20,
        lang: {
          en: { name: "The Woman of The Chinchontepec", desc: "A beautiful woman's sad story." },
          es: { name: "La mujer del Chinchontepec", desc: "La triste historia de una bella mujer." },
          zh: { name: "秦琼特佩克的女人", desc: "一个美丽女人的悲伤故事。" }
        },
        loc: [13.596078, -88.837726]
      },
      {
        id: 21,
        lang: {
          en: { name: "The Amate Flower", desc: "The Black Knight's greatest treasure." },
          es: { name: "La Flor de Amate", desc: "El mayor tesoro del Caballero Negro." },
          zh: { name: "阿玛特之花", desc: "黑骑士最伟大的宝藏。" }
        },
        loc: [13.681606, -88.061913]
      },
      {
        id: 22,
        lang: {
          en: { name: "Titilcíhuat", desc: "The Fire Woman." },
          es: { name: "Titilcíhuat", desc: "La mujer del fuego." },
          zh: { name: "蒂蒂奇瓦特", desc: "火女。" }
        },
        loc: [13.894878, -89.194313]
      },
      {
        id: 23,
        lang: {
          en: { name: "The Arbolarios", desc: "The rain evil genies." },
          es: { name: "Los Arbolarios", desc: "Los genios malvados de la lluvia." },
          zh: { name: "阿贝拉里奥斯", desc: "雨魔。" }
        },
        loc: [13.519184, -88.514311]
      },
      {
        id: 24,
        lang: {
          en: { name: "Devil's Pool and its twin", desc: "The Black Knight's secret den." },
          es: { name: "La Poza del diablo y su gemela", desc: "La guarida secreta del Caballero Negro." },
          zh: { name: "魔鬼池及其孪生兄弟", desc: "黑骑士的秘密巢穴。" }
        },
        loc: [13.97658, -89.048746]
      },
      {
        id: 25,
        lang: {
          en: { name: "The Frogfish", desc: "The viagra of the sea." },
          es: { name: "El Zapamiche", desc: "La viagra del mar." },
          zh: { name: "青蛙鱼", desc: "大海的伟哥。" }
        },
        loc: [13.169074, -87.718547]
      },
      {
        id: 26,
        lang: {
          en: { name: "The Eruption of The San Salvador Volcano", desc: "A collection of stories of the eruption." },
          es: { name: "La erupción del volcán San Salvador", desc: "Una colección de historias de la erupción." },
          zh: { name: "圣萨尔瓦多火山爆发", desc: "火山喷发故事集。" }
        },
        loc: [13.737676, -89.287691]
      },
      {
        id: 27,
        lang: {
          en: { name: "The Giantess of Jocoro", desc: "The story of some mysterious bones." },
          es: { name: "La Giganta de Jocoro", desc: "La historia de unos huesos misteriosos." },
          zh: { name: "乔科罗的女巨人", desc: "一些神秘骨头的故事。" }
        },
        loc: [13.610782, -88.028687]
      },
      {
        id: 28,
        lang: {
          en: { name: "The Bewitched Rock", desc: "A cursed place that wizards and witches visit." },
          es: { name: "La roca embrujada", desc: "Un lugar maldito que visitan magos y brujas." },
          zh: { name: "被蛊惑的岩石", desc: "巫师和女巫光顾的被诅咒的地方。" }
        },
        loc: [14.436495, -89.396787]
      },
      {
        id: 29,
        lang: {
          en: { name: "The Old Church of San Dionisio", desc: "The story of some mysterious bells ringing." },
          es: { name: "La Iglesia Vieja de San Dionisio", desc: "La historia del sonido de unas misteriosas campanas." },
          zh: { name: "圣迪奥尼西奥旧教堂", desc: "神秘钟声响起的故事。" }
        },
        loc: [13.287302, -88.489457]
      },
      {
        id: 30,
        lang: {
          en: { name: "The Cukinca Cave", desc: "A cave that produces evil sounds." },
          es: { name: "La cueva Cukinca", desc: "Una cueva que produce sonidos malignos." },
          zh: { name: "库金卡洞穴", desc: "发出邪恶声音的洞穴。" }
        },
        loc: [13.757794, -88.067752]
      },
      {
        id: 31,
        lang: {
          en: { name: "Cuicuizcatl and The Chinchontepec Underworlds", desc: "The story of a brave Indian woman." },
          es: { name: "Cuicuizcatl y Los Inframundos de Chinchontepec", desc: "La historia de una indígena valiente." },
          zh: { name: "翠翠 和 钦春德佩克的地下世界", desc: "一个勇敢的印度女人的故事。" }
        },
        loc: [13.596231, -88.831214]
      }
    ]
  }
};

let translationsData;
let mapsInitialized = false;
let leafletAssetsPromise;
let modalMapState;

function getLegendTranslation(key) {
  return window.translations?.mapLegends?.[key] || {
    name: key,
    desc: ""
  };
}

function getCurrentLanguage() {
  return typeof lang === "string" ? lang : (document.documentElement.lang || "en").slice(0, 2);
}

function getMapItemText(item) {
  if (item.key) {
    return getLegendTranslation(item.key);
  }

  const currentLanguage = getCurrentLanguage();
  return item.lang?.[currentLanguage] || item.lang?.en || {
    name: "",
    desc: ""
  };
}

function loadStylesheetOnce(id, href) {
  if (document.getElementById(id)) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = href;
    link.crossOrigin = "";
    link.onload = resolve;
    link.onerror = reject;
    document.head.appendChild(link);
  });
}

function loadScriptOnce(id, src) {
  if (document.getElementById(id)) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.id = id;
    script.src = src;
    script.async = true;
    script.crossOrigin = "";
    script.onload = resolve;
    script.onerror = reject;
    document.body.appendChild(script);
  });
}

function ensureLeafletLoaded() {
  if (window.L) {
    return Promise.resolve();
  }

  if (!leafletAssetsPromise) {
    leafletAssetsPromise = Promise.all([
      loadStylesheetOnce(
        "leaflet_css",
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css"
      ),
      loadScriptOnce(
        "leaflet_js",
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js"
      )
    ]);
  }

  return leafletAssetsPromise;
}

function getMarker(id) {
  return L.icon({
    iconUrl: `img/markers/number_${id}.png`,
    iconSize: [32, 37],
    popupAnchor: [0, -10]
  });
}

function addLegendMarkers(mapInstance, items) {
  items.forEach((obj) => {
    const marker = getMarker(obj.id);
    const legend = getMapItemText(obj);

    L.marker(obj.loc, { icon: marker }).addTo(mapInstance)
      .bindPopup(`<b>${legend.name}</b><br>${legend.desc}`);
  });
}

function buildLegendListHtml(items) {
  return `
    <ol class="list-group list-group-numbered">
      ${items.map((item) => {
        const legend = getMapItemText(item);
        return `<li>${legend.name}</li>`;
      }).join("")}
    </ol>
  `;
}

function createLegendMap(mapId, items, center, zoom) {
  const mapInstance = L.map(mapId).setView(center, zoom);

  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 20,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  }).addTo(mapInstance);

  addLegendMarkers(mapInstance, items);
  return mapInstance;
}

function getCollectionTitle(collection) {
  const currentLanguage = getCurrentLanguage();
  return collection.title?.[currentLanguage] || collection.title?.en || "";
}

function renderLegendLists() {
  const svList = document.getElementById("legendListSV");
  const esList = document.getElementById("legendListES");
  const modalList = document.getElementById("storiesList");

  if (svList) {
    svList.innerHTML = buildLegendListHtml(legends);
  }

  if (esList) {
    esList.innerHTML = buildLegendListHtml(legends2);
  }

  if (modalList) {
    modalList.innerHTML = buildLegendListHtml([...legends, ...legends2]);
  }
}

async function initMaps() {
  if (mapsInitialized || !translationsData) {
    return;
  }

  const previewSection = document.getElementById("preview");
  if (!previewSection) {
    return;
  }

  mapsInitialized = true;

  try {
    await ensureLeafletLoaded();
  } catch (error) {
    mapsInitialized = false;
    console.error("Unable to load Leaflet assets:", error);
    return;
  }

  createLegendMap("map", legends, [13.8029939, -88.9053364], 8.4);
  createLegendMap("map2", legends2, [39.896027, -2.487694], 5.4);

  renderLegendLists();
}

async function renderVolumeMapModal(collectionKey) {
  const collection = volumeMapCollections[collectionKey];
  const title = document.getElementById("volumeMapModalTitle");
  const list = document.getElementById("volumeMapLegendList");
  const mapElement = document.getElementById("volumeMap");

  if (!collection || !title || !list || !mapElement) {
    return;
  }

  title.textContent = getCollectionTitle(collection);
  list.innerHTML = buildLegendListHtml(collection.items);

  try {
    await ensureLeafletLoaded();
  } catch (error) {
    console.error("Unable to load Leaflet assets:", error);
    return;
  }

  if (modalMapState?.key !== collectionKey) {
    if (modalMapState?.map) {
      modalMapState.map.remove();
    }

    modalMapState = {
      key: collectionKey,
      map: createLegendMap(
      "volumeMap",
      collection.items,
      collection.center,
      collection.zoom
      )
    };
  }

  modalMapState.map.invalidateSize();
}

function initVolumeMapModal() {
  const modal = document.getElementById("volumeMapModal");
  if (!modal) {
    return;
  }

  modal.addEventListener("shown.bs.modal", (event) => {
    const collectionKey = event.relatedTarget?.dataset.volumeMapTarget;
    renderVolumeMapModal(collectionKey);
  });

  modal.addEventListener("hidden.bs.modal", () => {
    modalMapState?.map.closePopup();
  });
}

function initMapsWhenVisible() {
  const previewSection = document.getElementById("preview");
  if (!previewSection) {
    return;
  }

  if (!("IntersectionObserver" in window)) {
    initMaps();
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        observer.disconnect();
        initMaps();
      }
    });
  }, { rootMargin: "300px 0px" });

  observer.observe(previewSection);
}

window.addEventListener("translationsLoaded", (event) => {
  translationsData = event.detail.translations;
  window.translations = translationsData;
  initMapsWhenVisible();
});

document.addEventListener("DOMContentLoaded", () => {
  if (window.translations) {
    translationsData = window.translations;
    initMapsWhenVisible();
  }

  initVolumeMapModal();
});
