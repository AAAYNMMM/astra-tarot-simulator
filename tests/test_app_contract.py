from __future__ import annotations

import functools
import http.server
import pathlib
import re
import threading
import unittest
import urllib.request

import run as launcher


ROOT = pathlib.Path(__file__).resolve().parents[1]
STYLE_FILES = (
    "src/styles/index.css",
    "src/styles/foundation.css",
    "src/styles/setup.css",
    "src/styles/cards.css",
    "src/styles/insights.css",
    "src/styles/history.css",
    "src/styles/desktop.css",
    "src/styles/wide.css",
    "src/styles/responsive.css",
)


def read_styles() -> str:
    index_source = (ROOT / STYLE_FILES[0]).read_text(encoding="utf-8")
    imported_names = re.findall(r'@import url\("\./(.+?)"\);', index_source)
    expected_names = [pathlib.PurePosixPath(item).name for item in STYLE_FILES[1:]]
    if imported_names != expected_names:
        raise AssertionError(f"Unexpected CSS import order: {imported_names!r}")
    return "".join(
        (ROOT / relative_path).read_text(encoding="utf-8")
        for relative_path in STYLE_FILES[1:]
    )


class TarotAppContractTests(unittest.TestCase):
    def test_required_files_exist(self) -> None:
        required = {
            "index.html",
            "data.js",
            "app.js",
            "run.py",
            "manifest.webmanifest",
            "sw.js",
            "icon.svg",
            "package.json",
            "package.json",
        }
        self.assertTrue(required.issubset({path.name for path in ROOT.iterdir()}))
        for relative_path in STYLE_FILES:
            self.assertTrue((ROOT / relative_path).is_file(), relative_path)
        self.assertFalse((ROOT / "styles.css").exists())
        self.assertTrue((ROOT / "src/app/bootstrap.js").is_file())
        self.assertTrue((ROOT / "src/app/legacy-runtime.js").is_file())
        self.assertTrue((ROOT / "src/config/decks.js").is_file())
        self.assertTrue((ROOT / "src/config/legacy-storage.js").is_file())
        self.assertTrue((ROOT / "src/core/html.js").is_file())
        self.assertTrue((ROOT / "src/core/random/business-random.js").is_file())
        self.assertTrue((ROOT / "src/platform/assets.js").is_file())
        self.assertTrue((ROOT / "src/platform/entropy.js").is_file())
        self.assertTrue((ROOT / "src/platform/lifecycle-client.js").is_file())
        self.assertTrue((ROOT / "src/platform/pwa-client.js").is_file())
        self.assertTrue((ROOT / "src/storage/settings.js").is_file())
        self.assertTrue((ROOT / "src/storage/legacy-history.js").is_file())
        self.assertTrue((ROOT / "src/storage/legacy-record.js").is_file())

    def test_html_has_primary_interaction_contract(self) -> None:
        html = (ROOT / "index.html").read_text(encoding="utf-8")
        for element_id in (
            "categoryGrid",
            "questionPickerButton",
            "questionDialog",
            "questionList",
            "spreadList",
            "deckStyleList",
            "startReading",
            "cardTable",
            "insightContent",
            "historyDialog",
        ):
            self.assertIn(f'id="{element_id}"', html)
        self.assertIn('type="module" src="src/app/bootstrap.js"', html)
        self.assertNotIn('<script src="data.js"></script>', html)
        self.assertNotIn('<script src="app.js"></script>', html)
        self.assertNotIn('id="soundButton"', html)
        self.assertNotIn('id="copyButton"', html)
        self.assertNotIn('id="saveButton"', html)

    def test_mod_004a_uses_active_ui_modules_and_safe_history_dom(self) -> None:
        app_source = (ROOT / "app.js").read_text(encoding="utf-8")
        runtime_source = (ROOT / "src/app/legacy-runtime.js").read_text(encoding="utf-8")
        history_source = (ROOT / "src/ui/renderers/history.js").read_text(encoding="utf-8")
        toast_source = (ROOT / "src/ui/components/toast.js").read_text(encoding="utf-8")
        for relative_path in (
            "src/app/events.js",
            "src/app/controllers/reading-controller.js",
            "src/app/selectors/current-selection.js",
            "src/app/state/reading-state.js",
            "src/ui/animations/reading.js",
            "src/ui/components/toast.js",
            "src/ui/dom.js",
            "src/ui/safe-dom.js",
            "src/ui/renderers/history.js",
            "src/ui/renderers/setup.js",
            "tests/ui_contract_test.mjs",
        ):
            self.assertTrue((ROOT / relative_path).is_file(), relative_path)
            if relative_path.startswith("src/"):
                self.assertIn(relative_path, (ROOT / "sw.js").read_text(encoding="utf-8"))
        self.assertIn("createHistoryRenderer", runtime_source)
        self.assertIn("createEventBinder", runtime_source)
        self.assertNotIn("function renderHistory()", app_source)
        self.assertNotIn("function bindEvents()", app_source)
        self.assertNotIn("innerHTML", history_source)
        self.assertNotIn("innerHTML", toast_source)

    def test_four_complete_local_tarot_decks_are_bundled(self) -> None:
        ranks = (
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
        )
        suits = ("wands", "cups", "swords", "pentacles")
        card_ids = [f"major-{number}" for number in range(22)]
        card_ids.extend(f"{suit}-{rank}" for suit in suits for rank in ranks)
        deck_specs = {
            ROOT / "assets" / "rws": lambda card_id: f"{card_id}.jpg",
            ROOT / "assets" / "decks" / "arnoult": lambda card_id: f"{card_id}.png",
            ROOT
            / "assets"
            / "decks"
            / "swiss-1jj": lambda card_id: f"{card_id}.{'png' if card_id == 'major-5' else 'jpg'}",
            ROOT / "assets" / "decks" / "piedmont": lambda card_id: f"{card_id}.jpg",
        }
        for asset_dir, filename_for in deck_specs.items():
            with self.subTest(deck=asset_dir.name):
                faces = [asset_dir / filename_for(card_id) for card_id in card_ids]
                self.assertEqual(len(faces), 78)
                self.assertTrue(all(path.is_file() for path in faces))
                self.assertTrue(all(path.stat().st_size > 4_000 for path in faces))
                backs = list(asset_dir.glob("card-back.*"))
                self.assertTrue(backs)
                self.assertTrue(all(path.stat().st_size > 1_000 for path in backs))

    def test_sound_feature_is_fully_removed(self) -> None:
        app_source = (ROOT / "app.js").read_text(encoding="utf-8")
        html = (ROOT / "index.html").read_text(encoding="utf-8")
        self.assertNotIn("SoundEngine", app_source)
        self.assertNotIn("AudioContext", app_source)
        self.assertNotIn("soundButton", app_source)
        self.assertNotIn("soundButton", html)

    def test_result_export_and_resonance_choice_are_removed(self) -> None:
        app_source = (ROOT / "app.js").read_text(encoding="utf-8")
        data_source = (ROOT / "data.js").read_text(encoding="utf-8")
        html = (ROOT / "index.html").read_text(encoding="utf-8")
        for removed_symbol in (
            "copyText",
            "saveCurrentReading",
            "serializeReading",
            "reflectionIndex",
            "data-reflection-index",
            'data-history-action="copy"',
        ):
            self.assertNotIn(removed_symbol, app_source)
        self.assertNotIn("reflections:", data_source)
        self.assertNotIn("选择最有共鸣的方向", html)

    def test_centered_display_scale_and_plain_history_toggle(self) -> None:
        app_source = (ROOT / "app.js").read_text(encoding="utf-8")
        styles = read_styles()
        self.assertNotIn("zoom: 1.1", styles)
        self.assertIn("zoom: 1.5", styles)
        self.assertIn('data-spread-id="cross"', styles)
        history_source = (ROOT / "src/ui/renderers/history.js").read_text(encoding="utf-8")
        self.assertIn('text: "展开查看"', history_source)
        self.assertNotIn('<b aria-hidden="true">⌄</b>', app_source)
        self.assertNotIn(".history-view-button b", styles)

    def test_mainstream_spreads_and_richer_interpretation_contract(self) -> None:
        app_source = (ROOT / "app.js").read_text(encoding="utf-8")
        data_source = (ROOT / "data.js").read_text(encoding="utf-8")
        styles = read_styles()
        for expected in (
            'id: "cross"',
            'name: "五牌十字"',
            'name: "核心现状"',
            'name: "过去根源"',
            'name: "发展趋势"',
            'name: "关键影响"',
            'name: "行动建议"',
            'id: "celtic"',
            'name: "凯尔特十字"',
            'name: "交叉挑战"',
            'name: "潜意识根基"',
            'name: "希望与恐惧"',
            'name: "发展结果"',
        ):
            self.assertIn(expected, data_source)
        self.assertNotIn('id: "guidance"', data_source)
        self.assertIn("dom.cardTable.dataset.spreadId", app_source)
        self.assertIn("createSpreadNarrative", app_source)
        self.assertIn("createConnections", app_source)
        self.assertIn("牌与牌之间如何对话", app_source)
        self.assertIn("牌型与正逆位", app_source)
        self.assertIn("grid-row: 3", styles)
        self.assertIn('data-spread-id="celtic"', styles)
        self.assertIn("rotate(90deg)", styles)

    def test_celtic_cross_scales_to_the_stage_and_keeps_both_center_cards_clickable(self) -> None:
        styles = read_styles()
        self.assertIn("container-type: size", styles)
        self.assertIn("min(15cqw, 12.8cqh)", styles)
        self.assertIn(
            '.card-table[data-spread-id="celtic"] .drawn-card:nth-child(2) {',
            styles,
        )
        self.assertIn(
            '.card-table[data-spread-id="celtic"] .drawn-card:nth-child(2) .card-hitbox {',
            styles,
        )
        self.assertIn("pointer-events: none", styles)
        self.assertIn("pointer-events: auto", styles)

    def test_deck_selection_switches_real_faces_and_backs_without_color_filters(self) -> None:
        app_source = (ROOT / "app.js").read_text(encoding="utf-8")
        deck_source = (ROOT / "src/config/decks.js").read_text(encoding="utf-8")
        asset_source = (ROOT / "src/platform/assets.js").read_text(encoding="utf-8")
        styles = read_styles()
        html = (ROOT / "index.html").read_text(encoding="utf-8")
        for deck_id, deck_name, asset_directory in (
            ("rws", "经典韦特", "assets/rws"),
            ("arnoult", "阿尔诺古典", "assets/decks/arnoult"),
            ("swiss", "瑞士 1JJ", "assets/decks/swiss-1jj"),
            ("piedmont", "皮埃蒙特", "assets/decks/piedmont"),
        ):
            self.assertIn(f'id: "{deck_id}"', deck_source)
            self.assertIn(f'name: "{deck_name}"', deck_source)
            self.assertIn(f'assetDirectory: "{asset_directory}"', deck_source)
        self.assertIn("cardImagePath(card.id, deckStyle)", app_source)
        self.assertIn("cardBackPath(deckStyle)", app_source)
        self.assertIn("resolveDeckStyle", asset_source)
        self.assertIn('class="tarot-face-art"', app_source)
        self.assertIn("选择牌面", html)
        self.assertIn("正面与牌背一一对应", html)
        self.assertIn("不使用滤镜换色", html)
        self.assertNotIn("card-back-v2.jpg", app_source)
        self.assertNotIn("card-back-v2.jpg", html)
        self.assertNotIn("card-back-v2.jpg", (ROOT / "sw.js").read_text(encoding="utf-8"))
        for color_filter in ("sepia(", "hue-rotate(", "grayscale(", "contrast("):
            self.assertNotIn(color_filter, styles)
        self.assertNotIn("mix-blend-mode", styles)

    def test_static_assets_do_not_require_remote_cdn(self) -> None:
        for filename in (
            "index.html",
            "data.js",
            "app.js",
            "src/app/bootstrap.js",
            "src/app/legacy-runtime.js",
            "src/config/decks.js",
            "src/config/legacy-storage.js",
            "src/core/html.js",
            "src/core/random/business-random.js",
            "src/platform/assets.js",
            "src/platform/entropy.js",
            "src/platform/lifecycle-client.js",
            "src/platform/pwa-client.js",
            "src/storage/settings.js",
            "src/storage/legacy-history.js",
            "src/storage/legacy-record.js",
        ):
            content = (ROOT / filename).read_text(encoding="utf-8")
            self.assertNotIn("https://cdn.", content)
            self.assertNotIn("fonts.googleapis.com", content)
        for relative_path in STYLE_FILES:
            content = (ROOT / relative_path).read_text(encoding="utf-8")
            self.assertNotIn("https://cdn.", content)
            self.assertNotIn("fonts.googleapis.com", content)

    def test_local_server_serves_application(self) -> None:
        handler = functools.partial(
            http.server.SimpleHTTPRequestHandler,
            directory=str(ROOT),
        )
        server = http.server.ThreadingHTTPServer(("127.0.0.1", 0), handler)
        thread = threading.Thread(target=server.serve_forever, daemon=True)
        thread.start()
        try:
            port = server.server_address[1]
            with urllib.request.urlopen(
                f"http://127.0.0.1:{port}/index.html",
                timeout=3,
            ) as response:
                body = response.read().decode("utf-8")
                self.assertEqual(response.status, 200)
                self.assertIn("星纱塔罗", body)
        finally:
            server.shutdown()
            server.server_close()
            thread.join(timeout=2)

    def test_launcher_stops_after_last_page_closes(self) -> None:
        handler = functools.partial(
            launcher.AppRequestHandler,
            directory=str(ROOT),
        )
        server = launcher.AppServer(("127.0.0.1", 0), handler)
        serving_thread = threading.Thread(target=server.serve_forever, daemon=True)
        original_grace = launcher.AUTO_CLOSE_GRACE_SECONDS
        launcher.AUTO_CLOSE_GRACE_SECONDS = 0.15
        serving_thread.start()
        monitor_thread = server.start_lifecycle_monitor()
        try:
            port = server.server_address[1]
            for action in ("open", "close"):
                request = urllib.request.Request(
                    f"http://127.0.0.1:{port}/__astra/{action}?client=test-page",
                    method="POST",
                )
                with urllib.request.urlopen(request, timeout=2) as response:
                    self.assertEqual(response.status, 204)
            serving_thread.join(timeout=2)
            self.assertFalse(serving_thread.is_alive())
        finally:
            launcher.AUTO_CLOSE_GRACE_SECONDS = original_grace
            server.stop_lifecycle_monitor()
            if serving_thread.is_alive():
                server.shutdown()
            server.server_close()
            serving_thread.join(timeout=2)
            monitor_thread.join(timeout=1)

    def test_page_lifecycle_stream_is_wired_end_to_end(self) -> None:
        app_source = (ROOT / "app.js").read_text(encoding="utf-8")
        lifecycle_source = (ROOT / "src/platform/lifecycle-client.js").read_text(encoding="utf-8")
        entropy_source = (ROOT / "src/platform/entropy.js").read_text(encoding="utf-8")
        launcher_source = (ROOT / "run.py").read_text(encoding="utf-8")
        worker_source = (ROOT / "sw.js").read_text(encoding="utf-8")
        self.assertIn("registerLocalLifecycle", app_source)
        self.assertIn("new EventSourceCtor", lifecycle_source)
        self.assertNotIn("Math.random", lifecycle_source)
        self.assertNotIn("Math.random", entropy_source)
        self.assertIn("/__astra/events", launcher_source)
        self.assertIn('startsWith("/__astra/")', worker_source)

if __name__ == "__main__":
    unittest.main()
