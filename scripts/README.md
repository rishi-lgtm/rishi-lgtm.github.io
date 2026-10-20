## Rebuild the résumé PDF

The website's `index.html` is the content source for both versions. After editing
résumé content, rebuild the PDF before publishing:

```sh
python -m pip install reportlab
python scripts/build_resume.py
```

The script embeds Arial from the standard macOS font directory. On another
system, supply a matching regular and bold TrueType font:

```sh
python scripts/build_resume.py --font-regular /path/to/Regular.ttf --font-bold /path/to/Bold.ttf
```

The output replaces `assets/Rishi-Gupta-Resume.pdf`. Check that it remains one
page and inspect its layout after any content changes. When changing styles or
the PDF, bump their `?v=` values in `index.html` so returning visitors receive the
new assets.
