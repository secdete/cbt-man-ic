"use client";

import { useState } from "react";

interface CakrawalaLogoProps {
  className?: string;
  height?: number;
  size?: number;
}

export default function CakrawalaLogo({
  className = "h-11 w-auto",
  height,
  size = 46,
}: CakrawalaLogoProps) {
  const [src, setSrc] = useState("/logo-cakrawala.png");
  const actualHeight = height ?? size;

  return (
    <div
      className="inline-flex items-center justify-center rounded-full bg-white p-1.5 shadow-sm border border-slate-200/80 flex-shrink-0"
      style={{
        width: `${actualHeight + 10}px`,
        height: `${actualHeight + 10}px`,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt="Logo Cakrawala"
        style={{
          maxHeight: `${actualHeight}px`,
          maxWidth: `${actualHeight}px`,
          width: "auto",
          height: "auto",
        }}
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
