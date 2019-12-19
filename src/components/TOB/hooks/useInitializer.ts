import {OrderTypes} from 'interfaces/mdEntry';
import {Order} from 'interfaces/order';
import {TOBRow, TOBRowStatus} from 'interfaces/tobRow';
import {TOBTable} from 'interfaces/tobTable';
import {TenorType} from 'interfaces/w';
import {useEffect} from 'react';
import {toRowID} from 'utils';
import {compareTenors} from 'utils/dataGenerators';

const buildRows = (tenors: string[], symbol: string, strategy: string, email: string): TOBRow[] => {
  return tenors
    .map((tenor: TenorType) => {
      // This is here because javascript is super stupid and `connected' can change
      // while we're subscribing combinations.
      //
      // Ideally, we should implement the ability to stop
      const bid: Order = new Order(tenor, symbol, strategy, email, null, OrderTypes.Bid);
      const ofr: Order = new Order(tenor, symbol, strategy, email, null, OrderTypes.Ofr);

      const row: TOBRow = {
        tenor: tenor,
        id: toRowID(bid),
        bid: bid,
        darkPool: '',
        ofr: ofr,
        mid: null,
        spread: null,
        status: TOBRowStatus.Normal,
      };
      // Return row
      return row;
    })
    .sort(compareTenors);
};

export const useInitializer = (tenors: string[], symbol: string, strategy: string, email: string, initialize: (data: TOBTable) => void) => {
  useEffect(() => {
    if (!symbol || !strategy || symbol === '' || strategy === '')
      return;
    const reducer = (object: TOBTable, item: TOBRow): TOBTable => {
      object[item.id] = item;
      // Return the accumulator
      return object;
    };
    const rows: TOBRow[] = buildRows(tenors, symbol, strategy, email);
    // Initialize with base depth
    initialize(rows.reduce(reducer, {}));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbol, strategy, tenors, email]);
};

