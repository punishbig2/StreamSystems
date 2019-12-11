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
  getSnapshot: (symbol: string, strategy: string, tenor: string) => void,
  getRunOrders: (symbol: string, strategy: string) => any,
) => {
  useEffect(() => {
    if (!rows || !connected)
      return;
    const array: TOBRow[] = Object.values(rows);
    if (connected) {
      // Subscribe to symbol/strategy/tenor combination
      array.forEach(({tenor}: TOBRow) => {
        subscribe(symbol, strategy, tenor);
      });
    }
    array.forEach((row: TOBRow) => {
      getSnapshot(symbol, strategy, row.tenor);
    });
    getRunOrders(symbol, strategy);
  }, [connected, rows, strategy, symbol, subscribe, getSnapshot, getRunOrders]);
};
