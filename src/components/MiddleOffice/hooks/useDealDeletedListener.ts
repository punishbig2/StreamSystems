import { useEffect } from "react";
import signalRManager from "signalR/signalRManager";

export const useDealDeletedListener = (remove: (id: string) => void) => {
  useEffect(() => {
    return signalRManager.addDealDeletedListener(remove);
  }, [remove]);
};
