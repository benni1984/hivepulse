'use client';
import { useState } from 'react';

interface Props {
  android: string;
  web: string;
  caption: string;
  alt?: string;
}

type Tab = 'android' | 'ios' | 'web';

/** `/docs/screenshots/android-hive-list.png` has the iPhone picture `/docs/screenshots/ios-hive-list.png`. */
export function iosCounterpart(android: string): string | null {
  return /\/android-[^/]+$/.test(android) ? android.replace(/\/android-([^/]+)$/, '/ios-$1') : null;
}

/**
 * Android and web, and the iPhone when its picture exists. The pictures come from the screenshot workflow
 * (see .github/workflows/update-help-screenshots.yml), which retakes a platform when its interface changed,
 * so a picture that is not there yet is simply not offered instead of showing a broken image.
 */
export default function HelpScreenshotTabs({ android, web, caption, alt }: Props) {
  const ios = iosCounterpart(android);
  const sources: Record<Tab, string | null> = { android, ios, web };
  const [active, setActive] = useState<Tab>('android');
  // Unknown until the browser has tried to load the image.
  const [loaded, setLoaded] = useState<Partial<Record<Tab, boolean>>>({});
  const [open, setOpen] = useState(false);

  const available = (tab: Tab) => sources[tab] !== null && loaded[tab] !== false && (tab !== 'ios' || loaded.ios === true);
  const tabs = (['android', 'ios', 'web'] as Tab[]).filter(available);
  const current: Tab = available(active) ? active : (tabs[0] ?? 'android');
  const imgSrc = sources[current] ?? android;
  const mark = (tab: Tab, ok: boolean) => setLoaded(prev => (prev[tab] === ok ? prev : { ...prev, [tab]: ok }));
  const showsIos = tabs.includes('ios');

  // Nothing could be loaded at all: no picture is better than a broken one.
  if (tabs.length === 0) return null;

  return (
    <>
      {/* The iPhone picture is only offered once it has loaded; this is how that is found out. */}
      {ios && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={ios} alt="" hidden onLoad={() => mark('ios', true)} onError={() => mark('ios', false)} />
      )}
      <figure className="help-screenshot help-screenshot--tabbed help-screenshot--thumb">
        <div className="help-screenshot-tabs" role="tablist">
          {available('android') && (
            <button
              role="tab"
              aria-selected={current === 'android'}
              className={`help-screenshot-tab${current === 'android' ? ' active' : ''}`}
              onClick={() => setActive('android')}
            >
              <i className="fab fa-android" /> {showsIos ? 'Android' : 'App'}
            </button>
          )}
          {showsIos && (
            <button
              role="tab"
              aria-selected={current === 'ios'}
              className={`help-screenshot-tab${current === 'ios' ? ' active' : ''}`}
              onClick={() => setActive('ios')}
            >
              <i className="fab fa-apple" /> iPhone
            </button>
          )}
          {available('web') && (
            <button
              role="tab"
              aria-selected={current === 'web'}
              className={`help-screenshot-tab${current === 'web' ? ' active' : ''}`}
              onClick={() => setActive('web')}
            >
              <i className="fas fa-globe" /> Web
            </button>
          )}
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imgSrc}
          alt={alt ?? caption}
          onClick={() => setOpen(true)}
          onError={() => mark(current, false)}
          style={{ cursor: 'zoom-in' }}
        />
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
