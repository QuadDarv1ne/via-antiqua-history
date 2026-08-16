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
        const parsed: unknown = JSON.parse(stored);
        // Validate shape: progress хранится как объект { sectionId: boolean };
        // некорректные данные (null, число, массив) не должны ломать navbar
        if (
          typeof parsed === "object" &&
          parsed !== null &&
          !Array.isArray(parsed) &&
          Object.values(parsed).every((v) => typeof v === "boolean")
        ) {
          setCompleted(parsed as SectionProgress);
        }
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

    const observed = new Set<string>();

    const observeMissing = () => {
      sectionIds.forEach((id) => {
        if (observed.has(id)) return;
        const el = document.getElementById(id);
        if (el) {
          observer.observe(el);
          observed.add(id);
        }
      });
    };

    observeMissing();

    // Секции грузятся лениво (next/dynamic) — повторно сканируем DOM при появлении новых
    let scheduled = false;
    let mutationObserver: MutationObserver | null = null;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let disposed = false;
    if (observed.size < sectionIds.length) {
      mutationObserver = new MutationObserver(() => {
        if (scheduled || disposed) return;
        scheduled = true;
        retryTimer = setTimeout(() => {
          scheduled = false;
          if (disposed) return;
          observeMissing();
          if (observed.size === sectionIds.length) {
            mutationObserver?.disconnect();
          }
        }, 200);
      });
      mutationObserver.observe(document.body, {
        childList: true,
        subtree: true,
      });
    }

    // Страховка: прекращаем наблюдение через 30 секунд, даже если не все секции найдены
    const stopTimer = setTimeout(() => {
      mutationObserver?.disconnect();
      observer.disconnect();
    }, 30000);

    return () => {
      disposed = true;
      if (retryTimer) clearTimeout(retryTimer);
      mutationObserver?.disconnect();
      observer.disconnect();
      clearTimeout(stopTimer);
    };
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
    // Считаем только актуальные секции: в localStorage могут остаться ключи
    // от прошлых версий страницы (или убранных платных секций), которые
    // не должны раздувать процент выше 100
    const count = sectionIds.filter((id) => completed[id]).length;
    return sectionIds.length > 0 ? Math.round((count / sectionIds.length) * 100) : 0;
  }, [completed, sectionIds]);

  return { completed, progressPercent, resetProgress };
}
