import { useEffect } from 'react';
import signalRManager from 'signalR/signalRClient';

export const useNewDealListener = (setDeal: (deal: { [key: string]: any }) => void): void => {
  useEffect((): VoidFunction => {
    return signalRManager.addDealListener(setDeal);
  }, [setDeal]);
};
