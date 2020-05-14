import { useEffect } from "react";

export const useFlasher = (flash: boolean, stopFlashing: () => void) => {
  useEffect(() => {
    if (!flash) return;
    const timer = setTimeout(stopFlashing, 2000);
    return () => clearTimeout(timer);
  }, [flash, stopFlashing]);
};
