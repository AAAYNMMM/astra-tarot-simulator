from __future__ import annotations

import os
import pathlib
import subprocess
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[1]
LAUNCHERS = list(ROOT.glob("*.bat"))


class WindowsLauncherContractTests(unittest.TestCase):
    def test_launcher_contract_is_ascii_and_declares_crlf_checkout(self) -> None:
        self.assertEqual(len(LAUNCHERS), 1)
        launcher = LAUNCHERS[0]
        data = launcher.read_bytes()
        self.assertTrue(data.isascii(), "launcher must remain ASCII-safe for cmd.exe")
        attributes = (ROOT / ".gitattributes").read_text(encoding="utf-8").splitlines()
        self.assertIn("*.bat text eol=crlf", attributes)
        if os.name == "nt":
            self.assertIn(b"\r\n", data)
            self.assertNotIn(b"\n", data.replace(b"\r\n", b""))

    @unittest.skipUnless(os.name == "nt", "cmd.exe launcher contract is Windows-only")
    def test_cmd_can_parse_launcher_and_forward_help(self) -> None:
        launcher = LAUNCHERS[0]
        completed = subprocess.run(
            ["cmd.exe", "/d", "/c", "call", str(launcher), "--help"],
            cwd=ROOT,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            timeout=20,
            check=False,
        )
        self.assertEqual(completed.returncode, 0, completed.stdout.decode(errors="replace"))
        self.assertIn(b"--no-browser", completed.stdout)
        self.assertNotIn(b"is not recognized as an internal or external command", completed.stdout)


if __name__ == "__main__":
    unittest.main()