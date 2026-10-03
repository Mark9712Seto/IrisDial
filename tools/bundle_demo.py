"""Mette il motore degli occhi (shared/occhi-web.js) dentro la demo, così è un file HTML unico.
Uso: python3 tools/bundle_demo.py"""
import pathlib
ROOT = pathlib.Path(__file__).resolve().parent.parent
src = (ROOT / "design/balance2-src.html").read_text(encoding="utf-8")
eyes = (ROOT / "shared/occhi-web.js").read_text(encoding="utf-8")
(ROOT / "design/balance2.html").write_text(src.replace("/*EYES*/", eyes), encoding="utf-8")
print("design/balance2.html")
