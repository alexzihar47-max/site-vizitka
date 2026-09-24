#!/usr/bin/env python3
"""Подставляет настоящий домен вместо заглушки YOUR-DOMAIN.ru.

Запуск: python3 scripts/set-domain.py onyx-studio.ru
Затрагивает index.html, robots.txt и sitemap.xml.
"""
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PLACEHOLDER = "YOUR-DOMAIN.ru"


def main() -> None:
    if len(sys.argv) != 2:
        raise SystemExit("Укажите домен: python3 scripts/set-domain.py onyx-studio.ru")
    domain = re.sub(r"^https?://", "", sys.argv[1].strip()).strip("/")
    if not re.fullmatch(r"[\w.-]+\.[a-zA-Zа-яА-Я-]{2,}", domain):
        raise SystemExit(f"Не похоже на домен: {domain}")
    for name in ("index.html", "robots.txt", "sitemap.xml"):
        path = ROOT / name
        text = path.read_text(encoding="utf-8")
        count = text.count(PLACEHOLDER)
        path.write_text(text.replace(PLACEHOLDER, domain), encoding="utf-8")
        print(f"{name}: заменено {count}")


if __name__ == "__main__":
    main()
