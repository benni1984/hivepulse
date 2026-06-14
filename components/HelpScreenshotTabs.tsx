'use client';
import { useState } from 'react';

interface Props {
  android: string;
  web: string;
  caption: string;
  alt?: string;
}

export default function HelpScreenshotTabs({ android, web, caption, alt }: Props) {
  const [active, setActive] = useState<'android' | 'web'>('android');
  const [open, setOpen] = useState(false);
  const imgSrc = active === 'android' ? android : web;

  return (
    <>
      <figure className="help-screenshot help-screenshot--tabbed help-screenshot--thumb">
        <div className="help-screenshot-tabs" role="tablist">
          <button
            role="tab"
            aria-selected={active === 'android'}
            className={`help-screenshot-tab${active === 'android' ? ' active' : ''}`}
            onClick={() => setActive('android')}
          >
            <i className="fab fa-android" /> App
          </button>
          <button
            role="tab"
            aria-selected={active === 'web'}
            className={`help-screenshot-tab${active === 'web' ? ' active' : ''}`}
            onClick={() => setActive('web')}
          >
            <i className="fas fa-globe" /> Web
          </button>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imgSrc} alt={alt ?? caption} onClick={() => setOpen(true)} style={{ cursor: 'zoom-in' }} />
        <div className="help-screenshot-zoom" onClick={() => setOpen(true)}><i className="fas fa-expand-alt" /></div>
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
