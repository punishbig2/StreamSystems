import { DealEntryStore } from "mobx/stores/dealEntryStore";
import dealsStore from "mobx/stores/dealsStore";
import moStore from "mobx/stores/moStore";
import { useEffect } from "react";
import signalRManager from "signalR/signalRManager";

export const useDealDeletedListener = (entryStore: DealEntryStore) => {
  useEffect(() => {
    return signalRManager.addDealDeletedListener((dealId: string) => {
      dealsStore.removeDeal(dealId);
      moStore.setDeal(null, entryStore);
    });
  }, [entryStore]);
};
