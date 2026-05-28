const tabs = Array.from(document.querySelectorAll(".tab-button"));
const panels = Array.from(document.querySelectorAll(".tab-panel"));
const tabTriggers = Array.from(document.querySelectorAll("[data-open-tab]"));
const mapInvalidationDelay = 80;
const ideaPad = document.getElementById("ideaPad");
const ideaSaveStatus = document.getElementById("ideaSaveStatus");
const ideaStorageKey = "bouees-cote-azur-bac-idee";

function activateTab(button) {
  if (!button) {
    return;
  }

  tabs.forEach((tab) => {
    const active = tab === button;
    tab.classList.toggle("active", active);
    tab.setAttribute("aria-selected", String(active));
  });

  panels.forEach((panel) => {
    panel.classList.toggle("active", panel.id === button.getAttribute("aria-controls"));
  });

  setTimeout(() => {
    existingMap?.invalidateSize();
    projectMap?.invalidateSize();
  }, mapInvalidationDelay);
}

function openTab(panelId, updateHash = true) {
  const button = tabs.find((tab) => tab.getAttribute("aria-controls") === panelId);
  activateTab(button);

  if (button && updateHash) {
    history.replaceState(null, "", `#${panelId}`);
  }
}

tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    openTab(tab.getAttribute("aria-controls"));
  });

  tab.addEventListener("keydown", (event) => {
    const current = tabs.indexOf(tab);

    if (event.key === "ArrowRight") {
      event.preventDefault();
      tabs[(current + 1) % tabs.length].focus();
    }
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      tabs[(current - 1 + tabs.length) % tabs.length].focus();
    }
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openTab(tab.getAttribute("aria-controls"));
    }
  });
});

tabTriggers.forEach((trigger) => {
  trigger.addEventListener("click", (event) => {
    event.preventDefault();
    openTab(trigger.dataset.openTab);
    document.getElementById("tabs")?.scrollIntoView({ behavior: "smooth" });
  });
});

const initialPanel = window.location.hash.slice(1);
if (initialPanel) {
  openTab(initialPanel, false);
  document.getElementById("tabs")?.scrollIntoView();
}

if (window.lucide) {
  window.lucide.createIcons();
}

if (ideaPad) {
  try {
    ideaPad.value = localStorage.getItem(ideaStorageKey) || "";
  } catch (error) {
    if (ideaSaveStatus) {
      ideaSaveStatus.textContent = "Sauvegarde indisponible";
    }
  }

  ideaPad.addEventListener("input", () => {
    try {
      localStorage.setItem(ideaStorageKey, ideaPad.value);

      if (ideaSaveStatus) {
        ideaSaveStatus.textContent = "Enregistré";
      }
    } catch (error) {
      if (ideaSaveStatus) {
        ideaSaveStatus.textContent = "Sauvegarde indisponible";
      }
    }
  });
}

const existingPoints = [
  { name: "Sainte-Marguerite NW", coords: [43.526, 7.044], meta: "DONIA · 24-70 m" },
  { name: "Sainte-Marguerite SW", coords: [43.514, 7.024], meta: "DONIA · 24-70 m" },
  { name: "Sainte-Marguerite NE", coords: [43.526, 7.058], meta: "DONIA · 24-70 m" },
  { name: "Sainte-Marguerite SE", coords: [43.512, 7.055], meta: "DONIA · 24-70 m" },
  { name: "Golfe-Juan 1", coords: [43.548, 7.086], meta: "DONIA · 24-70 m" },
  { name: "Golfe-Juan 2", coords: [43.548, 7.097], meta: "DONIA · 24-70 m" },
  { name: "Golfe-Juan 3", coords: [43.545, 7.106], meta: "DONIA · 24-70 m" },
  { name: "Eze / Beaulieu 1", coords: [43.719, 7.357], meta: "DONIA · 24-70 m" },
  { name: "Eze / Beaulieu 2", coords: [43.718, 7.365], meta: "DONIA · 24-70 m" },
  { name: "Eze / Beaulieu 3", coords: [43.716, 7.373], meta: "DONIA · 24-70 m" },
  { name: "Pampelonne grande plaisance", coords: [43.238, 6.675], meta: "ZMEL · 60 places grande plaisance" },
];

const projectZones = [
  { name: "Beaulieu / Cap Ferrat", coords: [43.705, 7.338], count: 6, meta: "Extension premium 24-80 m" },
  { name: "Lérins / Cannes", coords: [43.518, 7.039], count: 5, meta: "Nuitées et événements Cannes" },
  { name: "Golfe-Juan / Cap d’Antibes", coords: [43.548, 7.105], count: 5, meta: "Délestage zones AIS fortes" },
  { name: "Golfe de Saint-Tropez", coords: [43.285, 6.64], count: 6, meta: "Complément hors Pampelonne" },
];

function markerIcon(kind = "existing") {
  return L.divIcon({
    className: "",
    html: `<div class="marker-dot ${kind === "project" ? "project" : ""}"></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });
}

let existingMap;
let projectMap;

function makeBaseMap(id, center, zoom) {
  const map = L.map(id, {
    scrollWheelZoom: false,
    zoomControl: true,
  }).setView(center, zoom);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 18,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  }).addTo(map);

  return map;
}

if (window.L) {
  existingMap = makeBaseMap("existingMap", [43.52, 6.98], 9);
  existingPoints.forEach((point) => {
    L.marker(point.coords, { icon: markerIcon() })
      .addTo(existingMap)
      .bindPopup(`<b>${point.name}</b><br>${point.meta}<br><small>Coordonnées indicatives</small>`);
  });

  const pampelonne = [
    [43.217, 6.65],
    [43.261, 6.668],
    [43.257, 6.694],
    [43.212, 6.676],
  ];
  L.polygon(pampelonne, {
    color: "#b99661",
    fillColor: "#b99661",
    fillOpacity: 0.16,
    weight: 2,
  })
    .addTo(existingMap)
    .bindPopup("Pampelonne Mooring · périmètre indicatif de baie");

  projectMap = makeBaseMap("projectMap", [43.49, 6.93], 9);
  projectZones.forEach((zone) => {
    L.marker(zone.coords, { icon: markerIcon("project") })
      .addTo(projectMap)
      .bindPopup(`<b>${zone.name}</b><br>${zone.count} bouées proposées<br>${zone.meta}`);

    L.circle(zone.coords, {
      radius: zone.count * 420,
      color: "#d86b4f",
      fillColor: "#d86b4f",
      fillOpacity: 0.12,
      weight: 1,
    }).addTo(projectMap);
  });
}
