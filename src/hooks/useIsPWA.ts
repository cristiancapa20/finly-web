"use client";

import { useEffect, useState } from "react";

function checkIsPWA(): boolean {
  const nav = window.navigator as unknown as { standalone?: boolean };

  if (nav.standalone === true) return true;

  const modes = ["standalone", "fullscreen", "minimal-ui"];
  if (modes.some((m) => window.matchMedia(`(display-mode: ${m})`).matches)) return true;

  return false;
}

export function useIsPWA() {
  const [isPWA, setIsPWA] = useState(false);

  useEffect(() => {
    setIsPWA(checkIsPWA());

    const mq = window.matchMedia("(display-mode: standalone)");
    const handler = () => setIsPWA(checkIsPWA());
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return isPWA;
}
