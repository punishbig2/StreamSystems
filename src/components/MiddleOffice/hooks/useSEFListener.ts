import React from "react";
import { SignalRClient } from "signalR/signalRClient";
import { SEFUpdate } from "types/sefUpdate";

export const useSEFListener = (listener: (update: SEFUpdate) => void) => {
  React.useEffect((): (() => void) => {
    return SignalRClient.addSEFUpdateListener(listener);
  }, [listener]);
};
