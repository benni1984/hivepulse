'use client';
import { useState } from 'react';
import HelpScreenshotTabs from './HelpScreenshotTabs';

interface Props {
  caption: string;
  src?: string;
  alt?: string;
  android?: string;
  web?: string;
}

export default function HelpScreenshot({ caption, src, alt, android, web }: Props) {
  const [open, setOpen] = useState(false);

  if (android && web) {
    return <HelpScreenshotTabs android={android} web={web} caption={caption} alt={alt} />;
  }

  const imgSrc = src ?? android ?? web;

  return (
    <>
      <figure className="help-screenshot help-screenshot--thumb" onClick={() => imgSrc && setOpen(true)}>
        {imgSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imgSrc} alt={alt ?? caption} />
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
