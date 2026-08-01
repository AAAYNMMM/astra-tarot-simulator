import {
  RELEASE_PROTOCOL_VERSION,
  activationDecision,
  createClientReport,
} from "./release-protocol.js";

function createId(cryptoRef = globalThis.crypto) {
  const bytes = new Uint32Array(2);
  if (cryptoRef?.getRandomValues) cryptoRef.getRandomValues(bytes);
  else { bytes[0] = Date.now() >>> 0; bytes[1] = (Date.now() * 2654435761) >>> 0; }
  return [...bytes].map((value) => value.toString(16).padStart(8, "0")).join("");
}

export function createPwaUpdateCoordinator({
  navigatorRef = globalThis.navigator,
  windowRef = globalThis.window,
  BroadcastChannelCtor = windowRef?.BroadcastChannel ?? globalThis.BroadcastChannel,
  channelName = "astra-release-v1",
  responseTimeoutMs = 1800,
  getClientState = () => "unknown",
  getCurrentReleaseId = () => null,
  onUpdateAvailable = () => {},
  onActivated = () => {},
} = {}) {
  const clientId = createId(windowRef?.crypto);
  const reports = new Map();
  const channel = typeof BroadcastChannelCtor === "function"
    ? new BroadcastChannelCtor(channelName)
    : null;
  let registration = null;
  let pendingReleaseId = null;
  let closed = false;

  function currentReport() {
    return createClientReport({
      clientId,
      releaseId: getCurrentReleaseId(),
      state: getClientState(),
    });
  }

  function reportState() {
    const report = currentReport();
    reports.set(clientId, report);
    channel?.postMessage(report);
    navigatorRef?.serviceWorker?.controller?.postMessage?.(report);
    return report;
  }

  function handleChannelMessage(event) {
    const message = event?.data;
    if (!message || message.protocolVersion !== RELEASE_PROTOCOL_VERSION) return;
    if (message.type === "ASTRA_QUERY_CLIENT_STATE") { reportState(); return; }
    if (message.type === "ASTRA_CLIENT_STATE") reports.set(message.clientId, message);
    if (message.type === "ASTRA_RELEASE_ACTIVATED") onActivated(message);
  }

  if (channel) channel.onmessage = handleChannelMessage;

  function sendWaiting(message) {
    registration?.waiting?.postMessage?.(message);
  }

  async function requestActivation({ force = false } = {}) {
    reports.clear();
    reportState();
    channel?.postMessage({
      protocolVersion: RELEASE_PROTOCOL_VERSION,
      type: "ASTRA_QUERY_CLIENT_STATE",
      requester: clientId,
    });
    await new Promise((resolve) => windowRef?.setTimeout?.(resolve, responseTimeoutMs) ?? resolve());
    const decision = activationDecision([...reports.values()], { force });
    if (!decision.allowed) return Object.freeze({ ...decision, activated: false });
    sendWaiting({
      protocolVersion: RELEASE_PROTOCOL_VERSION,
      type: "ASTRA_ACTIVATE_RELEASE",
      releaseId: pendingReleaseId,
      requester: clientId,
      force,
    });
    return Object.freeze({ ...decision, activated: true });
  }

  function requestRollback() {
    navigatorRef?.serviceWorker?.controller?.postMessage?.({
      protocolVersion: RELEASE_PROTOCOL_VERSION,
      type: "ASTRA_ROLLBACK_RELEASE",
      requester: clientId,
    });
  }

  function observeRegistration(nextRegistration) {
    registration = nextRegistration;
    function announceWaiting() {
      if (!registration?.waiting) return;
      pendingReleaseId = registration.waiting.scriptURL || "waiting-release";
      onUpdateAvailable(Object.freeze({
        releaseId: pendingReleaseId,
        activate: requestActivation,
      }));
    }
    announceWaiting();
    registration?.addEventListener?.("updatefound", () => {
      const worker = registration.installing;
      worker?.addEventListener?.("statechange", () => {
        if (worker.state === "installed") announceWaiting();
      });
    });
    navigatorRef?.serviceWorker?.addEventListener?.("controllerchange", () => {
      channel?.postMessage({
        protocolVersion: RELEASE_PROTOCOL_VERSION,
        type: "ASTRA_RELEASE_ACTIVATED",
        releaseId: pendingReleaseId,
      });
      onActivated({ releaseId: pendingReleaseId });
    });
  }

  function close() {
    if (closed) return;
    closed = true;
    channel?.close?.();
  }

  return Object.freeze({
    clientId,
    observeRegistration,
    reportState,
    requestActivation,
    requestRollback,
    close,
  });
}
