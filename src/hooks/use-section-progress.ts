"use client";

import * as React from "react";

const STORAGE_KEY = "via-antiqua-progress";

interface SectionProgress {
  [sectionId: string]: boolean;
}

export function useSectionProgress(sectionIds: string[]) {
  const [completed, setCompleted] = React.useState<SectionProgress>({});
  const [initialized, setInitialized] = React.useState(false);

  // Load from localStorage on mount
  React.useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setCompleted(JSON.parse(stored));
      }
    } catch {
      // Ignore parse errors
    } finally {
      setInitialized(true);
    }
  }, []);

  // Mark section as completed when it scrolls into view
  React.useEffect(() => {
    if (!initialized) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // Collect all new sections to avoid multiple state updates
        const newSections = new Set<string>();
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const sectionId = entry.target.id;
            if (sectionId && sectionIds.includes(sectionId)) {
              newSections.add(sectionId);
            }
          }
        });

        if (newSections.size === 0) return;

        setCompleted((prev) => {
          const updated = { ...prev };
          let changed = false;
          newSections.forEach((id) => {
            if (!updated[id]) {
              updated[id] = true;
              changed = true;
            }
          });
          if (changed) {
            try {
              localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
            } catch {
              // Ignore storage errors
            }
          }
          return updated;
        });
      },
      { threshold: 0.5 },
    );

    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [sectionIds, initialized]);

  // Reset progress
  const resetProgress = React.useCallback(() => {
    setCompleted({});
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore
    }
  }, []);

  const completedCount = Object.values(completed).filter(Boolean).length;
  const progressPercent =
    sectionIds.length > 0
      ? Math.round((completedCount / sectionIds.length) * 100)
      : 0;

  return { completed, progressPercent, resetProgress };
}
