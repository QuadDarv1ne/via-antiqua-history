"use client";

import * as React from "react";

const STORAGE_KEY = "via-antiqua-progress";

interface SectionProgress {
  [sectionId: string]: boolean;
}

export function useSectionProgress(sectionIds: string[]) {
  const [completed, setCompleted] = React.useState<SectionProgress>({});
  const [initialized, setInitialized] = React.useState(false);

  const sectionIdSet = React.useMemo(() => new Set(sectionIds), [sectionIds]);

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

  // Persist to localStorage when completed changes
  React.useEffect(() => {
    if (!initialized) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(completed));
    } catch {
      // Ignore storage errors
    }
  }, [completed, initialized]);

  // Mark section as completed when it scrolls into view
  React.useEffect(() => {
    if (!initialized) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const newSections = new Set<string>();
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const sectionId = entry.target.id;
            if (sectionId && sectionIdSet.has(sectionId)) {
              newSections.add(sectionId);
            }
          }
        });

        if (newSections.size === 0) return;

        setCompleted((prev) => {
          const updated = { ...prev };
          newSections.forEach((id) => {
            if (!updated[id]) {
              updated[id] = true;
            }
          });
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
  }, [sectionIds, sectionIdSet, initialized]);

  // Reset progress
  const resetProgress = React.useCallback(() => {
    setCompleted({});
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore
    }
  }, []);

  const progressPercent = React.useMemo(() => {
    const count = Object.values(completed).filter(Boolean).length;
    return sectionIds.length > 0 ? Math.round((count / sectionIds.length) * 100) : 0;
  }, [completed, sectionIds]);

  return { completed, progressPercent, resetProgress };
}
