import { Deal } from "components/MiddleOffice/types/deal";
import { useEffect } from "react";
import signalRManager from "signalR/signalRManager";

export const useNewDealListener = (setDeal: (deal: Deal) => void) => {
  useEffect((): (() => void) => {
    return signalRManager.addDealListener(setDeal);
  }, [setDeal]);
};
