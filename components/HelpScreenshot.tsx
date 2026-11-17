'use client';
import { useEffect, useRef, useState } from 'react';
import { useLocale } from 'next-intl';
import HelpScreenshotTabs from './HelpScreenshotTabs';
import { localisedScreenshot } from '@/lib/screenshotLocale';

interface Props {
  caption: string;
  src?: string;
  alt?: string;
  android?: string;
  web?: string;
}

export default function HelpScreenshot({ caption, src, alt, android, web }: Props) {
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  // A picture the screenshot workflow has not produced yet is left out rather than shown broken.
  const [missing, setMissing] = useState(false);
  // This language has no picture of its own yet, so the English one is shown instead (#475).
  const [fellBack, setFellBack] = useState(false);

  const base = src ?? android ?? web;
  const imgSrc = base && !fellBack ? localisedScreenshot(base, locale) : base;
  // Two steps down: the language's own picture, then English, then nothing at all. Falling back
  // is the normal case while a language is being filled in, not an error worth showing anybody.
  const onMissing = () => {
    if (!fellBack && imgSrc !== base) setFellBack(true);
    else setMissing(true);
  };

  // The help pages are server-rendered, so the browser asks for the picture while it is still
  // parsing the HTML -- long before React has hydrated and attached `onError`. A 404 therefore
  // fires its error event into nothing, and without this check a language with no pictures of
  // its own would show an empty frame instead of the English one. Found in the browser; no unit
  // test can see it, because in jsdom the component always renders client-side first (#475).
  const imgRef = useRef<HTMLImageElement>(null);
  useEffect(() => {
    const el = imgRef.current;
    if (!el || !el.complete || el.naturalWidth !== 0) return;
    onMissing();
    // `onMissing` is rebuilt every render; the state it reads is in the list instead.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imgSrc, fellBack]);

  // Every hook above this line: the tabbed variant returns early, and React counts hooks per
  // render, not per branch.
  if (android && web) {
    return <HelpScreenshotTabs android={android} web={web} caption={caption} alt={alt} />;
  }

  if (missing) return null;

  return (
    <>
      <figure className="help-screenshot help-screenshot--thumb" onClick={() => imgSrc && setOpen(true)}>
        {imgSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img ref={imgRef} src={imgSrc} alt={alt ?? caption} onError={onMissing} />
        ) : (
          <div className="help-screenshot-inner">
            <i className="fas fa-image" />
            <span>Screenshot: {caption}</span>
          </div>
        )}
        {imgSrc && <div className="help-screenshot-zoom"><i className="fas fa-expand-alt" /></div>}
        <figcaption className="help-screenshot-caption">{caption}</figcaption>
      </figure>

      {open && (
        <div className="help-lightbox" onClick={() => setOpen(false)} role="dialog" aria-modal>
          <button className="help-lightbox-close" onClick={() => setOpen(false)} aria-label="Close">
            <i className="fas fa-times" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imgSrc} alt={alt ?? caption} onClick={e => e.stopPropagation()} />
          <p className="help-lightbox-caption">{caption}</p>
        </div>
      )}
    </>
  );
}
