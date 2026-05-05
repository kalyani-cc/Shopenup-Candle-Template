import Image from "next/image";

type StoreProductImageProps = {
  src?: string;
  alt: string;
  className?: string;
};

/**
 * Remote store URLs use `<img>` (any host). Local `/…` paths use `next/image` with `fill` (parent must be `position-relative`, e.g. `.ratio`).
 */
export function StoreProductImage({ src, alt, className }: StoreProductImageProps) {
  if (!src) {
    return (
      <div
        className={`position-absolute top-0 start-0 w-100 h-100 ${className ?? ""}`}
        style={{ background: "linear-gradient(135deg, #f5f0eb 0%, #ebe5df 100%)" }}
      />
    );
  }
  if (src.startsWith("/")) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        className={`${className ?? ""} object-fit-cover`}
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 400px"
      />
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element -- backend/CDN host varies per deployment
    <img
      src={src}
      alt={alt}
      className={`position-absolute top-0 start-0 w-100 h-100 ${className ?? ""}`}
      style={{ objectFit: "cover" }}
      loading="lazy"
      decoding="async"
    />
  );
}
