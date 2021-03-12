import React from "react";
import signalRManager from "signalR/signalRManager";

export const useGlow = (currency: string, strategy: string): boolean => {
  const [glowing, setGlowing] = React.useState<boolean>(false);
  React.useEffect((): (() => void) | void => {
    if (!glowing) return;
    const timer = setTimeout((): void => {
      console.log("glowing is going to be false");
      setGlowing(false);
    }, 6000);
    return (): void => {
      clearTimeout(timer);
    };
  }, [glowing]);

  React.useEffect((): (() => void) => {
    return signalRManager.addExecutionListener(strategy, currency, (): void => {
      setGlowing(true);
    });
  }, [strategy, currency]);
  return glowing;
};
