import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  RELEASE_PROTOCOL_VERSION,
  activationDecision,
  createClientReport,
  reportAllowsActivation,
} from "../src/platform/release-protocol.js";
import { createPwaUpdateCoordinator } from "../src/platform/pwa-update-coordinator.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sw = fs.readFileSync(path.join(root, "sw.js"), "utf8");
const manifest = JSON.parse(fs.readFileSync(path.join(root, "manifest.webmanifest"), "utf8"));

assert.equal(RELEASE_PROTOCOL_VERSION, "1.0.0");
assert.equal(reportAllowsActivation(createClientReport({ state: "idle" })), true);
assert.equal(reportAllowsActivation(createClientReport({ state: "reading" })), false);
assert.equal(
  activationDecision([
    createClientReport({ clientId: "a", state: "idle" }),
    createClientReport({ clientId: "b", state: "pending-save" }),
  ]).allowed,
  false,
);

assert.match(sw, /astra-stage-\$\{releaseId\}-\$\{kind\}/);
assert.match(sw, /stageRequiredResources/);
assert.match(sw, /promoteStagedRelease/);
assert.match(sw, /ASTRA_ACTIVATE_RELEASE/);
assert.match(sw, /ASTRA_ROLLBACK_RELEASE/);
assert.match(sw, /previousReleaseId/);
assert.match(sw, /includeUncontrolled: true/);
assert.equal(/install[\s\S]{0,500}skipWaiting/.test(sw), false);
assert.equal(sw.includes("clients.claim"), false);
assert.match(sw, /crypto\.subtle\.digest\("SHA-256"/);
assert.match(sw, /ASTRA_DECK_PROGRESS/);
assert.match(sw, /ASTRA_DELETE_DECK/);

const iconExpectations = new Map([
  ["icon-192.png", 192],
  ["icon-512.png", 512],
  ["icon-maskable-192.png", 192],
  ["icon-maskable-512.png", 512],
]);
for (const [relative, expectedSize] of iconExpectations) {
  const bytes = fs.readFileSync(path.join(root, relative));
  assert.equal(bytes.toString("hex", 1, 4), "504e47", relative);
  assert.equal(bytes.readUInt32BE(16), expectedSize, relative);
  assert.equal(bytes.readUInt32BE(20), expectedSize, relative);
}
const iconPaths = new Set(manifest.icons.map((item) => item.src.replace(/^\.\//, "")));
for (const relative of iconExpectations.keys()) assert.equal(iconPaths.has(relative), true, relative);
assert.equal(manifest.icons.some((item) => item.purpose === "maskable"), true);

class FakeChannel {
  static instances = [];
  constructor() {
    this.listeners = [];
    FakeChannel.instances.push(this);
  }
  addEventListener(_name, listener) { this.listeners.push(listener); }
  removeEventListener() {}
  postMessage(message) {
    for (const instance of FakeChannel.instances) {
      if (instance !== this) instance.listeners.forEach((listener) => listener({ data: message }));
    }
  }
  close() {}
}
const workerMessages = [];
const waiting = { scriptURL: "http://local/sw.js?release=2.0.0-test", postMessage: (message) => workerMessages.push(message) };
const registration = {
  waiting,
  addEventListener() {},
};
const serviceWorkerListeners = new Map();
const fakeNavigator = {
  serviceWorker: {
    controller: {},
    addEventListener(name, listener) { serviceWorkerListeners.set(name, listener); },
    removeEventListener() {},
  },
};
const fakeWindow = {
  BroadcastChannel: FakeChannel,
  crypto: { randomUUID: () => "client-test" },
  setTimeout: (fn) => { fn(); return 1; },
};
const coordinator = createPwaUpdateCoordinator({
  navigatorRef: fakeNavigator,
  windowRef: fakeWindow,
  BroadcastChannelCtor: FakeChannel,
  getClientState: () => "idle",
  getCurrentReleaseId: () => "2.0.0-old",
  timeoutMs: 1,
});
coordinator.observeRegistration(registration);
const activation = await coordinator.requestActivation();
assert.equal(activation.activated, true);
assert.equal(workerMessages[0].type, "ASTRA_ACTIVATE_RELEASE");
assert.equal(workerMessages[0].protocolVersion, RELEASE_PROTOCOL_VERSION);
coordinator.close();

console.log("Phase 9 PWA update contract passed: staged atomic caches, controlled activation, rollback, icons, and deck management are wired.");
