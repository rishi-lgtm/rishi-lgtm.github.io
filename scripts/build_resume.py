"""Build the downloadable PDF from the website's résumé content.

Run with Python and ReportLab installed: python scripts/build_resume.py
"""
from html import escape
from html.parser import HTMLParser
from pathlib import Path
import argparse

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_RIGHT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    HRFlowable, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle,
)

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "assets/Rishi-Gupta-Resume.pdf"
args = argparse.ArgumentParser(description=__doc__)
args.add_argument("--font-regular", default="/System/Library/Fonts/Supplemental/Arial.ttf")
args.add_argument("--font-bold", default="/System/Library/Fonts/Supplemental/Arial Bold.ttf")
options = args.parse_args()
pdfmetrics.registerFont(TTFont("ResumeSans", options.font_regular))
pdfmetrics.registerFont(TTFont("ResumeSans-Bold", options.font_bold))
pdfmetrics.registerFontFamily("ResumeSans", normal="ResumeSans", bold="ResumeSans-Bold")


class Node:
    def __init__(self, tag="", attrs=()):
        self.tag, self.attrs, self.children = tag, dict(attrs), []

    def find(self, tag=None, cls=None, id=None):
        found = []
        for node in self.children:
            if isinstance(node, Node):
                if ((tag is None or node.tag == tag)
                    and (cls is None or cls in node.attrs.get("class", "").split())
                    and (id is None or node.attrs.get("id") == id)):
                    found.append(node)
                found.extend(node.find(tag, cls, id))
        return found

    def text(self):
        return "".join(c.text() if isinstance(c, Node) else c for c in self.children).strip()

    def markup(self):
        result = ""
        for child in self.children:
            if isinstance(child, str):
                result += escape(child)
            elif child.tag == "strong":
                result += "<b>" + child.markup() + "</b>"
            else:
                result += child.markup()
        return result.strip().replace("–", "-").replace("—", "-").replace("×", "x")


class Document(HTMLParser):
    def __init__(self, source):
        super().__init__(convert_charrefs=True)
        self.root = Node()
        self.stack = [self.root]
        self.feed(source)

    def handle_starttag(self, tag, attrs):
        node = Node(tag, attrs)
        self.stack[-1].children.append(node)
        if tag not in {"area", "base", "br", "col", "embed", "hr", "img", "input",
                       "link", "meta", "param", "source", "track", "wbr"}:
            self.stack.append(node)

    def handle_startendtag(self, tag, attrs):
        self.stack[-1].children.append(Node(tag, attrs))

    def handle_endtag(self, tag):
        for index in range(len(self.stack) - 1, 0, -1):
            if self.stack[index].tag == tag:
                self.stack = self.stack[:index]
                break

    def handle_data(self, data):
        self.stack[-1].children.append(data)


tree = Document((ROOT / "index.html").read_text()).root
ink, muted, rule = "#172130", "#3d4957", "#cbd5e1"
PAGE_W, PAGE_H = A4
MARGIN = 38
WIDTH = PAGE_W - 2 * MARGIN - 12  # SimpleDocTemplate's frame has 6pt side padding.
body = ParagraphStyle("body", fontName="ResumeSans", fontSize=10,
                      leading=12.6, textColor=colors.HexColor(ink))
styles = {
    "body": body,
    "name": ParagraphStyle("name", parent=body, fontName="ResumeSans-Bold",
                           fontSize=23, leading=27, alignment=TA_CENTER),
    "title": ParagraphStyle("title", parent=body, fontSize=10.5, leading=14,
                            alignment=TA_CENTER, textColor=colors.HexColor(muted)),
    "contact": ParagraphStyle("contact", parent=body, fontSize=9, leading=12,
                              alignment=TA_CENTER, textColor=colors.HexColor(muted)),
    "section": ParagraphStyle("section", parent=body, fontName="ResumeSans-Bold",
                              fontSize=10.5, leading=13, spaceBefore=13,
                              spaceAfter=4, keepWithNext=True),
    "employer": ParagraphStyle("employer", parent=body, fontName="ResumeSans-Bold",
                               fontSize=11, leading=14),
    "role": ParagraphStyle("role", parent=body, fontName="ResumeSans-Bold",
                           fontSize=10, leading=13),
    "meta": ParagraphStyle("meta", parent=body, fontSize=9, leading=13,
                           textColor=colors.HexColor(muted), alignment=TA_RIGHT),
    "bullet": ParagraphStyle("bullet", parent=body, leftIndent=10, bulletIndent=0,
                             spaceBefore=3.5, bulletFontName="ResumeSans",
                             bulletFontSize=8.5),
    "skill": ParagraphStyle("skill", parent=body, leftIndent=86, firstLineIndent=-86,
                            spaceBefore=3.5, leading=13.5),
}
story = []


