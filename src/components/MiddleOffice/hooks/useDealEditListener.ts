import { useEffect } from "react";
import signalRManager, { DealEditStatus } from "signalR/signalRManager";

export const useDealEditListener = (
  edit: (status: DealEditStatus, id: string) => void
) => {
  useEffect(() => {
    return signalRManager.setDealEditListener(edit);
  }, [edit]);
};
