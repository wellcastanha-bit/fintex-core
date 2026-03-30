"use client";

import { useEffect, useState } from "react";

let _cache: string | null = null;

export function useEmpresaId(): string | null {
  const [id, setId] = useState<string | null>(_cache);

  useEffect(() => {
    if (_cache) return;
    fetch("/api/empresa")
      .then((r) => r.json())
      .then((j) => {
        _cache = j?.data?.id ?? null;
        setId(_cache);
      })
      .catch(() => {});
  }, []);

  return id;
}
