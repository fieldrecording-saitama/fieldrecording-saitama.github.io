import * as maplibregl from "maplibre-gl";
import maplibreWorkerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url";
import "maplibre-gl/dist/maplibre-gl.css";
import { withBase } from "../lib/url";

// MapLibre はワーカーの場所を import.meta.url から組み立てるため、バンドル後は
// 解決に失敗する。Vite が書き出したワーカーの URL を明示的に渡す。
maplibregl.setWorkerUrl(maplibreWorkerUrl);

const soundState = {
  selectedId: null,
  features: [],
  continuous: false,
  widget: null,
};

const fallbackFeature = {
  properties: {
    id: "fallback",
    title: "さいたまの音",
    place: "音地図",
    description: "地図上の録音地点を選ぶと、ここに説明と録音メモが表示されます。",
    note: "自動再生はしません。聴きたい地点を選んで、プレイヤーから再生してください。",
    soundcloudUrl: "",
    photo: withBase("/assets/img/hero.jpg"),
    tags: ["archive", "soundmap"],
  },
  geometry: {
    type: "Point",
    coordinates: [139.636, 35.912],
  },
};

const els = {
  place: document.querySelector("#sound-place"),
  title: document.querySelector("#sound-title"),
  description: document.querySelector("#sound-description"),
  note: document.querySelector("#sound-note"),
  tags: document.querySelector("#sound-tags"),
  photo: document.querySelector("#sound-photo"),
  player: document.querySelector("#sound-player"),
  continuousButton: document.querySelector("#continuous-play"),
  prevButton: document.querySelector("#prev-sound"),
  nextButton: document.querySelector("#next-sound"),
  counter: document.querySelector("#sound-counter"),
};

const mapContainer = document.querySelector("#map");
const soundMapSection = document.querySelector("#sound-map");
const soundPanel = document.querySelector(".sound-panel");


