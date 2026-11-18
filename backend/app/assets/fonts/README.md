# DM Sans, for the PDFs the server makes

Two static instances of the house font, used by the treatment record (#477) and anything else
`reportlab` has to typeset.

| File | |
|---|---|
| `DMSans-Regular.ttf`, `DMSans-Bold.ttf` | 78 KB each, from [googlefonts/dm-fonts](https://github.com/googlefonts/dm-fonts) |
| `OFL.txt` | SIL Open Font License 1.1, which is what lets these sit in a public repository |

## Why a font file is here at all

ReportLab's built-in fonts are Type 1 with WinAnsi encoding, and **they have no glyphs for
`ą ę ż ś ń ź`**. The one TrueType font ReportLab ships, Bitstream Vera, is missing the same twelve
Polish characters — it has `ł`, `ć` and `ó` and stops there, which is the worst kind of gap
because four of the five languages look perfect while the fifth quietly falls apart.

A treatment record is a document somebody may hand to an authority. One with boxes where the
letters should be is not one.

The website's fonts come through `next/font/google` and exist only inside a build, so there was
nothing in the repository to reuse. These two files are the smallest thing that fixes it and they
are the house font, so the document looks like the rest of HivePulse.

## Before changing or replacing them

`tests/test_treatment_record.py` asks the font itself whether it has every character the five
languages need, rather than trusting that it does. Swap the font and that test tells you
immediately if the new one is narrower — which is the only way this stays noticed, since a missing
glyph does not raise, it draws a blank.
