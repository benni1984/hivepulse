import HelpScreenshotTabs from './HelpScreenshotTabs';

interface Props {
  caption: string;
  src?: string;
  alt?: string;
  android?: string;
  web?: string;
}

export default function HelpScreenshot({ caption, src, alt, android, web }: Props) {
  if (android && web) {
    return <HelpScreenshotTabs android={android} web={web} caption={caption} alt={alt} />;
  }

  const imgSrc = src ?? android ?? web;

  return (
    <figure className="help-screenshot">
      {imgSrc ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imgSrc} alt={alt ?? caption} />
      ) : (
        <div className="help-screenshot-inner">
          <i className="fas fa-image" />
          <span>Screenshot: {caption}</span>
        </div>
      )}
      <figcaption className="help-screenshot-caption">{caption}</figcaption>
    </figure>
  );
}
