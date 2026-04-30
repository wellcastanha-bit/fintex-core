"use client";

import { useEffect } from "react";

export default function TapFeedback() {
  useEffect(() => {
    // iOS Safari só dispara :active em elementos não-âncora se houver
    // um touchstart listener no document. Este listener vazio é suficiente.
    const noop = () => {};
    document.addEventListener("touchstart", noop, { passive: true });
    return () => document.removeEventListener("touchstart", noop);
  }, []);

  return null;
}
