import { useEffect } from 'react';
import { OrderTypes } from 'types/mdEntry';
import { Order } from 'types/order';
import { PodRow, PodRowStatus } from 'types/podRow';
import { PodTable } from 'types/podTable';
import { User } from 'types/user';
import { TenorType } from 'types/w';
import { compareTenors } from 'utils/tenorUtils';

const buildRows = async (
  tenors: readonly string[],
  currency: string,
  strategy: string,
  email: string
): Promise<PodRow[]> => {
  const rows: PodRow[] = tenors.map((tenor: TenorType) => {
    const order: Order = new Order(tenor, currency, strategy, email, null, OrderTypes.Invalid);
    const row: PodRow = {
      tenor: tenor,
      id: tenor,
      bid: order,
      ofr: order,
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
const populateEmptyTOB = (
  tenors: readonly string[],
  currency: string,
  strategy: string,
  email: string,
  initialize: PodInitializer
) => {
  const arrayToObjectReducer = (object: PodTable, item: PodRow): PodTable => {
    object[item.id] = item;
    // Return the accumulator
    return object;
  };
  buildRows(tenors, currency, strategy, email).then((rows: PodRow[]) => {
    initialize(rows.reduce(arrayToObjectReducer, {}));
  });
};

export const useInitializer = (
  tenors: readonly string[],
  currency: string,
  strategy: string,
  user: User,
  initialize: PodInitializer
) => {
  useEffect(() => {
    populateEmptyTOB(tenors, currency, strategy, user.email, initialize);
    if (!currency || !strategy || strategy === '' || currency === '') {
      return;
    }
  }, [tenors, user, initialize, currency, strategy]);
};
