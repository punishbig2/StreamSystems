import { OrderTypes } from 'interfaces/mdEntry';
import { Order } from 'interfaces/order';
import { PodRow, PodRowStatus } from 'interfaces/podRow';
import { PodTable } from 'interfaces/podTable';
import { TenorType } from 'interfaces/w';
import { useEffect } from 'react';
import { compareTenors } from 'utils/dataGenerators';
import { User } from 'interfaces/user';

const buildRows = async (tenors: string[], email: string): Promise<PodRow[]> => {
  const rows: PodRow[] = tenors
    .map((tenor: TenorType) => {
      const order: Order = new Order(tenor, '', '', email, null, OrderTypes.Invalid);
      const row: PodRow = {
        tenor: tenor,
        id: `${tenor}`,
        bid: { ...order, type: OrderTypes.Bid },
        ofr: { ...order, type: OrderTypes.Ofr },
        mid: null,
        spread: null,
        darkPrice: null,
        status: PodRowStatus.Normal,
      };
      // Return internalRow
      return row;
    });
  rows.sort(compareTenors);
  return rows;
};

type PodInitializer = (data: PodTable) => void;
const populateEmptyTOB = (tenors: string[], email: string, initialize: PodInitializer) => {
  const arrayToObjectReducer = (object: PodTable, item: PodRow): PodTable => {
    object[item.id] = item;
    // Return the accumulator
    return object;
  };
  buildRows(tenors, email)
    .then((rows: PodRow[]) => {
      initialize(rows.reduce(arrayToObjectReducer, {}));
    });
};

export const useInitializer = (tenors: string[], user: User, initialize: PodInitializer) => {
  useEffect(() => {
    populateEmptyTOB(tenors, user.email, initialize);
  }, [tenors, user, initialize]);
};

