const CACHE_NAME = "astra-tarot-v11";
const CARD_RANKS = [
  "ace",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
  "page",
  "knight",
  "queen",
  "king",
];
const CARD_SUITS = ["wands", "cups", "swords", "pentacles"];
const CARD_IDS = [
  ...Array.from({ length: 22 }, (_, index) => `major-${index}`),
  ...CARD_SUITS.flatMap((suit) => CARD_RANKS.map((rank) => `${suit}-${rank}`)),
];
const DECK_FILES = [
  ...CARD_IDS.map((cardId) => `./assets/rws/${cardId}.jpg`),
  "./assets/rws/card-back-rws.jpg",
  ...CARD_IDS.map((cardId) => `./assets/decks/arnoult/${cardId}.png`),
  "./assets/decks/arnoult/card-back.jpg",
  ...CARD_IDS.map(
    (cardId) =>
      `./assets/decks/swiss-1jj/${cardId}.${cardId === "major-5" ? "png" : "jpg"}`,
  ),
  "./assets/decks/swiss-1jj/card-back.png",
  ...CARD_IDS.map((cardId) => `./assets/decks/piedmont/${cardId}.jpg`),
  "./assets/decks/piedmont/card-back.jpg",
];
const CORE_FILES = [
  "./",
  "./index.html",
  "./src/styles/index.css",
  "./src/styles/foundation.css",
  "./src/styles/setup.css",
  "./src/styles/cards.css",
  "./src/styles/insights.css",
  "./src/styles/history.css",
  "./src/styles/desktop.css",
  "./src/styles/wide.css",
  "./src/styles/responsive.css",
  "./src/styles/accent-tokens.css",
  "./src/app/bootstrap.js",
  "./src/app/legacy-runtime.js",
  "./src/app/events.js",
  "./src/app/controllers/reading-controller.js",
  "./src/app/selectors/current-selection.js",
  "./src/app/state/reading-state.js",
  "./src/ui/animations/reading.js",
  "./src/ui/components/toast.js",
  "./src/ui/dom.js",
  "./src/ui/safe-dom.js",
  "./src/ui/renderers/history.js",
  "./src/ui/renderers/setup.js",
  "./src/config/decks.js",
  "./src/config/accent-tokens.js",
  "./src/config/legacy-storage.js",
  "./src/core/html.js",
  "./src/core/random/business-random.js",
  "./src/platform/assets.js",
  "./src/platform/entropy.js",
  "./src/platform/lifecycle-client.js",
  "./src/platform/pwa-client.js",
  "./src/storage/settings.js",
  "./src/storage/legacy-history.js",
  "./src/storage/legacy-record.js",
  "./src/engine/legacy/card-reading.js",
  "./src/engine/legacy/synthesis.js",
  "./src/knowledge/legacy/cards/major.js",
  "./src/knowledge/legacy/cards/minor.js",
  "./src/knowledge/legacy/questions.js",
  "./src/knowledge/spreads/definitions.js",
  "./src/knowledge/legacy/build.js",
  "./src/knowledge/legacy/metadata.js",
  "./src/knowledge/legacy/index.js",
  "./app.js",
  "./icon.svg",
  "./manifest.webmanifest",
  ...DECK_FILES,
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_FILES)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))),
      ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  if (new URL(event.request.url).pathname.startsWith("/__astra/")) return;
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      })
      .catch(() => caches.match(event.request).then((cached) => cached || caches.match("./index.html"))),
  );
});
