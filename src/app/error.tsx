"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center">
      <h1 className="text-4xl font-bold text-foreground">
        Une erreur est survenue
      </h1>
      <p className="mt-4 text-muted-foreground">
        Quelque chose s&apos;est mal passé. Veuillez réessayer.
      </p>
      <button
        onClick={reset}
        className="mt-8 rounded-md bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
      >
        Réessayer
      </button>
    </main>
  );
}
