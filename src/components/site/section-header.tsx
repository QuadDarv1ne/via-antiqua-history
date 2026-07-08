"use client";

import React from "react";

interface SectionHeaderProps {
  icon: React.ReactNode;
  label: string;
  title: string;
  description?: string;
  readingTime?: React.ReactNode;
  className?: string;
}

export const SectionHeader = React.memo(function SectionHeader({
  icon,
  label,
  title,
  description,
  readingTime,
  className,
}: SectionHeaderProps) {
  const ref = React.useRef<HTMLDivElement | null>(null);
  const [inView, setInView] = React.useState(false);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2, rootMargin: "-100px" },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`mb-6 sm:mb-8 md:mb-10 text-center transition-all duration-700 ${
        inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"
      } ${className ?? ""}`}
    >
      <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-full border border-primary/30 bg-primary/5 mb-3 sm:mb-4">
        {icon}
        <span className="text-[10px] sm:text-xs uppercase tracking-widest font-medium">
          {label}
        </span>
      </div>
      <h2 className="font-display text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-semibold mb-3 sm:mb-4">
        {title}
      </h2>
      {description && (
        <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
          {description}
        </p>
      )}
      {readingTime}
    </div>
  );
});
