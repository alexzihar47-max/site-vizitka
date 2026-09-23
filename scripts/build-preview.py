#!/usr/bin/env python3
"""Собирает artifact-preview.html из index.html, style.css и локальных скриптов.

Artifact-страница оборачивается платформой в свой <html>/<head>/<body>,
поэтому здесь берём только шрифты из <head>, содержимое <body>,
и инлайним CSS и JS. Запуск: python3 scripts/build-preview.py
"""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

PREVIEW_NOTE = (
    '<p class="preview-note">Это предпросмотр дизайна. Песочница предпросмотра '
    'блокирует запросы к внешним сайтам, поэтому отправка формы здесь не пройдёт. '
    'На реальном хостинге заявка уходит в Google-таблицу.</p>'
)

PREVIEW_CSS = """
.preview-note {
  margin: 16px 0 0;
  padding: 12px 14px;
  border: 1px dashed var(--border-strong);
  font-size: 12.5px;
  color: var(--text-muted);
}
"""


def main() -> None:
    html = (ROOT / "index.html").read_text(encoding="utf-8")
    css = (ROOT / "style.css").read_text(encoding="utf-8")

    head = re.search(r"<head>(.*?)</head>", html, re.S).group(1)
    font_links = [
        line.strip()
        for line in head.splitlines()
        if "fonts.googleapis.com" in line or "fonts.gstatic.com" in line
    ]

    body = re.search(r"<body>(.*?)</body>", html, re.S).group(1)
    # каждый <script src="local.js"> встраиваем на его же место
    def inline_script(match: "re.Match[str]") -> str:
        code = (ROOT / match.group(1)).read_text(encoding="utf-8").rstrip()
        return "<script>\n" + code + "\n</script>"

    body = re.sub(r'<script src="([\w.-]+\.js)"></script>', inline_script, body)

    # three.js в предпросмотре берём с jsDelivr: песочница пускает скрипты оттуда
    body = body.replace(
        'data-three="vendor/three.module.min.js"',
        'data-three="https://cdn.jsdelivr.net/npm/three@0.159.0/build/three.module.min.js"',
    )
    if "</form>" not in body:
        raise SystemExit("index.html: не найдена форма заявки")
    body = body.replace("</form>", "</form>\n" + PREVIEW_NOTE, 1)

    out = "\n".join(
        [
            "<title>ONYX</title>",
            *font_links,
            "<style>",
            css.rstrip(),
            PREVIEW_CSS.strip(),
            "</style>",
            body.strip(),
            "",
        ]
    )
    (ROOT / "artifact-preview.html").write_text(out, encoding="utf-8")
    print("artifact-preview.html собран")


if __name__ == "__main__":
    main()
