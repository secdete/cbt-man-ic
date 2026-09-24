"use client";

import { useState } from "react";

interface CakrawalaLogoProps {
  className?: string;
  height?: number;
  size?: number;
}

export default function CakrawalaLogo({
  className = "h-9 w-auto",
  height,
  size = 36,
}: CakrawalaLogoProps) {
  const [src, setSrc] = useState("/logo-cakrawala.png");
  const actualHeight = height ?? size;

  return (
    <div
      className="inline-flex items-center justify-center rounded-full bg-white p-1 shadow-xs border border-white/20 flex-shrink-0"
      style={{
        width: `${actualHeight + 6}px`,
        height: `${actualHeight + 6}px`,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt="Logo Cakrawala"
        style={{ maxHeight: `${actualHeight}px`, width: "auto" }}
        className={`object-contain block rounded-full ${className}`}
        onError={() => {
          if (src === "/logo-cakrawala.png") {
            setSrc("/Logo Cakra.png");
          } else if (src !== "/logo-cakrawala.svg") {
            setSrc("/logo-cakrawala.svg");
          }
        }}
      />
    </div>
  );
}
