import { TOBRow } from "interfaces/tobRow";
import { TOBTable } from "interfaces/tobTable";
import { useEffect } from "react";
import { Subscriber } from "redux/signalRAction";

type GetSnapshot = (symbol: string, strategy: string, tenor: string) => void;
type GetOrders = (symbol: string, strategy: string) => any;
export const useSubscriber = (
  rows: TOBTable,
  connected: boolean,
  symbol: string,
  strategy: string,
  subscribe: Subscriber,
  subscribeDarkPool: Subscriber,
  unsubscribe: Subscriber,
  getSnapshot: GetSnapshot,
  getDarkPoolSnapshot: GetSnapshot,
  getRunOrders: GetOrders
) => {
  const array: TOBRow[] = Object.values(rows);
  const count: number = array.length;
  useEffect(() => {
    if (connected) {
      // Get all of the snapshots
      const destroy = array.map(({ tenor }: TOBRow) => {
        getSnapshot(symbol, strategy, tenor);
        getDarkPoolSnapshot(symbol, strategy, tenor);
        subscribe(symbol, strategy, tenor);
        subscribeDarkPool(symbol, strategy, tenor);
        return () => unsubscribe(symbol, strategy, tenor);
      });
      // Get the canceled orders for the run window
      getRunOrders(symbol, strategy);
      // Unsubscribe all
      return () => destroy.forEach((fn: () => void) => fn());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connected, symbol, strategy, count]);
};
