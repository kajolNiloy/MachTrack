import { useEffect, useState } from "react";

function getDeviceType(width) {
  if (width < 768) return "mobile";
  if (width < 1024) return "tablet";
  return "desktop";
}

export function useDeviceType() {
  const [device, setDevice] = useState(() => getDeviceType(window.innerWidth));

  useEffect(() => {
    const handler = () => setDevice(getDeviceType(window.innerWidth));
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  return device; // "mobile" | "tablet" | "desktop"
}