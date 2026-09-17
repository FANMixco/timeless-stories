const {
  legends = [],
  legends2 = [],
  volumeMapCollections = {}
} = window.TimelessStoriesMapData || {};

let translationsData;
let mapsInitialized = false;
let leafletAssetsPromise;
let modalMapState;
const volumeMapTranslationCache = new Map();
const mirrorComparisonState = {
  maps: {},
  markers: {
    salvador: new Map(),
    spain: new Map()
  },
  selectedId: null
};

function getLegendTranslation(key) {
  return window.translations?.mapLegends?.[key] || {
    name: key,
    desc: ""
  };
}

function getCurrentLanguage() {
  return typeof lang === "string" ? lang : (document.documentElement.lang || "en").slice(0, 2);
}

function getMapItemText(item, language = getCurrentLanguage()) {
  if (item.key) {
    return getLegendTranslation(item.key);
  }

  return item.lang?.[language] || item.lang?.en || {
    name: "",
    desc: ""
  };
}

async function loadVolumeMapTranslations(language) {
  const requestedLanguage = language || getCurrentLanguage();

  if (requestedLanguage === getCurrentLanguage() && window.translations) {
    return window.translations;
  }

  if (!volumeMapTranslationCache.has(requestedLanguage)) {
    const cacheVersion = window.timelessStoriesI18nCacheVersion || "20260913-volume-map-i18n";
    const response = await fetch(`js/i18n/lang-${requestedLanguage}.min.json?v=${cacheVersion}`);

    if (!response.ok) {
      throw new Error(`Unable to load map translations for ${requestedLanguage}`);
    }

    volumeMapTranslationCache.set(requestedLanguage, (await response.json()).translations || {});
  }

  return volumeMapTranslationCache.get(requestedLanguage);
}

function getVolumeMapCollectionText(collectionKey, mapTranslations) {
  return mapTranslations?.volumeMaps?.[collectionKey] || {
    title: "",
    items: {}
  };
}

function getVolumeMapItemText(collectionKey, item, mapTranslations) {
  const itemText = getVolumeMapCollectionText(collectionKey, mapTranslations).items?.[item.id] || {};

  return {
    name: itemText.name || "",
    desc: itemText.desc || ""
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

function retryTileLoad(event) {
  const tile = event.tile;

  if (!tile || tile.dataset.retryAttempted === "true") {
    return;
  }

  tile.dataset.retryAttempted = "true";

  window.setTimeout(() => {
    const separator = tile.src.includes("?") ? "&" : "?";
    tile.src = `${tile.src}${separator}retry=${Date.now()}`;
  }, 250);
}

function refreshLeafletMap(mapInstance) {
  if (!mapInstance) {
    return;
  }

  const invalidate = () => mapInstance.invalidateSize({ pan: false });

  if (typeof requestAnimationFrame === "function") {
    requestAnimationFrame(invalidate);
    requestAnimationFrame(() => requestAnimationFrame(invalidate));
  }

  [80, 250, 600].forEach((delay) => {
    window.setTimeout(invalidate, delay);
  });
}

function getPopupContent(legend) {
  return legend.desc
    ? `<b>${legend.name}</b><br>${legend.desc}`
    : `<b>${legend.name}</b>`;
}

function setMirrorMarkerSelected(marker, isSelected) {
  const markerElement = marker?.getElement?.();

  if (markerElement) {
    markerElement.classList.toggle("mirror-comparison-marker-selected", isSelected);
  }
}

function clearMirrorSelection() {
  if (!mirrorComparisonState.selectedId) {
    return;
  }

  Object.values(mirrorComparisonState.markers).forEach((markers) => {
    const marker = markers.get(mirrorComparisonState.selectedId);
    setMirrorMarkerSelected(marker, false);
    marker?.closePopup();
  });

  mirrorComparisonState.selectedId = null;
}

function selectMirrorPair(pairId) {
  clearMirrorSelection();
  mirrorComparisonState.selectedId = pairId;

  Object.values(mirrorComparisonState.markers).forEach((markers) => {
    const marker = markers.get(pairId);

    if (marker) {
      setMirrorMarkerSelected(marker, true);
      marker.openPopup();
    }
  });
}

function addLegendMarkers(mapInstance, items, language, mapTranslations, collectionKey, comparisonSide) {
  items.forEach((obj) => {
    const marker = getMarker(obj.id);
    const legend = collectionKey
      ? getVolumeMapItemText(collectionKey, obj, mapTranslations)
      : getMapItemText(obj, language);
    const leafletMarker = L.marker(obj.loc, { icon: marker }).addTo(mapInstance)
      .bindPopup(getPopupContent(legend));

    if (comparisonSide) {
      mirrorComparisonState.markers[comparisonSide].set(obj.id, leafletMarker);
      leafletMarker.on("click", () => selectMirrorPair(obj.id));
      leafletMarker.on("add", () => {
        setMirrorMarkerSelected(
          leafletMarker,
          mirrorComparisonState.selectedId === obj.id
        );
      });
    }
  });
}

function buildLegendListHtml(items, language, mapTranslations, collectionKey) {
  const listClass = collectionKey
    ? "volume-map-list"
    : "list-group list-group-numbered";

  return `
    <ol class="${listClass}">
      ${items.map((item) => {
        const legend = collectionKey
          ? getVolumeMapItemText(collectionKey, item, mapTranslations)
          : getMapItemText(item, language);
        return `<li>${legend.name}</li>`;
      }).join("")}
    </ol>
  `;
}

function createLegendMap(mapId, items, center, zoom, language, mapTranslations, collectionKey, comparisonSide) {
  const mapInstance = L.map(mapId).setView(center, zoom);

  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 20,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  }).on("tileerror", retryTileLoad).addTo(mapInstance);

  addLegendMarkers(
    mapInstance,
    items,
    language,
    mapTranslations,
    collectionKey,
    comparisonSide
  );
  return mapInstance;
}

