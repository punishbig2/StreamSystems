import React from "react";
import { SignalRManager } from "signalR/signalRManager";
import { SEFUpdate } from "types/sefUpdate";

export const useSEFListener = (listener: (update: SEFUpdate) => void) => {
  React.useEffect((): (() => void) => {
    return SignalRManager.addSEFUpdateListener(listener);
  }, [listener]);
};
