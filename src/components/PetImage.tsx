import React, { useState } from 'react';
export function PetImage({src, onError, ...props}: React.ImgHTMLAttributes<HTMLImageElement>) {
  const [failedSrc, setFailedSrc] = useState<string>();
  return <img {...props} src={!src || failedSrc === src ? '/icon.svg' : src} onError={e => {
    if (failedSrc !== src) setFailedSrc(src);
    onError?.(e);
  }} />;
}
