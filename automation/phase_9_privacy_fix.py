#!/usr/bin/env python3
"""Distinguish real external runtime origins from loopback and XML namespaces."""

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def write_lf(path: Path, content: str) -> None:
    with path.open("w", encoding="utf-8", newline="\n") as handle:
        handle.write(content.rstrip() + "\n")


acceptance_path = ROOT / "scripts" / "release_acceptance.mjs"
acceptance = acceptance_path.read_text(encoding="utf-8")
old = '''const externalOrigins = [...runtimeText.matchAll(/https?:\\/\\/[^\\s\"'`)]+/g)].map((match) => match[0]);'''
new = '''const detectedOrigins = [...runtimeText.matchAll(/https?:\\/\\/[^\\s\"'`)]+/g)].map((match) => match[0]);
const nonNetworkOrigins = detectedOrigins.filter((origin) => (
  /^https?:\\/\\/(?:localhost|127\\.0\\.0\\.1)(?::\\d+)?(?:\\/|$)/.test(origin)
  || /^http:\\/\\/www\\.w3\\.org\\/(?:2000\\/svg|1999\\/xlink)(?:\\/|$)/.test(origin)
));
const externalOrigins = detectedOrigins.filter((origin) => !nonNetworkOrigins.includes(origin));'''
if new not in acceptance:
    if old not in acceptance:
        raise RuntimeError("External-origin scan marker not found.")
    acceptance = acceptance.replace(old, new, 1)
acceptance = acceptance.replace(
    '''  privacy: {
    externalRuntimeOrigins: externalOrigins,''',
    '''  privacy: {
    externalRuntimeOrigins: externalOrigins,
    ignoredLoopbackAndNamespaceOrigins: [...new Set(nonNetworkOrigins)].sort(),''',
    1,
)
write_lf(acceptance_path, acceptance)

readme_path = ROOT / "README.md"
readme = readme_path.read_text(encoding="utf-8")
privacy_section = '''
## 隐私与本地数据

星纱塔罗的运行时不连接第三方服务，也不会上传问题、解读、历史记录、随机根种子或诊断正文。浏览器本地服务地址和 SVG/XML 命名空间仅用于本机运行及资源格式声明，不属于外部网络传输。历史和缓存由浏览器本地存储管理，用户可以在应用内导出、删除牌组缓存或清除历史。
'''
if "## 隐私与本地数据" not in readme:
    readme = readme.rstrip() + "\n\n" + privacy_section.strip() + "\n"
write_lf(readme_path, readme)

print("Phase 9 privacy gate now rejects real external origins while documenting local-only data handling.")
