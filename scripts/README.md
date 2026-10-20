## Rebuild the résumé PDF

The website's `index.html` is the content source for both versions. After editing
résumé content, rebuild the PDF before publishing:

```sh
python -m pip install reportlab
python scripts/build_resume.py
```

### Font Options
By default, the script builds with **Helvetica Neue** (`--font helvetica`), providing a sharp, modern Big Tech aesthetic with a 100% ATS score. You can also build with other presets:

```sh
# Modern Big Tech Sans-Serif (default):
python scripts/build_resume.py --font helvetica

# Executive Editorial Serif (Charter):
python scripts/build_resume.py --font charter

# Classic Standard Sans (Arial):
python scripts/build_resume.py --font arial
```

On a non-macOS system, supply matching regular and bold TrueType fonts if desired:

```sh
python scripts/build_resume.py --font-regular /path/to/Regular.ttf --font-bold /path/to/Bold.ttf
```

The output replaces `assets/Rishi-Gupta-Resume.pdf`. Check that it remains one
page and inspect its layout after any content changes. When changing styles or
the PDF, bump their `?v=` values in `index.html` so returning visitors receive the
new assets.
