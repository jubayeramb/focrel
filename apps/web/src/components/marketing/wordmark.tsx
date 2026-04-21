import logoUrl from "@focrel/brand/assets/logo.svg";

type Props = {
  className?: string;
};

/**
 * Focrel wordmark — real app logo (SVG) rendered at whatever size the parent
 * dictates. Kept as a thin wrapper so size/shape tweaks happen in one place.
 *
 * Note: Next.js's SVG import returns a StaticImport (`{ src, width, height }`)
 * — not a plain URL string. Passing the bare object to `<img src>` stringifies
 * it to "[object Object]" and the browser then GETs `/[object%20Object]` → 404.
 * We reach in for `.src` explicitly.
 */
export function Wordmark({ className }: Props) {
  return (
    <img
      src={logoUrl.src}
      alt="Focrel"
      aria-hidden
      className={className}
      draggable={false}
    />
  );
}
