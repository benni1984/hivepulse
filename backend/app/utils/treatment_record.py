"""The treatment record: what was already logged, as a document a beekeeper has to keep (#477).

Beekeepers in the EU must record the veterinary medicines they use, because bees are
food-producing animals (Art. 108(5) of Regulation (EU) 2019/6, and in Germany §§ 1–2 of the
Tierhalter-Arzneimittelanwendungs- und Nachweisverordnung together with § 95a(3) TAMG). The
record has to name the keeper, where the colonies are, how many were treated, which product, how
much of it, and when. It is kept for five years and shown on request.

HivePulse already holds nearly all of that. What was missing was the document.

## What this is not

**It is not a claim that HivePulse is a compliant electronic record.** The regulation allows an
electronic one only where the data cannot be altered afterwards, and a document regenerated from
rows somebody can still edit plainly can be. What the regulation also allows is loose leaves. So
this prints the record, carrying the day it was made, and the beekeeper keeps it the way they
would keep a paper one. Nothing in the product says more than that, and nothing should start to.

## Why the labels live here and not in `app/i18n.py`

That module is error messages — sentences shown when something went wrong. These are the column
headings of a legal form, and the words are not ours to choose freely: a German record uses the
terms a German authority expects (*Bestandsbuch*, *Wartezeit*, *Anzahl der behandelten Völker*),
and the Polish one is a *książka leczenia zwierząt*. Keeping them beside the document they belong
to means nobody tidies them into a general message catalogue and translates them loosely.
"""
from __future__ import annotations

import io
from datetime import date
from pathlib import Path
from typing import List, Optional

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas as rl_canvas

FONT_DIR = Path(__file__).resolve().parent.parent / "assets" / "fonts"
REGULAR, BOLD = "DMSans", "DMSans-Bold"

#: Every character the five languages need. Checked against the font rather than assumed: a glyph
#: that is missing does not raise, it draws a blank, so Polish would fail silently (#477).
REQUIRED_GLYPHS = (
    "ąęłżśćńóźĄĘŁŻŚĆŃÓŹ"      # pl
    "äöüßÄÖÜ"                  # de
    "àéèçêôûïÉÈÀÇ"             # fr
    "áíñúÁÍÑÚ¡¿"               # es
    "€—–’“”×°…"                # punctuation the labels use
)


def _register_fonts() -> None:
    if REGULAR in pdfmetrics.getRegisteredFontNames():
        return
    pdfmetrics.registerFont(TTFont(REGULAR, str(FONT_DIR / "DMSans-Regular.ttf")))
    pdfmetrics.registerFont(TTFont(BOLD, str(FONT_DIR / "DMSans-Bold.ttf")))


def missing_glyphs(font_file: str = "DMSans-Regular.ttf") -> List[str]:
    """Which of REQUIRED_GLYPHS the font cannot draw. Empty is the only acceptable answer."""
    face = TTFont("probe", str(FONT_DIR / font_file)).face
    return [c for c in REQUIRED_GLYPHS if ord(c) not in face.charToGlyph]


# ------------------------------------------------------------------------------------------------
# The words. Column headings of a legal form, in the terms each country's authorities use.
# ------------------------------------------------------------------------------------------------

