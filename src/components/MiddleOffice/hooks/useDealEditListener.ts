import { useEffect } from "react";
import signalRManager, { DealEditStatus } from "signalR/signalRClient";

export const useDealEditListener = (
  edit: (status: DealEditStatus, id: string) => void
) => {
  useEffect(() => {
    return signalRManager.setDealEditListener(edit);
  }, [edit]);
};
