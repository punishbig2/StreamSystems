import {PodRow} from 'interfaces/podRow';
import {PodTable} from 'interfaces/podTable';
import {useEffect} from 'react';
import {Subscriber} from 'redux/signalRAction';

type GetSnapshot = (symbol: string, strategy: string, tenor: string) => void;
type GetOrders = (symbol: string, strategy: string) => any;
export const useSubscriber = (
  rows: PodTable,
  connected: boolean,
  symbol: string,
  strategy: string,
  subscribeDarkPool: Subscriber,
  getSnapshot: GetSnapshot,
  getDarkPoolSnapshot: GetSnapshot,
  getRunOrders: GetOrders,
) => {
  const array: PodRow[] = Object.values(rows);
  const count: number = array.length;
  useEffect(() => {
    // Get all of the snapshots
    const destroy = array.map(({tenor}: PodRow) => {
      // getSnapshot(symbol, strategy, tenor);
      getDarkPoolSnapshot(symbol, strategy, tenor);
      // subscribe(symbol, strategy, tenor);
      subscribeDarkPool(symbol, strategy, tenor);
      return () => null;
    });
    // Get the canceled orders for the run window
    getRunOrders(symbol, strategy);
    // Unsubscribe all
    return () => destroy.forEach((fn: () => void) => fn());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connected, symbol, strategy, count]);
};
