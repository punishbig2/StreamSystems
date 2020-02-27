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

type PodInitializer = (workspaceID: string, windowID: string, data: PodTable) => void;
const doInitialize = (workspaceID: string, windowID: string, tenors: string[], email: string, initialize: PodInitializer) => {
  const arrayToObjectReducer = (object: PodTable, item: PodRow): PodTable => {
    object[item.id] = item;
    // Return the accumulator
    return object;
  };
  buildRows(tenors, email)
    .then((rows: PodRow[]) => {
      initialize(workspaceID, windowID, rows.reduce(arrayToObjectReducer, {}));
    });
};

export const useInitializer = (workspaceID: string, windowID: string, tenors: string[], email: string, initialize: PodInitializer) => {
  useEffect(() => {
    doInitialize(workspaceID, windowID, tenors, email, initialize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenors, email]);
};

