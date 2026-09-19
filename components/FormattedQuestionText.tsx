"use client";

import React from "react";

interface FormattedQuestionTextProps {
  text: string;
  className?: string;
  isOption?: boolean;
}

export default function FormattedQuestionText({
  text,
  className = "",
  isOption = false,
}: FormattedQuestionTextProps) {
  if (!text) return null;

  const isArabic = /[\u0600-\u06FF]/.test(text);
  const arabicStyle = isArabic
    ? `font-arabic ${isOption ? "text-sm sm:text-base leading-loose" : "text-base sm:text-lg leading-loose"}`
    : "";

  // Pola markdown image: ![alt](url)
  const imageRegex = /!\[(.*?)\]\((.*?)\)/g;

  // Jika tidak ada gambar markdown, render langsung dengan newline
  if (!imageRegex.test(text)) {
    return (
      <p
        dir={isArabic ? "rtl" : "auto"}
        className={`whitespace-pre-line leading-relaxed ${arabicStyle} ${className}`}
      >
        {text}
      </p>
    );
  }

  // Reset regex index
  imageRegex.lastIndex = 0;

  const elements: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let keyIndex = 0;

  while ((match = imageRegex.exec(text)) !== null) {
    const prevText = text.slice(lastIndex, match.index);
    if (prevText) {
      elements.push(
        <span
          key={`text-${keyIndex++}`}
          dir={isArabic ? "rtl" : "auto"}
          className={`whitespace-pre-line leading-relaxed block ${arabicStyle}`}
        >
          {prevText}
        </span>,
      );
    }

    const alt = match[1] || "Gambar Soal";
    const src = match[2];

    elements.push(
      <div
        key={`img-${keyIndex++}`}
        className={
          isOption ? "my-1 inline-block" : "my-3 text-center sm:text-left"
        }
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          className={`${
            isOption
              ? "max-h-24 max-w-full sm:max-w-xs"
              : "max-w-full sm:max-w-md max-h-80"
          } w-auto h-auto rounded-lg border border-slate-200 shadow-2xs object-contain inline-block bg-white p-1 cursor-zoom-in hover:shadow-md transition-shadow`}
          onClick={(e) => {
            e.stopPropagation();
            window.open(src, "_blank");
          }}
          title="Klik untuk memperbesar gambar"
        />
        {!isOption && alt && alt !== "Gambar Soal" && alt !== "Ilustrasi" && (
          <span className="block text-[11px] text-slate-500 mt-1 italic">
            {alt}
          </span>
        )}
      </div>,
    );

    lastIndex = match.index + match[0].length;
  }

  const remainingText = text.slice(lastIndex);
  if (remainingText) {
    elements.push(
      <span
        key={`text-${keyIndex++}`}
        dir={isArabic ? "rtl" : "auto"}
        className={`whitespace-pre-line leading-relaxed block ${arabicStyle}`}
      >
        {remainingText}
      </span>,
    );
  }

  return (
    <div
      dir={isArabic ? "rtl" : "auto"}
      className={`${arabicStyle} ${className}`}
    >
      {elements}
    </div>
  );
}
