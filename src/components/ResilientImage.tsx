import { useState } from 'react';
import { Code2 } from 'lucide-react';

interface ResilientImageProps {
  src: string;
  alt: string;
  fallbackTitle: string;
  className?: string;
}

export function ResilientImage({
  src,
  alt,
  fallbackTitle,
  className = '',
}: ResilientImageProps) {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-[#121726] via-[#0E1320] to-[#090B10] p-6 text-center ${className}`}
        role="img"
        aria-label={alt}
      >
        <Code2 className="h-8 w-8 text-blue-400/70 mb-3" aria-hidden="true" />
        <span className="text-sm font-medium text-zinc-300 tracking-wide">
          {fallbackTitle}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setHasError(true)}
      className={className}
    />
  );
}
