import { useEffect } from 'react';
import signalRManager from 'signalR/signalRManager';
import { W } from 'interfaces/w';
import { PodRow } from 'interfaces/podRow';
import { toPodRow } from 'utils/dataParser';
import { User } from 'interfaces/user';
import { PodRowStore } from 'mobx/stores/podRowStore';
import workareaStore from 'mobx/stores/workareaStore';

export const useWListener = (symbol: string, strategy: string, tenor: string, store: PodRowStore) => {
  useEffect(() => {
    const user: User = workareaStore.user;
    if (!symbol || !strategy || symbol === '' || strategy === '')
      return;
    const listener = async (w: W) => {
      const row: PodRow = toPodRow(w, user);
      // Update the dark price
      // FIXME: maybe this is the only one we should keep?
      // row.darkPrice = await FXOptionsDB.getDarkPool($$(symbol, strategy, tenor));
      // Update us
      store.setInternalRow(row);
    };
    // Create an array of "unsubscribe/remove listener" functions
    signalRManager.setTOBWListener(symbol, strategy, tenor, listener);
    return () => {
      signalRManager.removeTOBWListener(symbol, strategy, tenor);
    };
  }, [symbol, strategy, tenor, store]);
};