LABELS = {
    "en": {
        "title": "Record of veterinary medicinal products",
        "subtitle": "Treatments carried out in {year}",
        "keeper": "Beekeeper", "apiary": "Apiary", "location": "Location", "year": "Year",
        "date_done": "Date applied", "planned": "Planned", "product": "Product",
        "amount": "Amount", "colonies": "Colonies", "withdrawal": "Withdrawal",
        "recorded_by": "Recorded by", "days": "d",
        "varroa_title": "Varroa readings in {year}",
        "varroa_hive": "Colony", "varroa_date": "Date", "varroa_count": "Mites counted",
        "varroa_level": "Level",
        "none": "No treatments were carried out at this apiary in {year}.",
        "no_varroa": "No varroa readings were recorded in {year}.",
        "incomplete": "{count} of these entries have no amount recorded. The record asks for it.",
        "made_on": "Document created on {date}",
        "keep": "Keep this record for five years and show it on request.",
        "page": "Page {page}",
        "unknown": "—",
    },
    "de": {
        "title": "Bestandsbuch — Tierarzneimittel",
        "subtitle": "Im Jahr {year} durchgeführte Behandlungen",
        "keeper": "Bienenhalter", "apiary": "Bienenstand", "location": "Standort", "year": "Jahr",
        "date_done": "Anwendungsdatum", "planned": "Geplant", "product": "Arzneimittel",
        "amount": "Menge", "colonies": "Völker", "withdrawal": "Wartezeit",
        "recorded_by": "Erfasst von", "days": "T",
        "varroa_title": "Varroa-Befunde im Jahr {year}",
        "varroa_hive": "Volk", "varroa_date": "Datum", "varroa_count": "Milben gezählt",
        "varroa_level": "Stufe",
        "none": "An diesem Bienenstand wurden {year} keine Behandlungen durchgeführt.",
        "no_varroa": "Im Jahr {year} wurden keine Varroa-Befunde erfasst.",
        "incomplete": "Bei {count} dieser Einträge fehlt die Menge. Das Bestandsbuch verlangt sie.",
        "made_on": "Dokument erstellt am {date}",
        "keep": "Dieses Bestandsbuch fünf Jahre aufbewahren und auf Verlangen vorlegen.",
        "page": "Seite {page}",
        "unknown": "—",
    },
    "fr": {
        "title": "Registre des traitements médicamenteux",
        "subtitle": "Traitements effectués en {year}",
        "keeper": "Apiculteur", "apiary": "Rucher", "location": "Emplacement", "year": "Année",
        "date_done": "Date d’application", "planned": "Prévu", "product": "Médicament",
        "amount": "Quantité", "colonies": "Ruches", "withdrawal": "Temps d’attente",
        "recorded_by": "Saisi par", "days": "j",
        "varroa_title": "Relevés varroa en {year}",
        "varroa_hive": "Ruche", "varroa_date": "Date", "varroa_count": "Varroas comptés",
        "varroa_level": "Niveau",
        "none": "Aucun traitement n’a été effectué dans ce rucher en {year}.",
        "no_varroa": "Aucun relevé varroa n’a été saisi en {year}.",
        "incomplete": "{count} de ces lignes n’indiquent pas la quantité. Le registre la demande.",
        "made_on": "Document créé le {date}",
        "keep": "Conserver ce registre cinq ans et le présenter sur demande.",
        "page": "Page {page}",
        "unknown": "—",
    },
    "es": {
        "title": "Libro de registro de tratamientos veterinarios",
        "subtitle": "Tratamientos realizados en {year}",
        "keeper": "Apicultor", "apiary": "Colmenar", "location": "Ubicación", "year": "Año",
        "date_done": "Fecha de aplicación", "planned": "Previsto", "product": "Medicamento",
        "amount": "Cantidad", "colonies": "Colmenas", "withdrawal": "Tiempo de espera",
        "recorded_by": "Registrado por", "days": "d",
        "varroa_title": "Recuentos de varroa en {year}",
        "varroa_hive": "Colmena", "varroa_date": "Fecha", "varroa_count": "Ácaros contados",
        "varroa_level": "Nivel",
        "none": "En este colmenar no se realizó ningún tratamiento en {year}.",
        "no_varroa": "En {year} no se registró ningún recuento de varroa.",
        "incomplete": "{count} de estas entradas no indican la cantidad. El registro la exige.",
        "made_on": "Documento creado el {date}",
        "keep": "Conserve este registro cinco años y preséntelo cuando se le solicite.",
        "page": "Página {page}",
        "unknown": "—",
    },
    "pl": {
        "title": "Książka leczenia zwierząt",
        "subtitle": "Zabiegi wykonane w {year} roku",
        "keeper": "Pszczelarz", "apiary": "Pasieka", "location": "Lokalizacja", "year": "Rok",
        "date_done": "Data podania", "planned": "Planowano", "product": "Lek",
        "amount": "Ilość", "colonies": "Rodziny", "withdrawal": "Okres karencji",
        "recorded_by": "Zapisał", "days": "d",
        "varroa_title": "Pomiary warrozy w {year} roku",
        "varroa_hive": "Rodzina", "varroa_date": "Data", "varroa_count": "Policzone roztocza",
        "varroa_level": "Poziom",
        "none": "W tej pasiece nie wykonano w {year} roku żadnych zabiegów.",
        "no_varroa": "W {year} roku nie zapisano żadnych pomiarów warrozy.",
        "incomplete": "W {count} pozycjach brakuje ilości. Książka leczenia jej wymaga.",
        "made_on": "Dokument utworzono {date}",
        "keep": "Przechowuj tę książkę przez pięć lat i okaż ją na żądanie.",
        "page": "Strona {page}",
        "unknown": "—",
    },
}


def labels(lang: str) -> dict:
    return LABELS.get(lang, LABELS["en"])


# ------------------------------------------------------------------------------------------------
# The document
# ------------------------------------------------------------------------------------------------

#: Column widths in cm, left to right. They add up to 18, the usable width of A4 at a 1.5 cm margin.
COLUMNS = [2.4, 2.0, 4.6, 2.9, 1.5, 1.9, 2.7]

MARGIN = 1.5 * cm
LINE = 0.62 * cm


