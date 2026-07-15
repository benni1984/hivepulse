import Link from 'next/link';
import { useTranslations } from 'next-intl';

export default function Footer() {
  const t = useTranslations('footer');
  const tn = useTranslations('nav');

  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <Link className="footer-logo" href="/">
              <svg width="30" height="30" viewBox="0 0 44 44" aria-hidden="true" style={{ flexShrink: 0 }}>
                <polygon points="22,2 39.12,12 39.12,32 22,42 4.88,32 4.88,12" fill="#f59e0b"/>
                <polygon points="22,4.5 37,13.5 37,30.5 22,39.5 7,30.5 7,13.5" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1"/>
                <polygon points="22,11 26.76,13.75 26.76,19.25 22,22 17.24,19.25 17.24,13.75" fill="rgba(255,255,255,0.2)" stroke="white" strokeWidth="1.2" strokeLinejoin="round"/>
                <polygon points="17.24,19.25 22,22 22,27.5 17.24,30.25 12.48,27.5 12.48,22" fill="rgba(255,255,255,0.2)" stroke="white" strokeWidth="1.2" strokeLinejoin="round"/>
                <polygon points="26.76,19.25 31.52,22 31.52,27.5 26.76,30.25 22,27.5 22,22" fill="rgba(255,255,255,0.2)" stroke="white" strokeWidth="1.2" strokeLinejoin="round"/>
                <path d="M6,27 C12,27 15,24 20,25 C25,26 27,17 31,15 C34,14 36.5,13.5 36.5,13.5" fill="none" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" opacity={0.9}/>
                <circle cx="36.5" cy="13.5" r="2" fill="white" opacity={0.95}/>
              </svg>
              <span>Hive<span>Pulse</span></span>
            </Link>
            <p>{t('tagline')}</p>
            <div className="footer-social">
              <a href="https://github.com/benni1984/HivePulse" target="_blank" rel="noopener" aria-label="GitHub">
                <i className="fab fa-github" />
              </a>
            </div>
          </div>
          <div className="footer-links">
            <h4>{t('explore')}</h4>
            <ul>
              <li><Link href="/map">{tn('map')}</Link></li>
              <li><Link href="/members">{tn('members')}</Link></li>
              <li><Link href="/news">{tn('news')}</Link></li>
            </ul>
          </div>
          <div className="footer-links">
            <h4>{t('community')}</h4>
            <ul>
              <li><Link href="/contribute">{tn('contribute')}</Link></li>
              <li><a href="https://github.com/benni1984/HivePulse" target="_blank" rel="noopener">GitHub</a></li>
            </ul>
          </div>
          <div className="footer-links">
            <h4>{t('support')}</h4>
            <ul>
              <li><a href="https://ko-fi.com/benjaminmuller64800" target="_blank" rel="noopener" data-umami-event="footer_kofi">Ko-fi</a></li>
              <li><a href="https://www.paypal.com/donate/?hosted_button_id=H583STJ96AXT2" target="_blank" rel="noopener" data-umami-event="footer_paypal">PayPal</a></li>
            </ul>
          </div>
          <div className="footer-links">
            <h4>{t('legal')}</h4>
            <ul>
              <li><Link href="/help">Help &amp; Docs</Link></li>
              <li><Link href="/privacy">{t('privacy')}</Link></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <p>{t('copyright')}</p>
          <p>{t('made')}</p>
        </div>
      </div>
    </footer>
  );
}
