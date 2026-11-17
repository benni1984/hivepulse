'use client';
import { useEffect, useRef, useState } from 'react';
import { useLocale } from 'next-intl';
import { localisedScreenshot } from '@/lib/screenshotLocale';

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
  const locale = useLocale();
  const ios = iosCounterpart(android);
  const sources: Record<Tab, string | null> = { android, ios, web };
  const [active, setActive] = useState<Tab>('android');
  // Unknown until the browser has tried to load the image.
  const [loaded, setLoaded] = useState<Partial<Record<Tab, boolean>>>({});
  // Per platform: this language has no picture of its own, so the English one is shown (#475).
  const [fellBack, setFellBack] = useState<Partial<Record<Tab, boolean>>>({});
  const [open, setOpen] = useState(false);

  const available = (tab: Tab) => sources[tab] !== null && loaded[tab] !== false && (tab !== 'ios' || loaded.ios === true);
  const tabs = (['android', 'ios', 'web'] as Tab[]).filter(available);
  const current: Tab = available(active) ? active : (tabs[0] ?? 'android');
  const mark = (tab: Tab, ok: boolean) => setLoaded(prev => (prev[tab] === ok ? prev : { ...prev, [tab]: ok }));

  /** The language's own picture, until it turns out not to exist. */
  const srcFor = (tab: Tab): string | null => {
    const base = sources[tab];
    if (!base) return null;
    return fellBack[tab] ? base : localisedScreenshot(base, locale);
  };
  /**
   * One step down rather than straight to "unavailable": a language that has not been captured
   * yet is the normal state while #475 is being filled in, and its English picture is still a
   * perfectly good answer. Only a platform with no picture at all drops its tab.
   */
  const stepDown = (tab: Tab) => {
    if (sources[tab] && !fellBack[tab] && srcFor(tab) !== sources[tab]) {
      setFellBack(prev => ({ ...prev, [tab]: true }));
    } else {
      mark(tab, false);
    }
  };
  const imgSrc = srcFor(current) ?? android;

  // Server-rendered pages ask for their pictures while the HTML is still being parsed, so a 404
  // fires its error event before React has hydrated and attached `onError`. Both images are
  // therefore also inspected once after mounting; without it, a language with no pictures of its
  // own would lose its tabs instead of falling back to English (#475).
  const iosRef = useRef<HTMLImageElement>(null);
  const mainRef = useRef<HTMLImageElement>(null);
  const settled = (el: HTMLImageElement | null) => el?.complete === true;
  useEffect(() => {
    const el = iosRef.current;
    if (!settled(el)) return;
    if (el!.naturalWidth === 0) stepDown('ios');
    else mark('ios', true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ios, fellBack.ios]);
  useEffect(() => {
    const el = mainRef.current;
    if (settled(el) && el!.naturalWidth === 0) stepDown(current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imgSrc, current, fellBack[current]]);
  const showsIos = tabs.includes('ios');

  // Nothing could be loaded at all: no picture is better than a broken one.
  if (tabs.length === 0) return null;

  return (
    <>
      {/* The iPhone picture is only offered once it has loaded; this is how that is found out. */}
      {ios && (
        // eslint-disable-next-line @next/next/no-img-element
        <img ref={iosRef} src={srcFor('ios') ?? ios} alt="" hidden onLoad={() => mark('ios', true)} onError={() => stepDown('ios')} />
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
          ref={mainRef}
          src={imgSrc}
          alt={alt ?? caption}
          onClick={() => setOpen(true)}
          onError={() => stepDown(current)}
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
