from __future__ import annotations

import http.server
import threading
import time

DEFAULT_AUTO_CLOSE_GRACE_SECONDS = 3.0
CLIENT_STALE_SECONDS = 90.0


class AppServer(http.server.ThreadingHTTPServer):
    daemon_threads = True
    allow_reuse_address = False

    def __init__(self, *args: object, session_guard: object, **kwargs: object) -> None:
        super().__init__(*args, **kwargs)
        self.session_guard = session_guard
        self.auto_close_grace_seconds = DEFAULT_AUTO_CLOSE_GRACE_SECONDS
        self._lifecycle_lock = threading.Lock()
        self._active_clients: dict[str, float] = {}
        self._ever_connected = False
        self._empty_since: float | None = None
        self._monitor_stop = threading.Event()
        self._shutdown_started = False

    def register_client(self, client_id: str) -> None:
        with self._lifecycle_lock:
            self._active_clients[client_id] = time.monotonic()
            self._ever_connected = True
            self._empty_since = None

    def unregister_client(self, client_id: str) -> None:
        with self._lifecycle_lock:
            self._active_clients.pop(client_id, None)
            if self._ever_connected and not self._active_clients:
                self._empty_since = time.monotonic()

    def start_lifecycle_monitor(self) -> threading.Thread:
        thread = threading.Thread(target=self._monitor_lifecycle, name="astra-lifecycle", daemon=True)
        thread.start()
        return thread

    def _monitor_lifecycle(self) -> None:
        while not self._monitor_stop.wait(0.25):
            should_stop = False
            with self._lifecycle_lock:
                now = time.monotonic()
                stale = [client for client, seen in self._active_clients.items() if now - seen >= CLIENT_STALE_SECONDS]
                for client in stale:
                    self._active_clients.pop(client, None)
                if self._ever_connected and not self._active_clients and self._empty_since is None:
                    self._empty_since = now
                should_stop = (
                    self._ever_connected
                    and not self._active_clients
                    and self._empty_since is not None
                    and now - self._empty_since >= self.auto_close_grace_seconds
                    and not self._shutdown_started
                )
                if should_stop:
                    self._shutdown_started = True
            if should_stop:
                print("\n页面已关闭，正在停止星纱塔罗……")
                self.shutdown()
                return

    def stop_lifecycle_monitor(self) -> None:
        self._monitor_stop.set()

    def wait_for_lifecycle_stop(self, timeout: float) -> bool:
        return self._monitor_stop.wait(timeout)
