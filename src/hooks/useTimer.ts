import { useState, useCallback, useEffect } from "react";

export const useTimer = (): Date => {
  const [date, setDate] = useState<Date>(new Date());
  const tick = useCallback(() => {
    setDate(new Date());
  }, []);
  useEffect(() => {
    const timer = setTimeout(tick, 1000);
    return () => clearTimeout(timer);
  });
  return date;
};
