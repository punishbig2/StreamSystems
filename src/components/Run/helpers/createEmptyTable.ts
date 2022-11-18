import { OrderTypes } from 'types/mdEntry';
import { Order } from 'types/order';
import { PodRow, PodRowStatus } from 'types/podRow';
import { PodTable } from 'types/podTable';
import { $$ } from 'utils/stringPaster';
import { compareTenors } from 'utils/tenorUtils';

export const createEmptyTable = (
  symbol: string,
  strategy: string,
  tenors: readonly string[]
): PodTable => {
  const rows: PodRow[] = tenors.map((tenor: string) => {
    const order: Order = new Order(tenor, symbol, strategy, '', 0, OrderTypes.Invalid);
    return {
      id: $$('run', symbol, strategy, tenor), // $$(toRunId(symbol, strategy), tenor),
      tenor: tenor,
      bid: { ...order, type: OrderTypes.Bid },
      ofr: { ...order, type: OrderTypes.Ofr },
      mid: null,
      spread: null,
      darkPrice: null,
      status: PodRowStatus.Normal,
    };
  });
  return rows.sort(compareTenors).reduce((table: PodTable, row: PodRow) => {
    table[row.id] = row;
    return table;
  }, {});
};
