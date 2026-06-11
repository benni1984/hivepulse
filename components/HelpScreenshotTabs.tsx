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

  return (
    <figure className="help-screenshot help-screenshot--tabbed">
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
      <img src={active === 'android' ? android : web} alt={alt ?? caption} />
      <figcaption className="help-screenshot-caption">{caption}</figcaption>
    </figure>
  );
}
