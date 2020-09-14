import { DealEntryStore } from "mobx/stores/dealEntryStore";
import dealsStore from "mobx/stores/dealsStore";
import moStore from "mobx/stores/moStore";
import { useEffect } from "react";
import signalRManager from "signalR/signalRManager";

export const useDealDeletedListener = (entryStore: DealEntryStore) => {
  useEffect(() => {
    return signalRManager.addDealDeletedListener((dealID: string) => {
      dealsStore.removeDeal(dealID);
      if (moStore.selectedDealID === dealID) {
        moStore.setDeal(null, entryStore);
      }
    });
  }, [entryStore]);
};
