"""Puts the eyes engine (shared/occhi-web.js) inside the prototype, so it is a single HTML file.
Usage: python3 tools/bundle_demo.py"""
import pathlib
ROOT = pathlib.Path(__file__).resolve().parent.parent
eyes = (ROOT / "shared/occhi-web.js").read_text(encoding="utf-8")
src = (ROOT / "design/prototype-src.html").read_text(encoding="utf-8")
(ROOT / "design/prototype.html").write_text(src.replace("/*EYES*/", eyes), encoding="utf-8")
print("design/prototype.html")