function getCollectionTitle(collectionKey, mapTranslations) {
  return getVolumeMapCollectionText(collectionKey, mapTranslations).title || "";
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

  mirrorComparisonState.maps.salvador = createLegendMap(
    "map",
    legends,
    [13.8029939, -88.9053364],
    8.4,
    undefined,
    undefined,
    undefined,
    "salvador"
  );
  mirrorComparisonState.maps.spain = createLegendMap(
    "map2",
    legends2,
    [39.896027, -2.487694],
    5.4,
    undefined,
    undefined,
    undefined,
    "spain"
  );

  renderLegendLists();
}

async function renderVolumeMapModal(collectionKey, language) {
  const collection = volumeMapCollections[collectionKey];
  const title = document.getElementById("volumeMapModalTitle");
  const list = document.getElementById("volumeMapLegendList");
  const mapElement = document.getElementById("volumeMap");

  if (!collection || !title || !list || !mapElement) {
    return;
  }

  const mapLanguage = language || getCurrentLanguage();
  const modalStateKey = `${collectionKey}:${mapLanguage}`;

  let mapTranslations;

  try {
    mapTranslations = await loadVolumeMapTranslations(mapLanguage);
  } catch (error) {
    console.error("Unable to load volume map translations:", error);
    return;
  }

  title.textContent = getCollectionTitle(collectionKey, mapTranslations);
  list.innerHTML = buildLegendListHtml(
    collection.items,
    mapLanguage,
    mapTranslations,
    collectionKey
  );

  try {
    await ensureLeafletLoaded();
  } catch (error) {
    console.error("Unable to load Leaflet assets:", error);
    return;
  }

  if (modalMapState?.key !== modalStateKey) {
    if (modalMapState?.map) {
      modalMapState.map.remove();
    }

    modalMapState = {
      key: modalStateKey,
      map: createLegendMap(
        "volumeMap",
        collection.items,
        collection.center,
        collection.zoom,
        mapLanguage,
        mapTranslations,
        collectionKey
      )
    };
  }

  refreshLeafletMap(modalMapState.map);
}

function initVolumeMapModal() {
  const modal = document.getElementById("volumeMapModal");
  if (!modal) {
    return;
  }

  modal.addEventListener("shown.bs.modal", (event) => {
    const collectionKey = event.relatedTarget?.dataset.volumeMapTarget;
    const mapLanguage = event.relatedTarget?.dataset.volumeMapLanguage;
    renderVolumeMapModal(collectionKey, mapLanguage);
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