if (!mapContainer || soundMapSection?.hidden) {
  window.frcsSoundMap = { disabled: true };
} else {
const map = new maplibregl.Map({
  container: "map",
  style: {
    version: 8,
    sources: {
      osm: {
        type: "raster",
        tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
        tileSize: 256,
        attribution: "© OpenStreetMap contributors",
      },
    },
    layers: [
      {
        id: "osm",
        type: "raster",
        source: "osm",
        paint: {
          "raster-saturation": -0.45,
          "raster-contrast": -0.12,
          "raster-brightness-min": 0.16,
          "raster-brightness-max": 0.92,
        },
      },
    ],
  },
  center: [139.634, 35.914],
  zoom: 12.35,
  minZoom: 7,
  maxZoom: 17,
  cooperativeGestures: true,
  attributionControl: false,
});

window.frcsSoundMap = {
  map,
  selectById(id) {
    const feature = soundState.features.find((item) => item.properties.id === id);
    if (feature) {
      selectFeature(feature, { autoplay: soundState.continuous, focusMap: true });
    }
  },
};

map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-left");

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function buildSoundCloudSrc(soundcloudUrl) {
  if (!soundcloudUrl) {
    return "";
  }

  const encodedUrl = encodeURIComponent(soundcloudUrl);
  return `https://w.soundcloud.com/player/?url=${encodedUrl}&color=%2324483e&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_artwork=true&show_reposts=false&show_teaser=false&visual=false`;
}

function updateArtworkFallback() {
  if (!soundPanel || !els.player) {
    return;
  }

  soundPanel.classList.toggle("artwork-fallback", els.player.getBoundingClientRect().width < 440);
}

function updateContinuousButton() {
  if (!els.continuousButton) {
    return;
  }

  els.continuousButton.setAttribute("aria-label", soundState.continuous ? "連続再生をオフにする" : "連続再生をオンにする");
  els.continuousButton.setAttribute("aria-pressed", String(soundState.continuous));
}

function updateNavigationControls() {
  const hasMultipleSounds = soundState.features.length > 1;

  if (els.prevButton) {
    els.prevButton.disabled = !hasMultipleSounds;
  }

  if (els.nextButton) {
    els.nextButton.disabled = !hasMultipleSounds;
  }

  if (els.counter) {
    const selectedIndex = getSelectedIndex();
    els.counter.textContent = selectedIndex >= 0 ? `${selectedIndex + 1} / ${soundState.features.length}` : `- / ${soundState.features.length || "-"}`;
  }
}

function getSelectedIndex() {
  return soundState.features.findIndex((item) => item.properties.id === soundState.selectedId);
}

function getNextFeature() {
  if (!soundState.features.length) {
    return null;
  }

  const currentIndex = getSelectedIndex();
  const nextIndex = currentIndex < 0 ? 0 : (currentIndex + 1) % soundState.features.length;
  return soundState.features[nextIndex];
}

function getPrevFeature() {
  if (!soundState.features.length) {
    return null;
  }

  const currentIndex = getSelectedIndex();
  const prevIndex = currentIndex < 0 ? 0 : (currentIndex - 1 + soundState.features.length) % soundState.features.length;
  return soundState.features[prevIndex];
}

function selectFeature(feature, options = {}) {
  renderPanel(feature, options);

  if (options.focusMap) {
    map.easeTo({
      center: feature.geometry.coordinates,
      zoom: Math.max(map.getZoom(), 13.15),
      duration: 700,
    });
  }
}

function playCurrentWidget() {
  if (soundState.widget?.play) {
    soundState.widget.play();
  }
}

function playNextFeature() {
  const nextFeature = getNextFeature();
  if (!nextFeature) {
    return;
  }

  selectFeature(nextFeature, { autoplay: true, focusMap: true });
}

function goToNextFeature() {
  const nextFeature = getNextFeature();
  if (!nextFeature) {
    return;
  }

  selectFeature(nextFeature, { autoplay: soundState.continuous, focusMap: true });
}

function goToPrevFeature() {
  const prevFeature = getPrevFeature();
  if (!prevFeature) {
    return;
  }

  selectFeature(prevFeature, { autoplay: soundState.continuous, focusMap: true });
}

function setupSoundCloudWidget(iframe, shouldAutoplay = false) {
  soundState.widget = null;

  if (!window.SC?.Widget) {
    return;
  }

  const widget = window.SC.Widget(iframe);
  soundState.widget = widget;

  widget.bind(window.SC.Widget.Events.FINISH, () => {
    if (soundState.continuous) {
      playNextFeature();
    }
  });

  if (shouldAutoplay) {
    widget.bind(window.SC.Widget.Events.READY, () => {
      playCurrentWidget();
    });
  }
}

function renderPanel(feature, options = {}) {
  const props = feature.properties;
  soundState.selectedId = props.id;
  updateNavigationControls();

  els.place.textContent = props.place;
  els.title.textContent = props.title;
  els.description.textContent = props.description;
  els.note.textContent = props.note;
  els.photo.src = props.photo || withBase("/assets/img/hero.jpg");
  els.photo.alt = `${props.place}の写真`;
  updateArtworkFallback();

  const tags = Array.isArray(props.tags) ? props.tags : JSON.parse(props.tags || "[]");
  els.tags.replaceChildren(
    ...tags.map((tag) => {
      const item = document.createElement("span");
      item.textContent = `#${tag}`;
      return item;
    }),
  );

  const iframeSrc = buildSoundCloudSrc(props.soundcloudUrl);
  if (iframeSrc) {
    const iframe = document.createElement("iframe");
    iframe.className = "soundcloud-frame";
    iframe.title = `${props.title} SoundCloud player`;
    iframe.allow = "autoplay";
    iframe.loading = "lazy";
    iframe.src = iframeSrc;
    els.player.className = "";
    els.player.replaceChildren(iframe);
    updateArtworkFallback();
    setupSoundCloudWidget(iframe, options.autoplay);
  } else {
    soundState.widget = null;
    els.player.className = "player-placeholder";
    els.player.innerHTML = "<p>SoundCloud URLを設定すると、ここにプレイヤーが表示されます。</p>";
    updateArtworkFallback();
  }

  highlightSelected(props.id);
}

function highlightSelected(id) {
  if (!map.getLayer("sound-points")) {
    return;
  }

  map.setPaintProperty("sound-points", "circle-radius", ["case", ["==", ["get", "id"], id], 11, 7]);
  map.setPaintProperty("sound-points", "circle-color", [
    "case",
    ["==", ["get", "id"], id],
    "#b44735",
    "#c26c3a",
  ]);
}

if (els.continuousButton) {
  updateContinuousButton();

  els.continuousButton.addEventListener("click", () => {
    soundState.continuous = !soundState.continuous;
    updateContinuousButton();

    if (soundState.continuous) {
      playCurrentWidget();
    }
  });
}

if (els.nextButton) {
  updateNavigationControls();
  els.nextButton.addEventListener("click", goToNextFeature);
}

if (els.prevButton) {
  updateNavigationControls();
  els.prevButton.addEventListener("click", goToPrevFeature);
}

if (window.ResizeObserver && els.player) {
  const playerResizeObserver = new ResizeObserver(updateArtworkFallback);
  playerResizeObserver.observe(els.player);
} else {
  window.addEventListener("resize", updateArtworkFallback);
}

let soundsPromise = null;

async function loadSounds() {
  if (!soundsPromise) {
    soundsPromise = (async () => {
      const response = await fetch(withBase("/data/sounds.geojson"));
      if (!response.ok) {
        throw new Error(`Failed to load sounds.geojson: ${response.status}`);
      }
      return response.json();
    })();
  }

  return soundsPromise;
}

const SOUND_POINTS_PAINT = {
  "circle-radius": 7,
  "circle-color": "#c26c3a",
  "circle-stroke-color": "#fffdf7",
  "circle-stroke-width": 2,
  "circle-opacity": 0.96,
};

function addSoundLayers(geojson) {
  if (!map.getSource("sounds")) {
    map.addSource("sounds", {
      type: "geojson",
      data: geojson,
    });
  }

  if (!map.getLayer("sound-points")) {
    map.addLayer({
      id: "sound-points",
      type: "circle",
      source: "sounds",
      paint: { ...SOUND_POINTS_PAINT },
    });
  }

  if (!map.getLayer("sound-labels")) {
    map.addLayer({
      id: "sound-labels",
      type: "symbol",
      source: "sounds",
      layout: {
        "text-field": ["get", "displayName"],
        "text-size": 12,
        "text-offset": [0, 1.25],
        "text-anchor": "top",
      },
      paint: {
        "text-color": "#24483e",
        "text-halo-color": "#fffdf7",
        "text-halo-width": 1.6,
      },
    });
  }
}

function fitToSounds(geojson) {
  if (geojson.features.length < 2) {
    return;
  }

  const bounds = geojson.features.reduce((box, feature) => {
    return box.extend(feature.geometry.coordinates);
  }, new maplibregl.LngLatBounds(geojson.features[0].geometry.coordinates, geojson.features[0].geometry.coordinates));

  map.fitBounds(bounds, {
    padding: { top: 80, right: 80, bottom: 80, left: 80 },
    maxZoom: 14.6,
    duration: 0,
  });
}

function bindMapInteractions() {
  map.on("mouseenter", "sound-points", () => {
    map.getCanvas().style.cursor = "pointer";
  });

  map.on("mouseleave", "sound-points", () => {
    map.getCanvas().style.cursor = "";
  });

  map.on("click", "sound-points", (event) => {
    const feature = event.features[0];
    selectFeature(feature, { autoplay: soundState.continuous, focusMap: true });
  });
}

let soundMapReady = false;

// スタイルは読み込み直しが起きることがあり、そのたびに追加済みのソースとレイヤーが
// 失われる。load ではなく style.load を起点にして、毎回レイヤーを組み立て直す。
async function setUpSoundMap() {
  try {
    const geojson = await loadSounds();
    soundState.features = geojson.features;
    updateNavigationControls();

    addSoundLayers(geojson);

    if (!soundMapReady) {
      soundMapReady = true;
      fitToSounds(geojson);
      bindMapInteractions();
      renderPanel(geojson.features[0] || fallbackFeature);
    } else if (soundState.selectedId) {
      // スタイルを組み直した場合はハイライトだけ復元する。パネルを描き直すと
      // SoundCloudのiframeが作り直されて再生が止まってしまう。
      highlightSelected(soundState.selectedId);
    }
  } catch (error) {
    console.error(error);
    if (!soundMapReady) {
      soundMapReady = true;
      renderPanel(fallbackFeature);
    }
  }
}

map.on("style.load", setUpSoundMap);

if (map.isStyleLoaded()) {
  setUpSoundMap();
}
}
