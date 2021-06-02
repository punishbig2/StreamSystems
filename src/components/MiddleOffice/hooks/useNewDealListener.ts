import { useEffect } from "react";
import signalRManager from "signalR/signalRManager";

export const useNewDealListener = (
  setDeal: (deal: { [key: string]: any }) => void
) => {
  useEffect((): (() => void) => {
    return signalRManager.addDealListener(setDeal);
  }, [setDeal]);
};
