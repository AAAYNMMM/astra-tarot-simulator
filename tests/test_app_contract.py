from __future__ import annotations

import functools
import http.cookiejar
import http.server
import pathlib
import threading
import unittest
import urllib.error
import urllib.request

import run as launcher

ROOT = pathlib.Path(__file__).resolve().parents[1]
STYLE_FILES = (
    "src/styles/index.css", "src/styles/foundation.css", "src/styles/setup.css",
    "src/styles/cards.css", "src/styles/insights.css", "src/styles/history.css",
    "src/styles/desktop.css", "src/styles/wide.css", "src/styles/responsive.css",
    "src/styles/accent-tokens.css",
)
APPLICATION_FILES = tuple(sorted(path.relative_to(ROOT).as_posix() for path in (ROOT / "src").rglob("*.js")))
KNOWLEDGE_FILES = tuple(path for path in APPLICATION_FILES if path.startswith("src/knowledge/") or path.startswith("src/engine/legacy/"))


def read_many(paths: tuple[str, ...]) -> str:
    return "\n".join((ROOT / path).read_text(encoding="utf-8") for path in paths)


def read_styles() -> str:
    return "".join((ROOT / path).read_text(encoding="utf-8") for path in STYLE_FILES[1:])


class TarotAppContractTests(unittest.TestCase):
    def test_required_runtime_files_exist_and_legacy_roots_are_gone(self) -> None:
        for relative in (
            "index.html", "run.py", "manifest.webmanifest", "sw.js", "icon.svg",
            "src/app/bootstrap.js", "src/app/application.js", "src/app/runtime-services.js",
            "src/ui/components/dialogs.js",
            "src/knowledge/legacy/index.js", "tests/fixtures/legacy-knowledge-fingerprint.json",
        ):
            self.assertTrue((ROOT / relative).is_file(), relative)
        for removed in ("app.js", "data.js", "styles.css", "src/app/legacy-runtime.js"):
            self.assertFalse((ROOT / removed).exists(), removed)

    def test_html_has_primary_interaction_contract(self) -> None:
        html = (ROOT / "index.html").read_text(encoding="utf-8")
        for element_id in ("categoryGrid", "questionPickerButton", "questionDialog", "questionList", "spreadList", "deckStyleList", "startReading", "cardTable", "insightContent", "historyDialog"):
            self.assertIn(f'id="{element_id}"', html)
        self.assertIn('type="module" src="src/app/bootstrap.js"', html)
        self.assertNotIn('src="app.js"', html)
        self.assertNotIn('src="data.js"', html)

    def test_four_complete_local_tarot_decks_are_bundled(self) -> None:
        ranks = ("ace", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "page", "knight", "queen", "king")
        card_ids = [f"major-{number}" for number in range(22)] + [f"{suit}-{rank}" for suit in ("wands", "cups", "swords", "pentacles") for rank in ranks]
        deck_specs = {
            ROOT / "assets" / "rws": lambda card_id: f"{card_id}.jpg",
            ROOT / "assets" / "decks" / "arnoult": lambda card_id: f"{card_id}.png",
            ROOT / "assets" / "decks" / "swiss-1jj": lambda card_id: f"{card_id}.{'png' if card_id == 'major-5' else 'jpg'}",
            ROOT / "assets" / "decks" / "piedmont": lambda card_id: f"{card_id}.jpg",
        }
        for asset_dir, filename_for in deck_specs.items():
            faces = [asset_dir / filename_for(card_id) for card_id in card_ids]
            self.assertEqual(len(faces), 78)
            self.assertTrue(all(path.is_file() and path.stat().st_size > 4000 for path in faces))
            self.assertTrue(any(path.stat().st_size > 1000 for path in asset_dir.glob("card-back.*")))

    def test_removed_features_stay_removed(self) -> None:
        sources = read_many(APPLICATION_FILES)
        html = (ROOT / "index.html").read_text(encoding="utf-8")
        for symbol in ("SoundEngine", "AudioContext", "soundButton", "copyText", "saveCurrentReading", "reflectionIndex", 'data-history-action="copy"'):
            self.assertNotIn(symbol, sources + html)

    def test_spreads_and_interpretation_contract(self) -> None:
        knowledge = read_many(KNOWLEDGE_FILES)
        styles = read_styles()
        application = read_many(APPLICATION_FILES)
        visible_runtime = read_many((
            "src/app/application.js",
            "src/ui/renderers/insight.js",
        ))
        for expected in (
            'id: "cross"', 'name: "五牌十字"', 'id: "celtic"',
            'name: "凯尔特十字"', 'name: "希望与恐惧"',
            "createLongformInterpretation", "最终判断", "局势总解", "关键牌位详解", "成立条件",
        ):
            self.assertIn(expected, knowledge + application)
        for removed in (
            "createSpreadNarrative", "createConnections", "走势依据", "走势从",
            "决定性牌位", "改判条件", "牌与牌之间如何对话", "接下来的三步",
        ):
            self.assertNotIn(removed, visible_runtime)
        self.assertIn('data-spread-id="celtic"', styles)
        self.assertIn("rotate(90deg)", styles)

    def test_celtic_cross_layout_and_clickability_contract(self) -> None:
        styles = read_styles()
        for expected in ("container-type: size", "min(15cqw, 12.8cqh)", '.card-table[data-spread-id="celtic"] .drawn-card:nth-child(2)', "pointer-events: none", "pointer-events: auto"):
            self.assertIn(expected, styles)

    def test_deck_selection_uses_real_assets_without_color_filters(self) -> None:
        sources = read_many(APPLICATION_FILES)
        styles = read_styles()
        for deck_id, name, directory in (("rws", "经典韦特", "assets/rws"), ("arnoult", "阿尔诺古典", "assets/decks/arnoult"), ("swiss", "瑞士 1JJ", "assets/decks/swiss-1jj"), ("piedmont", "皮埃蒙特", "assets/decks/piedmont")):
            self.assertIn(f'id: "{deck_id}"', sources)
            self.assertIn(f'name: "{name}"', sources)
            self.assertIn(f'assetDirectory: "{directory}"', sources)
        for color_filter in ("sepia(", "hue-rotate(", "grayscale(", "contrast(", "mix-blend-mode"):
            self.assertNotIn(color_filter, styles)

    def test_static_assets_do_not_require_remote_cdn(self) -> None:
        content = (ROOT / "index.html").read_text(encoding="utf-8") + read_many(APPLICATION_FILES) + read_styles()
        self.assertNotIn("https://cdn.", content)
        self.assertNotIn("fonts.googleapis.com", content)

    def test_local_server_serves_application_with_security_headers(self) -> None:
        handler = functools.partial(launcher.AppRequestHandler, directory=str(ROOT))
        server = launcher.AppServer(("127.0.0.1", 0), handler, session_guard=launcher.SessionGuard())
        thread = threading.Thread(target=server.serve_forever, daemon=True)
        thread.start()
        try:
            with urllib.request.urlopen(f"http://127.0.0.1:{server.server_address[1]}/index.html", timeout=2) as response:
                self.assertEqual(response.status, 200)
                self.assertNotIn("unsafe-inline", response.headers["Content-Security-Policy"])
                self.assertIn("HttpOnly", response.headers["Set-Cookie"])
        finally:
            server.shutdown(); server.server_close(); thread.join(timeout=2)

    def test_launcher_stops_after_last_page_closes(self) -> None:
        handler = functools.partial(launcher.AppRequestHandler, directory=str(ROOT))
        server = launcher.AppServer(("127.0.0.1", 0), handler, session_guard=launcher.SessionGuard())
        server.auto_close_grace_seconds = 0.15
        serving = threading.Thread(target=server.serve_forever, daemon=True); serving.start()
        monitor = server.start_lifecycle_monitor()
        try:
            origin = f"http://127.0.0.1:{server.server_address[1]}"
            jar = http.cookiejar.CookieJar(); opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(jar))
            opener.open(f"{origin}/index.html", timeout=2).close()
            for action in ("open", "close"):
                request = urllib.request.Request(f"{origin}/__astra/{action}?client=test-page", method="POST", headers={"Origin": origin, "Sec-Fetch-Site": "same-origin"})
                opener.open(request, timeout=2).close()
            serving.join(timeout=2); self.assertFalse(serving.is_alive())
        finally:
            server.stop_lifecycle_monitor()
            if serving.is_alive(): server.shutdown()
            server.server_close(); serving.join(timeout=2); monitor.join(timeout=1)

    def test_server_denies_internal_files_and_unauthorized_lifecycle(self) -> None:
        handler = functools.partial(launcher.AppRequestHandler, directory=str(ROOT))
        server = launcher.AppServer(("127.0.0.1", 0), handler, session_guard=launcher.SessionGuard())
        thread = threading.Thread(target=server.serve_forever, daemon=True); thread.start()
        try:
            origin = f"http://127.0.0.1:{server.server_address[1]}"
            for path in ("/docs/PROGRESS.md", "/tests/test_app_contract.py", "/%2e%2e/run.py"):
                with self.assertRaises(urllib.error.HTTPError): urllib.request.urlopen(f"{origin}{path}", timeout=2)
            request = urllib.request.Request(f"{origin}/__astra/open?client=unauthorized", method="POST", headers={"Origin": origin, "Sec-Fetch-Site": "same-origin"})
            with self.assertRaises(urllib.error.HTTPError) as error: urllib.request.urlopen(request, timeout=2)
            self.assertEqual(error.exception.code, 403)
        finally:
            server.shutdown(); server.server_close(); thread.join(timeout=2)

    def test_mod_006a_runtime_has_no_legacy_globals_or_oversized_sources(self) -> None:
        application = (ROOT / "src/app/application.js").read_text(encoding="utf-8")
        bootstrap = (ROOT / "src/app/bootstrap.js").read_text(encoding="utf-8")
        self.assertNotIn("window.TarotData", application)
        self.assertNotIn("window.AstraRuntime", application)
        self.assertNotIn("legacy-runtime", bootstrap)
        for path in (ROOT / "src").rglob("*.js"):
            self.assertLessEqual(len(path.read_text(encoding="utf-8").splitlines()), 600, str(path))


if __name__ == "__main__":
    unittest.main()
