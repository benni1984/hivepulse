// Placeholder component until real screenshots are taken.
// Replace `src` prop with the actual image path from public/docs/screenshots/.

interface Props {
  caption: string;
  src?: string;
  alt?: string;
}

export default function HelpScreenshot({ caption, src, alt }: Props) {
  return (
    <figure className="help-screenshot">
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt ?? caption} />
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
