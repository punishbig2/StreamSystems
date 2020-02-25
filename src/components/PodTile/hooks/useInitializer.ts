import {OrderTypes} from 'interfaces/mdEntry';
import {Order} from 'interfaces/order';
import {PodRow, PodRowStatus} from 'interfaces/podRow';
import {PodTable} from 'interfaces/podTable';
import {TenorType} from 'interfaces/w';
import {useEffect} from 'react';
import {compareTenors} from 'utils/dataGenerators';

const buildRows = async (tenors: string[], email: string): Promise<PodRow[]> => {
  const rows: Promise<PodRow>[] = tenors
    .map(async (tenor: TenorType) => {
      const order: Order = new Order(tenor, '', '', email, null, OrderTypes.Invalid);
      const row: PodRow = {
        tenor: tenor,
        id: `${tenor}`,
        bid: {...order, type: OrderTypes.Bid},
        ofr: {...order, type: OrderTypes.Ofr},
        mid: null,
        spread: null,
        darkPrice: null,
        status: PodRowStatus.Normal,
      };
      // Return internalRow
      return row;
    });
  const finalRows: PodRow[] = await Promise.all(rows);
  finalRows.sort(compareTenors);
  return finalRows;
};

const doInitialize = (tenors: string[], email: string, initialize: (data: PodTable) => void): (() => void)[] => {
  const arrayToObjectReducer = (object: PodTable, item: PodRow): PodTable => {
    object[item.id] = item;
    // Return the accumulator
    return object;
  };
  buildRows(tenors, email)
    .then((rows: PodRow[]) => {
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

