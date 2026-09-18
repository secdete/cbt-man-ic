'use client';

import { useState } from 'react';
import Image from 'next/image';

interface CakrawalaLogoProps {
  className?: string;
  size?: number;
}

export default function CakrawalaLogo({ className = 'w-10 h-10', size = 40 }: CakrawalaLogoProps) {
  const [src, setSrc] = useState('/logo-cakrawala.png');

  return (
    <div className={`relative flex items-center justify-center flex-shrink-0 overflow-hidden rounded-xl ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt="Logo Cakrawala"
        width={size}
        height={size}
        className="w-full h-full object-contain rounded-xl"
        onError={() => {
          // Jika logo-cakrawala.png belum ditaruh user, otomatis beralih ke logo-cakrawala.svg
          if (src !== '/logo-cakrawala.svg') {
            setSrc('/logo-cakrawala.svg');
          }
        }}
      />
    </div>
  );
}
