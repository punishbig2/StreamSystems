import {OrderTypes} from 'interfaces/mdEntry';
import {Order} from 'interfaces/order';
import {TOBRow, TOBRowStatus} from 'interfaces/tobRow';
import {PodTable} from 'interfaces/podTable';
import {TenorType} from 'interfaces/w';
import {useEffect} from 'react';
import {compareTenors} from 'utils/dataGenerators';
import {FXOptionsDB} from 'fx-options-db';
import {toRowID} from 'utils';

const buildRows = async (tenors: string[], email: string): Promise<TOBRow[]> => {
  const rows: Promise<TOBRow>[] = tenors
    .map(async (tenor: TenorType) => {
      const order: Order = new Order(tenor, '', '', email, null, OrderTypes.Invalid);
      const darkPrice: number | null | undefined = await FXOptionsDB.getDarkPool(toRowID(order));
      const row: TOBRow = {
        tenor: tenor,
        id: `${tenor}`,
        bid: {...order, type: OrderTypes.Bid},
        ofr: {...order, type: OrderTypes.Ofr},
        mid: null,
        spread: null,
        darkPrice: darkPrice === undefined ? null : darkPrice,
        status: TOBRowStatus.Normal,
      };
      // Return internalRow
      return row;
    });
  const finalRows: TOBRow[] = await Promise.all(rows);
  finalRows.sort(compareTenors);
  return finalRows;
};

const doInitialize = (tenors: string[], email: string, initialize: (data: PodTable) => void): (() => void)[] => {
  const arrayToObjectReducer = (object: PodTable, item: TOBRow): PodTable => {
    object[item.id] = item;
    // Return the accumulator
    return object;
  };
  buildRows(tenors, email)
    .then((rows: TOBRow[]) => {
      initialize(rows.reduce(arrayToObjectReducer, {}));
    });
  return [];
};

export const useInitializer = (tenors: string[], email: string, initialize: (data: PodTable) => void) => {
  useEffect(() => {
    const cleanups: (() => void)[] = doInitialize(tenors, email, initialize);
    return () => {
      cleanups.forEach((cleanup) => cleanup());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenors, email]);
};

