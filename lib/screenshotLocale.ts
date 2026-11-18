/**
 * Which picture a help page in a given language should try first (#475).
 *
 * All 78 screenshots were English, in help pages that are real prose in five languages: a German
 * beekeeper read German and looked at an English dashboard. The pictures are now captured per
 * language, and this is the rule that finds them.
 *
 * English keeps the unsuffixed name, so nothing that exists today moves. Every other language
 * asks for its own file and the components fall back to the English one when it is not there —
 * which means this can ship before a single localised picture exists, and a language can be
 * filled in one screen at a time.
 */
const EXTENSION = /\.(png|webp|jpe?g)$/i;

export function localisedScreenshot(src: string, locale: string): string {
  if (!src || locale === 'en') return src;
  if (!EXTENSION.test(src)) return src;
  return src.replace(EXTENSION, `-${locale}$&`);
}
