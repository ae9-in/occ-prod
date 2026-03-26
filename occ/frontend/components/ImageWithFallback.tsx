"use client";

import type { ImgHTMLAttributes } from "react";
import { useMemo, useState } from "react";
import { normalizeAssetUrl } from "@/lib/assetUrl";

type ImageWithFallbackProps = Omit<ImgHTMLAttributes<HTMLImageElement>, "src"> & {
  fallbackSrc: string;
  src?: string | null;
  hideOnError?: boolean;
};

const isRenderableImageSrc = (value?: string | null) => {
  const normalized = normalizeAssetUrl(value);
  return !!normalized && !normalized.startsWith("blob:") && !normalized.startsWith("file:");
};

function ImageWithFallbackInner({
  alt,
  fallbackSrc,
  initialSrc,
  hideOnError,
  ...props
}: Omit<ImageWithFallbackProps, "src"> & { initialSrc: string }) {
  const [currentSrc, setCurrentSrc] = useState(initialSrc);
  const [isHidden, setIsHidden] = useState(false);

  if (hideOnError && isHidden) {
    return null;
  }

  return (
    <img
      {...props}
      alt={alt}
      src={currentSrc}
      onError={() => {
        if (hideOnError) {
          setIsHidden(true);
          return;
        }

        if (currentSrc !== fallbackSrc) {
          setCurrentSrc(fallbackSrc);
        }
      }}
    />
  );
}

export default function ImageWithFallback({
  alt,
  fallbackSrc,
  src,
  hideOnError = false,
  ...props
}: ImageWithFallbackProps) {
  const resolvedSrc = useMemo(
    () => (isRenderableImageSrc(src) ? normalizeAssetUrl(src, fallbackSrc)! : fallbackSrc),
    [fallbackSrc, src],
  );

  return (
    <ImageWithFallbackInner
      key={resolvedSrc}
      alt={alt}
      fallbackSrc={fallbackSrc}
      initialSrc={resolvedSrc}
      hideOnError={hideOnError}
      {...props}
    />
  );
}