def p(text, style="body"):
    return Paragraph(text, styles[style])


def pair(left, right, style="role", left_width=WIDTH * .73):
    row = Table([[p(left, style), p(right, "meta")]],
                colWidths=[left_width, WIDTH - left_width])
    row.setStyle(TableStyle([
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ]))
    row.keepWithNext = True
    return row


def section(title):
    story.append(p(title.upper(), "section"))
    line = HRFlowable(width="100%", thickness=.5, color=colors.HexColor(rule),
                     spaceAfter=6)
    line.keepWithNext = True
    story.append(line)


def link(label, href):
    return f'<link href="{escape(href, quote=True)}">{escape(label)}</link>'


header = tree.find(tag="header")[0]
story += [p(header.find(tag="h1")[0].text(), "name"), Spacer(1, 3),
          p(header.find(tag="p")[0].text(), "title"), Spacer(1, 5)]
contacts = {a.attrs["aria-label"]: a.attrs["href"]
            for a in tree.find(id="contact")[0].find(tag="a")}
email = contacts["Email"].removeprefix("mailto:")
linkedin_url = contacts["LinkedIn"].removeprefix("https://").removeprefix("http://").removeprefix("www.").rstrip("/")
github_url = contacts["GitHub"].removeprefix("https://").removeprefix("http://").removeprefix("www.").rstrip("/")

story.append(p("Bangalore, India &nbsp; · &nbsp; "
               + link("+91 84334 96312", contacts["Call"]) + " &nbsp; · &nbsp; "
               + link(email, contacts["Email"]), "contact"))
story.append(p(" &nbsp; · &nbsp; ".join([
    link(linkedin_url, contacts["LinkedIn"]),
    link(github_url, contacts["GitHub"]),
    link("rishi-lgtm.github.io", "https://rishi-lgtm.github.io/"),
]), "contact"))

section("Experience")
for index, employer in enumerate(tree.find(id="experience")[0].find(tag="article")):
    if index:
        story.append(Spacer(1, 9))
    heading = employer.find(cls="entry-heading")[0]
    story.append(pair(heading.find(tag="h3")[0].markup(),
                      heading.find(tag="span")[0].markup(), "employer"))
    for role_index, role in enumerate(employer.find(cls="role")):
        story.append(Spacer(1, 7 if role_index else 2))
        role_heading = role.find(cls="role-heading")[0]
        story.append(pair(role_heading.find(tag="h4")[0].markup(),
                          role_heading.find(tag="p")[0].markup()))
        for bullet in role.find(tag="li"):
            story.append(Paragraph(bullet.markup(), styles["bullet"], bulletText="•"))

section("Education")
education = tree.find(id="education")[0]
heading = education.find(cls="entry-heading")[0]
subheading = education.find(cls="entry-subheading")[0].find(tag="p")
grade = education.find(cls="grade")[0].markup()
story.append(pair(heading.find(tag="h3")[0].markup(),
                  heading.find(tag="span")[0].markup(), "employer"))
story.append(pair(f"{subheading[0].markup()} &nbsp;·&nbsp; {grade}",
                  subheading[1].markup(), "body"))

section("Technical Skills")
skills = tree.find(id="skills")[0]
for label, value in zip(skills.find(tag="dt"), skills.find(tag="dd")):
    story.append(p(f"<b>{label.text()}:</b> &nbsp; {value.markup()}", "body"))

doc = SimpleDocTemplate(str(OUT), pagesize=A4, leftMargin=MARGIN, rightMargin=MARGIN,
                        topMargin=30, bottomMargin=30, title="Rishi Gupta | Senior Software Engineer",
                        author="Rishi Gupta")
doc.build(story)
print(OUT)
