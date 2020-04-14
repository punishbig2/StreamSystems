import { useEffect } from 'react';
import { SignalRManager } from 'redux/signalR/signalRManager';
import { W } from 'interfaces/w';
import { PodRow } from 'interfaces/podRow';
import { toPodRow } from 'utils/dataParser';
import { User } from 'interfaces/user';
import { PodRowStore } from 'mobx/stores/podRowStore';

export const useWListener = (symbol: string, strategy: string, tenor: string, user: User, connected: boolean, store: PodRowStore) => {
  useEffect(() => {
    if (!symbol || !strategy || symbol === '' || strategy === '')
      return;
    const signalRManager: SignalRManager = SignalRManager.getInstance();
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
  }, [symbol, strategy, tenor, connected, user, store]);
};

