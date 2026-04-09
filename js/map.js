const legends = [
  { id: 1, key: "blackKnight", loc: [13.667749, -89.290185] },
  { id: 2, key: "siguanaba", loc: [13.938237074475145, -89.19411245692653] },
  { id: 3, key: "goodAndBadCadejo", loc: [13.520926, -88.234184] },
  { id: 4, key: "mulus", loc: [13.676791, -89.27857] },
  { id: 5, key: "funeralCortegeOfChalchuapa", loc: [13.986932, -89.67835] },
  { id: 6, key: "fairJudgeOfTheNight", loc: [14.315494, -89.172335] },
  { id: 7, key: "weepingWoman", loc: [14.329334, -89.150234] },
  { id: 8, key: "headlessPriest", loc: [13.87073, -88.628353] },
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
  { id: 7, key: "ploranera", loc: [41.374722, 2.188840] },
  { id: 8, key: "ghostOfSanGines", loc: [40.417214803173316, -3.7071205413454735] },
  { id: 9, key: "girlOnTheCurve", loc: [40.903697, -3.880308] },
  { id: 10, key: "trasgu", loc: [43.187277, -4.820837] }
];

let mapsInitialized = false;

function getLegendTranslation(key) {
  return window.translations?.mapLegends?.[key] || {
    name: key,
    desc: ""
  };
}

function getMarker(id) {
  return L.icon({
    iconUrl: `img/markers/number_${id}.png`,
    iconSize: [32, 37],
    popupAnchor: [0, -10]
  });
}

function addLegendMarkers(mapInstance, items) {
  items.forEach(function(obj) {
    const marker = getMarker(obj.id);
    const legend = getLegendTranslation(obj.key);

    L.marker(obj.loc, { icon: marker }).addTo(mapInstance)
      .bindPopup(`<b>${legend.name}</b><br>${legend.desc}`);
  });
}

function buildLegendListHtml(items) {
  return `
    <ol class="list-group list-group-numbered">
      ${items.map((item) => {
        const legend = getLegendTranslation(item.key);
        return `<li>${legend.name}</li>`;
      }).join("")}
    </ol>
  `;
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

function initMaps() {
  if (mapsInitialized || !window.translations) {
    return;
  }

  mapsInitialized = true;

  const map = L.map("map").setView([13.8029939, -88.9053364], 8.4);
  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 20,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  }).addTo(map);
  addLegendMarkers(map, legends);

  const map2 = L.map("map2").setView([39.896027, -2.487694], 5.4);
  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 20,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  }).addTo(map2);
  addLegendMarkers(map2, legends2);

  renderLegendLists();
}

window.addEventListener("translationsLoaded", function(event) {
  window.translations = event.detail.translations;
  initMaps();
});

document.addEventListener("DOMContentLoaded", function() {
  if (window.translations) {
    initMaps();
  }
});
