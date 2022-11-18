import { useEffect } from 'react';
import signalRManager from 'signalR/signalRClient';

export const useDealDeletedListener = (remove: (id: string) => void): void => {
  useEffect(() => {
    return signalRManager.addDealDeletedListener(remove);
  }, [remove]);
};
