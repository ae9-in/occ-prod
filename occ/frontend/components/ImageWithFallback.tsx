"use client";

import type { ImgHTMLAttributes } from "react";
import { useEffect, useMemo, useState } from "react";
import { normalizeAssetUrl } from "@/lib/assetUrl";

type ImageWithFallbackProps = Omit<ImgHTMLAttributes<HTMLImageElement>, "src"> & {
  fallbackSrc: string;
  src?: string | null;
};

const isRenderableImageSrc = (value?: string | null) => {
  const normalized = normalizeAssetUrl(value);
  return !!normalized && !normalized.startsWith("blob:") && !normalized.startsWith("file:");
};

export default function ImageWithFallback({
  alt,
  fallbackSrc,
  src,
  ...props
}: ImageWithFallbackProps) {
  const resolvedSrc = useMemo(
    () => (isRenderableImageSrc(src) ? normalizeAssetUrl(src, fallbackSrc)! : fallbackSrc),
    [fallbackSrc, src],
  );
  const [currentSrc, setCurrentSrc] = useState(resolvedSrc);

  useEffect(() => {
    setCurrentSrc(resolvedSrc);
  }, [resolvedSrc]);

  return (
    <img
      {...props}
      alt={alt}
      src={currentSrc}
      onError={() => {
        if (currentSrc !== fallbackSrc) {
          setCurrentSrc(fallbackSrc);
        }
      }}
    />
  );
}
