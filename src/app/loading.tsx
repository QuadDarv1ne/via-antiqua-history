"use client";

import { Loader2 } from "lucide-react";
import * as React from "react";

export default function Loading() {
  const [show, setShow] = React.useState(true);

  // Скрываем прелоадер через 3 секунды, чтобы избежать бесконечного ожидания
  React.useEffect(() => {
    const timer = setTimeout(() => setShow(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  if (!show) return null;

  return (
    <main
      className="min-h-screen flex items-center justify-center bg-background px-4"
      role="status"
      aria-live="polite"
      aria-label="Загрузка страницы"
    >
      <div className="flex flex-col items-center gap-4">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
          <Loader2 className="h-7 w-7 animate-spin text-primary" />
        </span>
        <div className="text-center">
          <p className="text-sm text-muted-foreground font-medium animate-pulse">
            Открываем свиток истории…
          </p>
        </div>
      </div>
    </main>
  );
}
