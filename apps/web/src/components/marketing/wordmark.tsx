import logoUrl from "@focrel/brand/assets/logo.svg";

type Props = {
  className?: string;
};

/**
 * Focrel wordmark — real app logo (SVG) rendered at whatever size the parent
 * dictates. Kept as a thin wrapper so size/shape tweaks happen in one place.
 */
export function Wordmark({ className }: Props) {
  return (
    <img
      src={logoUrl}
      alt="Focrel"
      aria-hidden
      className={className}
      draggable={false}
    />
  );
}
