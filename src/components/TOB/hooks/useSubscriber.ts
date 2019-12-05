import {TOBRow} from 'interfaces/tobRow';
import {TOBTable} from 'interfaces/tobTable';
import {useEffect} from 'react';

type Subscriber = (symbol: string, strategy: string, tenor: string) => void;
export const useSubscriber = (
  rows: TOBTable,
  connected: boolean,
  symbol: string,
  strategy: string,
  subscribe: Subscriber,
  getRunOrders: (symbol: string, strategy: string) => any,
  getSnapshot: (symbol: string, strategy: string, tenor: string) => void,
) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!rows || !connected)
        return;
      const array: TOBRow[] = Object.values(rows);
      if (connected) {
        // Subscribe to symbol/strategy/tenor combination
        array.forEach(({tenor}: TOBRow) => {
          getSnapshot(symbol, strategy, tenor);
          subscribe(symbol, strategy, tenor);
        });
      }
      // Get run-orders too
      getRunOrders(symbol, strategy);
    }, 5000);
    return () => clearTimeout(timer);
  }, [connected, rows, strategy, symbol, subscribe, getRunOrders, getSnapshot]);
};