class _Sheet:
    """A canvas that knows where it is on the page and starts a new one when it runs out."""

    def __init__(self, buf: io.BytesIO, words: dict):
        self.c = rl_canvas.Canvas(buf, pagesize=A4)
        self.w, self.h = A4
        self.words = words
        self.page = 1
        self.y = self.h - MARGIN

    def room_for(self, lines: int = 1) -> None:
        if self.y - lines * LINE < MARGIN + 1.4 * cm:
            self._footer()
            self.c.showPage()
            self.page += 1
            self.y = self.h - MARGIN

    def text(self, x: float, s: str, *, bold: bool = False, size: float = 9) -> None:
        self.c.setFont(BOLD if bold else REGULAR, size)
        self.c.drawString(x, self.y, s)

    def row(self, values: List[str], *, bold: bool = False, size: float = 9) -> None:
        self.room_for()
        x = MARGIN
        for width, value in zip(COLUMNS, values):
            self.text(x, _fit(value, width * cm - 0.15 * cm, bold, size), bold=bold, size=size)
            x += width * cm
        self.y -= LINE

    def rule(self) -> None:
        self.c.setLineWidth(0.4)
        self.c.setStrokeColorRGB(0.85, 0.84, 0.83)
        self.c.line(MARGIN, self.y + 0.18 * cm, self.w - MARGIN, self.y + 0.18 * cm)

    def _footer(self) -> None:
        self.c.setFont(REGULAR, 7.5)
        self.c.setFillColorRGB(0.45, 0.45, 0.44)
        self.c.drawString(MARGIN, MARGIN, self.words["keep"])
        self.c.drawRightString(self.w - MARGIN, MARGIN,
                               self.words["page"].format(page=self.page))
        self.c.setFillColorRGB(0, 0, 0)


def _fit(s: str, width: float, bold: bool, size: float) -> str:
    """Shorten to fit a column. A clipped product name is better than one written over its
    neighbour, and the untruncated text is in the app anyway."""
    font = BOLD if bold else REGULAR
    if pdfmetrics.stringWidth(s, font, size) <= width:
        return s
    while s and pdfmetrics.stringWidth(s + "…", font, size) > width:
        s = s[:-1]
    return s + "…"


def build(
    *,
    lang: str,
    year: int,
    keeper_name: str,
    apiary_name: str,
    location: Optional[str],
    treatments: List[dict],
    varroa: List[dict],
    made_on: date,
) -> bytes:
    """Render the record. Everything it needs is passed in; this module touches no database."""
    _register_fonts()
    w = labels(lang)
    buf = io.BytesIO()
    s = _Sheet(buf, w)

    # -- heading ---------------------------------------------------------------------------------
    s.text(MARGIN, w["title"], bold=True, size=15)
    s.y -= 0.75 * cm
    s.text(MARGIN, w["subtitle"].format(year=year), size=10.5)
    s.y -= 0.9 * cm

    for key, value in (("keeper", keeper_name), ("apiary", apiary_name),
                       ("location", location or w["unknown"])):
        s.text(MARGIN, w[key] + ":", bold=True, size=9)
        s.text(MARGIN + 3.0 * cm, value, size=9)
        s.y -= LINE
    s.y -= 0.35 * cm

    # -- the treatments --------------------------------------------------------------------------
    s.row([w["date_done"], w["planned"], w["product"], w["amount"],
           w["colonies"], w["withdrawal"], w["recorded_by"]], bold=True)
    s.rule()
    s.y -= 0.1 * cm

    if not treatments:
        s.text(MARGIN, w["none"].format(year=year), size=9)
        s.y -= LINE
    for t in treatments:
        s.row([
            t["done_on"].isoformat(),
            t["due_on"].isoformat(),
            t["product"],
            t.get("amount") or w["unknown"],
            str(t.get("hive_count") or w["unknown"]),
            f'{t["withdrawal_days"]} {w["days"]}' if t.get("withdrawal_days") is not None
            else w["unknown"],
            t.get("recorded_by") or w["unknown"],
        ])

    missing_amount = sum(1 for t in treatments if not t.get("amount"))
    if missing_amount:
        # Said out loud rather than left as a row of dashes. A record that shows its gaps tells a
        # beekeeper what to go and fill in; one that hides them is worse than no record (#477).
        s.y -= 0.25 * cm
        s.room_for(2)
        s.c.setFillColorRGB(0.55, 0.37, 0.03)
        s.text(MARGIN, w["incomplete"].format(count=missing_amount), size=8.5)
        s.c.setFillColorRGB(0, 0, 0)
        s.y -= LINE

    # -- the varroa readings, because they are why a treatment happened --------------------------
    s.y -= 0.6 * cm
    s.room_for(4)
    s.text(MARGIN, w["varroa_title"].format(year=year), bold=True, size=11)
    s.y -= 0.7 * cm
    s.row([w["varroa_date"], w["varroa_hive"], w["varroa_count"], w["varroa_level"], "", "", ""],
          bold=True)
    s.rule()
    s.y -= 0.1 * cm

    if not varroa:
        s.text(MARGIN, w["no_varroa"].format(year=year), size=9)
        s.y -= LINE
    for v in varroa:
        s.row([
            v["date"].isoformat(),
            v["hive"],
            str(v["count"]) if v.get("count") is not None else w["unknown"],
            v.get("level") or w["unknown"],
            "", "", "",
        ])

    # -- when this sheet was made ----------------------------------------------------------------
    s.y -= 0.6 * cm
    s.room_for(2)
    s.c.setFillColorRGB(0.45, 0.45, 0.44)
    s.text(MARGIN, w["made_on"].format(date=made_on.isoformat()), size=8)
    s.c.setFillColorRGB(0, 0, 0)

    s._footer()
    s.c.save()
    return buf.getvalue()
