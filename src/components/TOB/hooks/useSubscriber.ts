import {TOBRow} from 'interfaces/tobRow';
import {TOBTable} from 'interfaces/tobTable';
import {useEffect} from 'react';
import {Subscriber} from 'redux/signalRAction';

type GetSnapshot = (symbol: string, strategy: string, tenor: string) => void;
type GetOrders = (symbol: string, strategy: string) => any;
export const useSubscriber = (
  rows: TOBTable,
  connected: boolean,
  symbol: string,
  strategy: string,
  subscribe: Subscriber,
  unsubscribe: Subscriber,
  getSnapshot: GetSnapshot,
  getRunOrders: GetOrders,
) => {
  useEffect(() => {
    const array: TOBRow[] = Object.values(rows);
    if (connected && array.length !== 0) {
      // Get all of the snapshots
      array.forEach((row: TOBRow) => {
        getSnapshot(symbol, strategy, row.tenor);
      });
      // Subscribe to symbol/strategy/tenor combination
      array.forEach(({tenor}: TOBRow) => subscribe(symbol, strategy, tenor));
      // Get the canceled orders for the run window
      getRunOrders(symbol, strategy);
      // Unsubscribe all
      return () => {
        array.forEach(({tenor}: TOBRow) => {
          unsubscribe(symbol, strategy, tenor);
        });
      };
    }
  }, [connected, rows, strategy, symbol, subscribe, unsubscribe, getSnapshot, getRunOrders]);
};

