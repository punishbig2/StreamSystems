import {OrderTypes} from 'interfaces/mdEntry';
import {Order} from 'interfaces/order';
import {TOBRow, TOBRowStatus} from 'interfaces/tobRow';
import {TOBTable} from 'interfaces/tobTable';
import {TenorType} from 'interfaces/w';
import {useEffect} from 'react';
import {toRowID} from 'utils';
import {compareTenors} from 'utils/dataGenerators';
import {FXOptionsDB} from 'fx-options-db';

const buildRows = async (
  tenors: string[],
  symbol: string,
  strategy: string,
  email: string,
): Promise<TOBRow[]> => {
  const rows: TOBRow[] = await Promise.all(
    tenors
      .map(async (tenor: TenorType) => {
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

        const rowID: string = toRowID(bid);
        const darkPrice: number | null | undefined = await FXOptionsDB.getDarkPool(rowID);
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
      }),
  );
  rows.sort(compareTenors);
  return rows;
};

export const useInitializer = (
  tenors: string[],
  symbol: string,
  strategy: string,
  email: string,
  initialize: (data: TOBTable) => void,
) => {
  useEffect(() => {
    if (!symbol || !strategy || symbol === '' || strategy === '') return;
    const reducer = (object: TOBTable, item: TOBRow): TOBTable => {
      object[item.id] = item;
      // Return the accumulator
      return object;
    };
    buildRows(tenors, symbol, strategy, email)
      .then((rows: TOBRow[]) => {
        initialize(rows.reduce(reducer, {}));
      });
    // Initialize with base depth
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbol, strategy, tenors, email]);
};

