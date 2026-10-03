"""Mette il motore degli occhi (shared/occhi-web.js) dentro le demo, così ognuna è un file HTML unico.
Uso: python3 tools/bundle_demo.py"""
import pathlib
ROOT = pathlib.Path(__file__).resolve().parent.parent
eyes = (ROOT / "shared/occhi-web.js").read_text(encoding="utf-8")
for name in ("balance2", "prototipo"):
    src = (ROOT / f"design/{name}-src.html").read_text(encoding="utf-8")
    (ROOT / f"design/{name}.html").write_text(src.replace("/*EYES*/", eyes), encoding="utf-8")
    print(f"design/{name}.html")
