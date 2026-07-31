const CACHE_NAME = "astra-tarot-v6";
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
  "./data.js",
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
