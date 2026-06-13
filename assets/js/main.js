const soundState = {
  selectedId: null,
  features: [],
};

const fallbackFeature = {
  properties: {
    id: "fallback",
    title: "さいたまの音",
    place: "音地図",
    description: "地図上の録音地点を選ぶと、ここに説明と録音メモが表示されます。",
    note: "自動再生はしません。聴きたい地点を選んで、プレイヤーから再生してください。",
    soundcloudUrl: "",
    photo: "assets/img/hero.jpg",
    tags: ["sample", "soundmap"],
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
};

const mapContainer = document.querySelector("#map");
const soundMapSection = document.querySelector("#sound-map");

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
  minZoom: 10,
  maxZoom: 17,
  cooperativeGestures: true,
  attributionControl: false,
});

window.frcsSoundMap = {
  map,
  selectById(id) {
    const feature = soundState.features.find((item) => item.properties.id === id);
    if (feature) {
      renderPanel(feature);
      map.easeTo({
        center: feature.geometry.coordinates,
        zoom: Math.max(map.getZoom(), 13.15),
        duration: 700,
      });
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
  return `https://w.soundcloud.com/player/?url=${encodedUrl}&color=%2324483e&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false&visual=false`;
}

function renderPanel(feature) {
  const props = feature.properties;
  soundState.selectedId = props.id;

  els.place.textContent = props.place;
  els.title.textContent = props.title;
  els.description.textContent = props.description;
  els.note.textContent = props.note;
  els.photo.src = props.photo || "assets/img/hero.jpg";
  els.photo.alt = `${props.place}の仮イメージ`;

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
  } else {
    els.player.className = "player-placeholder";
    els.player.innerHTML = "<p>SoundCloud URLを設定すると、ここにプレイヤーが表示されます。</p>";
  }

  if (map.getLayer("sound-points")) {
    map.setPaintProperty("sound-points", "circle-radius", [
      "case",
      ["==", ["get", "id"], props.id],
      11,
      7,
    ]);
    map.setPaintProperty("sound-points", "circle-color", [
      "case",
      ["==", ["get", "id"], props.id],
      "#b44735",
      "#c26c3a",
    ]);
  }
}

async function loadSounds() {
  const response = await fetch("data/sounds.geojson");
  if (!response.ok) {
    throw new Error(`Failed to load sounds.geojson: ${response.status}`);
  }
  return response.json();
}

map.on("load", async () => {
  try {
    const geojson = await loadSounds();
    soundState.features = geojson.features;

    map.addSource("sounds", {
      type: "geojson",
      data: geojson,
    });

    map.addLayer({
      id: "sound-points",
      type: "circle",
      source: "sounds",
      paint: {
        "circle-radius": 7,
        "circle-color": "#c26c3a",
        "circle-stroke-color": "#fffdf7",
        "circle-stroke-width": 2,
        "circle-opacity": 0.96,
      },
    });

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

    map.on("mouseenter", "sound-points", () => {
      map.getCanvas().style.cursor = "pointer";
    });

    map.on("mouseleave", "sound-points", () => {
      map.getCanvas().style.cursor = "";
    });

    map.on("click", "sound-points", (event) => {
      const feature = event.features[0];
      renderPanel(feature);
      map.easeTo({
        center: feature.geometry.coordinates,
        zoom: Math.max(map.getZoom(), 13.15),
        duration: 700,
      });
    });

    renderPanel(geojson.features[0] || fallbackFeature);
  } catch (error) {
    console.error(error);
    renderPanel(fallbackFeature);
  }
});
}
