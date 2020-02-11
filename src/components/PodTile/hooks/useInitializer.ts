import {OrderTypes} from 'interfaces/mdEntry';
import {Order} from 'interfaces/order';
import {TOBRow, TOBRowStatus} from 'interfaces/tobRow';
import {TOBTable} from 'interfaces/tobTable';
import {TenorType} from 'interfaces/w';
import {useEffect} from 'react';
import {toRowID} from 'utils';
import {compareTenors} from 'utils/dataGenerators';
import {injectNamedReducer, removeNamedReducer} from 'redux/store';
import {createRowReducer} from 'redux/reducers/rowReducer';

const buildRows = (tenors: string[], symbol: string, strategy: string, email: string): TOBRow[] => {
  const rows: TOBRow[] = tenors
    .map((tenor: TenorType) => {
      // This is here because javascript is super stupid and `connected' can change
      // while we're subscribing combinations.
      //
      // Ideally, we should implement the ability to stop
      const bid: Order = new Order(
        tenor,
        symbol,
        strategy,
        email,
        null,
        OrderTypes.Bid,
      );
      const ofr: Order = new Order(
        tenor,
        symbol,
        strategy,
        email,
        null,
        OrderTypes.Ofr,
      );

      // const rowID: string = toRowID(bid);
      const darkPrice: number | null | undefined = null; //  await FXOptionsDB.getDarkPool(rowID);
      const row: TOBRow = {
        tenor: tenor,
        id: toRowID(bid),
        bid: bid,
        ofr: ofr,
        mid: null,
        spread: null,
        darkPrice: darkPrice === undefined ? null : darkPrice,
        status: TOBRowStatus.Normal,
      };
      // Return row
      return row;
    });
  rows.sort(compareTenors);
  return rows;
};

const doInitialize = (tenors: string[], symbol: string, strategy: string, email: string, initialize: (data: TOBTable) => void): (() => void)[] => {
  if (!symbol || !strategy || symbol === '' || strategy === '')
    return [];
  const reducer = (object: TOBTable, item: TOBRow): TOBTable => {
    object[item.id] = item;
    // Return the accumulator
    return object;
  };

  const rows = buildRows(tenors, symbol, strategy, email);
  const cleanups: (() => void)[] = rows.map((row: TOBRow) => {
    injectNamedReducer(row.id, createRowReducer, {row});
    return () => removeNamedReducer(row.id);
  });
  initialize(rows.reduce(reducer, {}));
  return cleanups;
};

export const useInitializer = (tenors: string[], symbol: string, strategy: string, email: string, initialize: (data: TOBTable) => void) => {
  useEffect(() => {
    const cleanups: (() => void)[] = doInitialize(tenors, symbol, strategy, email, initialize);
    return () => {
      cleanups.forEach((cleanup) => cleanup());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbol, strategy, tenors, email]);
};

