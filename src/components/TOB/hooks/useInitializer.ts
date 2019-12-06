import {TOBRow, TOBRowStatus} from 'interfaces/tobRow';
import {TOBTable} from 'interfaces/tobTable';
import {TenorType} from 'interfaces/w';
import {useEffect} from 'react';
import {toRowId} from 'utils';
import {compareTenors, emptyBid, emptyOffer} from 'utils/dataGenerators';

const buildRows = (tenors: string[], symbol: string, strategy: string, email: string): TOBRow[] => {
  return tenors
    .map((tenor: TenorType) => {
      // This is here because javascript is super stupid and `connected' can change
      // while we're subscribing combinations.
      //
      // Ideally, we should implement the ability to stop
      const row: TOBRow = {
        tenor: tenor,
        id: toRowId(tenor, symbol, strategy),
        bid: emptyBid(tenor, symbol, strategy, email),
        darkPool: '',
        ofr: emptyOffer(tenor, symbol, strategy, email),
        mid: null,
        spread: null,
        status: TOBRowStatus.Normal,
      };
      // Return row
      return row;
    })
    .sort(compareTenors);
};

export const useInitializer = (
  tenors: string[],
  symbol: string,
  strategy: string,
  email: string,
  initialize: (data: TOBTable) => void,
  getSnapshot: (symbol: string, strategy: string, tenor: string) => void,
  getRunOrders: (symbol: string, strategy: string) => any,
) => {
  useEffect(() => {
    if (!symbol || !strategy || symbol === '' || strategy === '')
      return;
    const reducer = (object: TOBTable, item: TOBRow): TOBTable => {
      object[item.id] = item;
      // Return the accumulator
      return object;
    };
    const rows: TOBRow[] = buildRows(tenors, symbol, strategy, email);
    rows.forEach((row: TOBRow) => {
      getSnapshot(symbol, strategy, row.tenor);
    });
    getRunOrders(symbol, strategy);
    // Initialize with base depth
    initialize(rows.reduce(reducer, {}));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbol, strategy, tenors, email]);
};

