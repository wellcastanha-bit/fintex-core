"use client";

import { useEffect, useState } from "react";

export function useEmpresaId(): string | null {
  const [id, setId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/empresa")
      .then((r) => r.json())
      .then((j) => {
        if (!cancelled) setId(j?.data?.id ?? null);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  return id;
}
