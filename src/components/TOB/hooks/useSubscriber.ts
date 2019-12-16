import {TOBRow} from 'interfaces/tobRow';
import {TOBTable} from 'interfaces/tobTable';
import {useEffect} from 'react';

type Subscriber = (symbol: string, strategy: string, tenor: string) => void;
type GetSnapshot = (symbol: string, strategy: string, tenor: string) => void;
type GetOrders = (symbol: string, strategy: string) => any;
export const useSubscriber = (
  rows: TOBTable,
  connected: boolean,
  symbol: string,
  strategy: string,
  subscribe: Subscriber,
  getSnapshot: GetSnapshot,
  getRunOrders: GetOrders,
) => {
  useEffect(() => {
    const array: TOBRow[] = Object.values(rows);
    console.log('initialized', connected);
    // Subscribe to symbol/strategy/tenor combination
    array.forEach(({tenor}: TOBRow) => subscribe(symbol, strategy, tenor));
    array.forEach((row: TOBRow) => getSnapshot(symbol, strategy, row.tenor));
    getRunOrders(symbol, strategy);
  }, [connected, rows, strategy, symbol, subscribe, getSnapshot, getRunOrders]);
};
